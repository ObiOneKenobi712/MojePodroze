import type { Countdown } from "../../types/api";
import { countdownText } from "../../utils/format";
import Widget from "../../components/Widget/Widget";
import styles from "./TripsPage.module.css";

export default function NextTripWidget({ countdown }: { countdown: Countdown | null }) {
  return (
    <Widget
      title="Najbliższa podróż"
      accent="--widget-next-trip"
      testId="widget-next-trip"
      className={styles.nextTripWidget}
    >
      {countdown ? (
        <p className={styles.countdown} data-testid="countdown">
          {countdownText(countdown.days_left, countdown.destination_city)}
        </p>
      ) : (
        <p className={styles.muted}>Brak zaplanowanych podróży.</p>
      )}
    </Widget>
  );
}
