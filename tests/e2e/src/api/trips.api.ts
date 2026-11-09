import { AddTripModel, TripStatus } from "@_src/models/trip.model";
import { step } from "@_src/utils/step.decorator";
import { APIRequestContext, expect } from "@playwright/test";

const STATUS_PATHS: Record<TripStatus, TripStatus[]> = {
  planned: [],
  in_progress: ["in_progress"],
  completed: ["in_progress", "completed"],
  archived: ["in_progress", "completed", "archived"],
};

export class TripsApi {
  headers: { "X-User-Id": string };

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

    for (const nextStatus of STATUS_PATHS[status]) {
      await this.changeStatus(id, nextStatus);
    }

    return id;
  }

  async changeStatus(tripId: number, status: TripStatus): Promise<void> {
    const response = await this.request.post(`/api/trips/${tripId}/status`, {
      headers: this.headers,
      data: { status },
    });
    expect(response.status()).toBe(200);
  }
}
