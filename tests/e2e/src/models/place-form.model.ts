export type PlaceKind = "accommodation" | "attraction";

export interface PlaceFormModel {
  name: string;
  kind: PlaceKind;
  date: string;
  checkOutDate?: string;
  cost: string;
  rating?: string;
  note?: string;
}
