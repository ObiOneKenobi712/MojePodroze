import type { TripStatus } from "../../types/api";
import { capitalize } from "../../utils/format";
import styles from "./StatusLabel.module.css";

interface Props {
  status: TripStatus;
  label: string;
}

/** Etykieta statusu: napis + kolorowa kreska (kolor nie jest jedyną informacją – WCAG 1.4.1). */
export default function StatusLabel({ status, label }: Props) {
  return (
    <span className={`${styles.label} ${styles[status]}`} data-testid="trip-status">
      {capitalize(label)}
    </span>
  );
}
