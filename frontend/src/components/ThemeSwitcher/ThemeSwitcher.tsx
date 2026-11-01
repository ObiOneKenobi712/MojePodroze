import { useId, useState } from "react";
import type { ReactNode } from "react";
import { getTheme, setTheme } from "../../utils/theme";
import type { Theme } from "../../utils/theme";
import styles from "./ThemeSwitcher.module.css";

const OPTIONS: { theme: Theme; label: string; icon: ReactNode }[] = [
  {
    theme: "light",
    label: "Jasny",
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    theme: "dark",
    label: "Ciemny",
    icon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" strokeLinejoin="round" />,
  },
  {
    theme: "contrast",
    label: "Wysoki kontrast",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
      </>
    ),
  },
];

// Wybór wyglądu: Jasny / Ciemny / Wysoki kontrast. Przyciski radiowe (strzałki zmieniają wybór),
// na komputerze same ikony z podpowiedzią, na telefonie (w menu ☰) ikony z napisami – CSS.
export default function ThemeSwitcher() {
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const name = useId();

  function choose(next: Theme) {
    setTheme(next);
    setThemeState(next);
  }

  return (
    <fieldset className={styles.switcher} data-testid="theme-switcher">
      <legend className={styles.legend}>Wygląd</legend>
      <div className={styles.options}>
        {OPTIONS.map((o) => (
          <label key={o.theme} className={styles.option} title={o.label}>
            <input
              type="radio"
              name={name}
              value={o.theme}
              checked={theme === o.theme}
              onChange={() => choose(o.theme)}
              className={styles.radio}
              data-testid={`theme-${o.theme}`}
            />
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {o.icon}
            </svg>
            <span className={styles.text}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
