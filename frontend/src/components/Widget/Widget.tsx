import type { ReactNode } from "react";
import styles from "./Widget.module.css";

interface Props {
  title: string;
  accent: string; // nazwa zmiennej CSS, np. "--widget-weather"
  testId: string;
  /** Dodatkowa klasa, np. wyróżniające tło */
  className?: string;
  children: ReactNode;
}

/** Biały kafel z tytułem i kolorową kreską – widżety ekranu głównego. */
export default function Widget({ title, accent, testId, className, children }: Props) {
  return (
    <section className={className ? `${styles.widget} ${className}` : styles.widget} aria-label={title} data-testid={testId}>
      <h2 className={styles.title} style={{ borderBottomColor: `var(${accent})` }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
