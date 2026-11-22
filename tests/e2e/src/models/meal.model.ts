export interface AddMealModel {
  dish: string;
  restaurant_name: string;
  meal_date: string;
  cost: number;
  rating?: number | null;
}
