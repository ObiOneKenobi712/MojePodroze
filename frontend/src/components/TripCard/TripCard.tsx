import { Link } from "react-router";
import type { Trip } from "../../types/api";
import { capitalize, formatDate } from "../../utils/format";
import StatusLabel from "../StatusLabel/StatusLabel";
import TripCover from "./TripCover";
import styles from "./TripCard.module.css";

export default function TripCard({ trip }: { trip: Trip }) {
  return (
    <Link to={`/podroze/${trip.id}`} className={styles.card} data-testid="trip-card">
      <div className={styles.body}>
        <StatusLabel status={trip.status} label={trip.status_label} />
        <h2 className={styles.title}>{trip.name}</h2>
        <p className={styles.meta}>
          {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
          <span aria-hidden="true"> · </span>
          <span className="visually-hidden">, </span>
          {capitalize(trip.trip_type_label)}
          <span aria-hidden="true"> · </span>
          <span className="visually-hidden">, </span>
          {trip.character.name}
        </p>
      </div>
      <TripCover tripId={trip.id} />
      {/* Strzałka na okładce: sygnał, że karta jest klikalna (dekoracja – link opisuje tytuł) */}
      <span className={styles.arrow} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
