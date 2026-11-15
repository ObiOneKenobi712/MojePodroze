import { PlaceKind } from "@_src/models/place-form.model";

export interface AddPlaceModel {
  name: string;
  kind: PlaceKind;
  visit_date: string;
  check_out_date?: string | null;
  cost: number;
  rating?: number | null;
  note?: string | null;
}
