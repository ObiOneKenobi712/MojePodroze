import { AddFlightModel } from "@_src/models/flight.model";
import { AddMealModel } from "@_src/models/meal.model";
import { AddPlaceModel } from "@_src/models/place.model";
import { AddTripModel, TripStatus } from "@_src/models/trip.model";
import { AddWishlistItemModel } from "@_src/models/wishlist-item.model";
import { step } from "@_src/utils/step.decorator";
import { APIRequestContext, expect } from "@playwright/test";

const STATUS_PATHS: Record<TripStatus, TripStatus[]> = {
  planned: [],
  in_progress: ["in_progress"],
  completed: ["in_progress", "completed"],
  archived: ["in_progress", "completed", "archived"],
};

interface TripResponse {
  id: number;
  name: string;
  status: TripStatus;
}

export class TripsApi {
  headers: { "X-User-Id": string };
  tripNamesToDelete: string[] = [];

  constructor(
    private request: APIRequestContext,
    userId: string,
  ) {
    this.headers = { "X-User-Id": userId };
  }

  @step((trip: AddTripModel, status: TripStatus) => `Utwórz przez API podróż „${trip.name}” o statusie ${status}`)
  async createTrip(trip: AddTripModel, status: TripStatus): Promise<number> {
    const response = await this.request.post("/api/trips", { headers: this.headers, data: trip });
    expect(response.status()).toBe(201);

    const { id } = await response.json();
    this.addTripToCleanup(trip.name);
    await this.moveTripToStatus(id, status);

    return id;
  }

  @step((tripId: number, status: TripStatus) => `Przenieś przez API podróż ${tripId} ze statusu „w planie” do ${status}`)
  async moveTripToStatus(tripId: number, status: TripStatus): Promise<void> {
    for (const nextStatus of STATUS_PATHS[status]) {
      await this.changeStatus(tripId, nextStatus);
    }
  }

  @step("Dodaj przez API lot do podróży")
  async createFlight(tripId: number, flight: AddFlightModel): Promise<number> {
    return this.createTripItem(tripId, "flights", flight);
  }

  @step((tripId: number, meal: AddMealModel) => `Dodaj przez API posiłek w „${meal.restaurant_name}”`)
  async createMeal(tripId: number, meal: AddMealModel): Promise<number> {
    return this.createTripItem(tripId, "meals", meal);
  }

  @step((tripId: number, place: AddPlaceModel) => `Dodaj przez API nocleg lub atrakcję „${place.name}”`)
  async createPlace(tripId: number, place: AddPlaceModel): Promise<number> {
    return this.createTripItem(tripId, "places", place);
  }

  @step((tripId: number, item: AddWishlistItemModel, visited: boolean) =>
    `Dodaj przez API punkt „${item.name}” do listy „Chcę odwiedzić”${visited ? " jako zaliczony" : ""}`,
  )
  async createWishlistItem(tripId: number, item: AddWishlistItemModel, visited: boolean): Promise<number> {
    const id = await this.createTripItem(tripId, "wishlist", item);

    if (visited) {
      const response = await this.request.patch(`/api/trips/${tripId}/wishlist/${id}`, {
        headers: this.headers,
        data: { visited: true },
      });
      expect(response.status()).toBe(200);
    }

    return id;
  }

  async createTripItem(tripId: number, path: string, item: object): Promise<number> {
    const response = await this.request.post(`/api/trips/${tripId}/${path}`, { headers: this.headers, data: item });
    expect(response.status()).toBe(201);

    const { id } = await response.json();
    return id;
  }

  async changeStatus(tripId: number, status: TripStatus): Promise<void> {
    const response = await this.request.post(`/api/trips/${tripId}/status`, {
      headers: this.headers,
      data: { status },
    });
    expect(response.status()).toBe(200);
  }

  addTripToCleanup(tripName: string): void {
    this.tripNamesToDelete.push(tripName);
  }

  @step("Usuń przez API podróże utworzone w teście")
  async deleteTestTrips(): Promise<void> {
    const response = await this.request.get("/api/trips", { headers: this.headers });
    const trips: TripResponse[] = await response.json();
    const testTrips = trips.filter((trip) => this.tripNamesToDelete.includes(trip.name));

    for (const trip of testTrips) {
      if (trip.status === "archived") {
        await this.changeStatus(trip.id, "completed");
      }

      const deleteResponse = await this.request.delete(`/api/trips/${trip.id}`, { headers: this.headers });
      expect(deleteResponse.status()).toBe(204);
    }
  }
}
