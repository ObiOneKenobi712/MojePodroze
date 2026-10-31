// Motyw wyglądu: atrybut data-theme na <html> przełącza tokeny z tokens.css.
// Wybór zapisany w localStorage; bez wyboru – ustawienie systemu (index.html ustawia je przed pierwszym rysowaniem).

export type Theme = "light" | "dark" | "contrast";

const THEME_KEY = "theme";

export function getTheme(): Theme {
  const current = document.documentElement.dataset.theme;
  return current === "dark" || current === "contrast" ? current : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // tryb prywatny / zablokowany localStorage – motyw działa do odświeżenia strony
  }
}
