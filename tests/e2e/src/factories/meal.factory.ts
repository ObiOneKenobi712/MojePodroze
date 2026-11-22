import { AddMealModel } from "@_src/models/meal.model";
import { AddTripModel } from "@_src/models/trip.model";

export function prepareMeal(trip: AddTripModel): AddMealModel {
  return {
    dish: "Pierogi",
    restaurant_name: "Pierogarnia",
    meal_date: trip.start_date,
    cost: 60,
    rating: 5,
  };
}
