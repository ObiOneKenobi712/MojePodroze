# Styl wizualny frontendu – odświeżony „Trouvaille”

Wzór dla frontendu aplikacji „Moje podróże”. Bazą są makiety wybrane przez grupę
([makiety-styl-trouvaille.pdf](makiety-styl-trouvaille.pdf), 11 ekranów) – **układ ekranów zostaje
taki jak w makietach**. Zmiany względem makiet:

- zaokrąglone rogi kart, widżetów i przycisków,
- przyciski w kolorze szałwii zamiast czarnego,
- bez różowego akcentu w trybie jasnym (aktywna zakładka podkreślona szałwią),
- tryb ciemny na zielonkawym graficie zamiast czerni, z przygaszonym różem tylko do wyróżnienia,
- wyraźniejsze linie pól i widoczny fokus – zgodność z **WCAG 2.0, poziom AA**.

Odświeżone ekrany (lista podróży: desktop, telefon, tryb ciemny) są na kanwie projektu
„Moje podróże – odświeżony Trouvaille” w claude.ai.

## Technologia stylów

Bez frameworka CSS. **CSS Modules** (wbudowane w Vite) + globalne **tokeny jako zmienne CSS**:

```
frontend/src/
├── styles/
│   ├── tokens.css      ← zmienne z sekcji „Tokeny” (+ tryb ciemny)
│   └── global.css      ← fonty, reset, body, fokus
└── components/
    └── TripCard/
        ├── TripCard.tsx
        └── TripCard.module.css
```

## Tokeny (zmienne CSS)

```css
:root {
  /* fonty */
  --font-body: "Raleway", system-ui, sans-serif;
  --font-logo: "Yellowtail", cursive;

  /* tło i powierzchnie */
  --color-bg: #ffffff;
  --color-surface: #ffffff;              /* karty i widżety (odcina je cień) */
  --color-brand-panel: #4e5d56;          /* panel na ekranie logowania */

  /* tekst */
  --color-text: #27302c;                 /* ciemny szarozielony zamiast czerni */
  --color-text-muted: #5f6b65;           /* etykiety, daty, opisy */
  --color-text-on-accent: #ffffff;

  /* przyciski i akcent */
  --color-accent: #5f7a6c;               /* szałwia: przycisk główny, aktywna zakładka, fokus */
  --color-accent-hover: #4e6658;         /* ciemniejsza szałwia: przycisk główny po najechaniu i z fokusem */
  --color-accent-active: #9fb8a6;        /* jasna szałwia: przycisk główny w chwili kliknięcia, tekst --color-text */
  --color-btn-secondary-border: #5f7a6c; /* przycisk poboczny: biały z obrysem */

  /* linie */
  --color-field-line: #7d8882;           /* linia pod polem formularza (3,7 : 1) */
  --color-divider: rgba(39, 48, 44, 0.1);/* linie podziału, nagłówek */

  /* statusy podróży (kreska pod etykietą, zawsze z napisem obok);
     nazwa = wartość statusu z API, podkreślnik zamieniony na myślnik */
  --status-planned: #3b6df5;             /* W PLANIE */
  --status-in-progress: #f1b647;         /* W TRAKCIE */
  --status-completed: #17a34a;           /* ZREALIZOWANA */
  --status-archived: #8a8a94;            /* ARCHIWUM */

  /* kreska pod tytułem widżetu */
  --widget-next-trip: #f1b647;           /* „Najbliższa podróż” */
  --widget-weather: #3b6df5;             /* „Pogoda” */
  --widget-rates: #17a34a;               /* „Kursy NBP” */

  /* komunikaty */
  --color-warning-bg: #fef3c6;
  --color-warning-bar: #d97605;
  --color-error-bg: #fee2e1;
  --color-error-text: #942827;

  /* miniatury zastępcze (gdy brak zdjęcia) */
  --placeholder-1: #c8a178;
  --placeholder-2: #7f9ab7;
  --placeholder-3: #d7a8a0;
  --placeholder-4: #9fb8a6;
  --placeholder-5: #b8b0d6;

  /* kształt */
  --radius-card: 16px;                   /* karty, widżety */
  --radius-button: 12px;                 /* przyciski */
  --radius-small: 10px;                  /* małe przyciski, pozycje menu */
  /* karta: cienka szara ramka (cień 1 px bez rozmycia) + słaby, neutralny cień */
  --shadow-card: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 8px 20px rgba(0, 0, 0, 0.07);

  /* fokus */
  --focus-ring: #5f7a6c;

  /* szerokość strony i marginesy boczne (na telefonie, do 640 px: 16px) */
  --page-width: 1280px;
  --page-padding: 32px;
}

[data-theme="dark"] {
  --color-bg: #18201c;                   /* głęboki zielonkawy grafit, nie czerń */
  --color-surface: #212b26;
  --color-text: #e8ece9;
  --color-text-muted: #a7b3ac;           /* opisy */
  --color-text-soft: #c9d1cc;            /* nieaktywne pozycje menu */
  --color-field-line: #7a8680;
  --color-divider: rgba(255, 255, 255, 0.08);
  --color-btn-secondary-border: #9fb8a6;
  --status-planned: #7b9bf5;             /* jaśniejszy niebieski na ciemnym tle */
  --widget-weather: #7b9bf5;
  --focus-ring: #9fb8a6;
  --shadow-card: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-card-hover: 0 0 0 1px rgba(255, 255, 255, 0.12), 0 8px 20px rgba(0, 0, 0, 0.4);

  /* przygaszony róż – tylko wyróżnienie aktywnej opcji / propozycji */
  --color-highlight-bg: #3a2a33;
  --color-highlight-border: rgba(242, 201, 220, 0.35);
  --color-highlight-text: #f6d6e5;
  --color-suggestion-bg: rgba(216, 167, 191, 0.1);
}
```

Przycisk główny w obu trybach: tło `--color-accent` (#5f7a6c), biały tekst.

W trybie ciemnym dodatkowo (poprawki kontrastu): `--color-accent-active: #3f5448` (jasny tekst 6,8 : 1),
`--color-error-bg: #4a2423`, `--color-error-text: #ffb4ae` (7,9 : 1), `--color-warning-bg: #4a3d17`;
przycisk „Usuń” w oknie potwierdzenia ma własny token `--color-danger` (#942827, biały tekst).

### Wybór wyglądu i wysoki kontrast

Przełącznik **Jasny · Ciemny · Wysoki kontrast** w nagłówku (na telefonie w menu ☰) ustawia
`data-theme="light" | "dark" | "contrast"` na `<html>` i zapamiętuje wybór w `localStorage` (klucz `theme`).
Bez zapisanego wyboru – ustawienie systemu (`prefers-contrast: more`, `prefers-color-scheme: dark`), ustawiane
skryptem w `index.html` przed pierwszym rysowaniem. `color-scheme` przełącza też natywne kontrolki (kalendarz, listy).
W trybie ciemnym wybrana opcja przełącznika ma przygaszony róż (jedyne wyróżnienie z projektu).

**Wysoki kontrast** (cel WCAG AAA 7 : 1) – jedyny tryb z czernią: tekst #000 (21 : 1), opisy #2b2b2b (14,2 : 1),
przyciski #1f4a35 z białym tekstem (10,1 : 1), linie pól i obrysy czarne, karty z czarną ramką 1 px zamiast cienia (po najechaniu 2 px),
ciemniejsze statusy (≥ 6,7 : 1), linki w tekście podkreślone, fokus: czarna obwódka 3 px + biały odstęp.

## Typografia

| Rola | Krój | Uwagi |
|---|---|---|
| Logo „Moje podróże” | Yellowtail (Google Fonts) | tylko logo |
| Cały interfejs | **Raleway** (Google Fonts) | `font-variant-numeric: lining-nums` – równe cyfry w datach i kwotach |
| Etykiety pól i statusów | Raleway 600, WERSALIKI, 12 px, `letter-spacing: 0.1em` | kolor `--color-text-muted`, kreska 2 px pod etykietą statusu |
| Tytuł karty podróży | Raleway 500, 24 px | |
| Duże liczby (temperatura, sumy) | Raleway 700, 34 px | |

## Układ (jak w makietach)

- Górny pasek: logo, „Moje podróże”, „Statystyki”, po prawej „Wyloguj”; cienka linia pod spodem.
- Lista podróży: kolumna główna (wyszukiwarka + „Nowa podróż” z ikoną plusa – obraca się o 90° po najechaniu, zakładki statusów z licznikami,
  karty) i kolumna widżetów (najbliższa podróż, pogoda, kursy NBP).
- Karta podróży: tekst po lewej (status, tytuł, daty · typ · charakter), zdjęcie po prawej (~38%).
- Pola formularzy: etykieta WERSALIKAMI nad polem, linia pod polem, bez ramki.
- Zakładki: aktywna pogrubiona i podkreślona kreską 2 px w kolorze szałwii; kreska przesuwa się płynnie
  pod nową zakładkę (`useTabIndicator`), a treść zakładki pojawia się z lekkim zanikaniem (0,2 s).
- Zdjęcie okładki wyłania się płynnie z koloru zastępczego (0,35 s); strzałka „←” w „Moje podróże”
  odsuwa się w lewo po najechaniu.
- Animacje są krótkie (0,15–0,35 s) i wyłączane przy `prefers-reduced-motion` (global.css).
- Karty i widżety: cienka szara ramka 1 px + słaby, neutralny cień (bez zielonkawego ani ciepłego odcienia).
- Po najechaniu karta lekko się unosi (cień `--shadow-card-hover`, przesunięcie 2 px).
- Na okładce karty, w prawym dolnym rogu: okrągła strzałka (tło białe, krycie 75%), skierowana ↗;
  po najechaniu lub z fokusem obraca się do →. Widoczna zawsze – sygnał, że karta jest klikalna.
- Mobile (do 640 px): nagłówek z logo i przyciskiem ☰ (menu rozwijane), zakładki statusów jako „pigułki”
  zawijane do nowej linii (aktywna – tło szałwii), kafel „Najbliższa podróż” nad listą.
- Telefon i wąski tablet (do 880 px): pasek na dole „Moich podróży” – Szukaj (panel z polem nad paskiem),
  Nowa podróż, Pogoda i Kursy NBP (panel wysuwany od dołu); wyszukiwarka i widżety znikają z listy.

## Dostępność – WCAG 2.0, poziom AA

Kontrasty (sprawdzone, minimum dla tekstu 4,5 : 1):

| Para | Kontrast |
|---|---|
| tekst #27302c na bieli | 13,6 : 1 |
| opis #5f6b65 na bieli | 5,6 : 1 |
| biały tekst na szałwii #5f7a6c | 4,7 : 1 |
| biały tekst na ciemniejszej szałwii #4e6658 (najechanie, fokus) | 6,2 : 1 |
| tekst #27302c na jasnej szałwii #9fb8a6 (kliknięcie) | 6,4 : 1 |
| tryb ciemny: tekst #e8ece9 na karcie #212b26 | 12,2 : 1 |
| tryb ciemny: opis #a7b3ac na karcie | 6,7 : 1 |
| tryb ciemny: aktywna opcja #f6d6e5 na #3a2a33 | 10,1 : 1 |
| linia pola #7d8882 na bieli / #7a8680 na #18201c | 3,7 : 1 / 4,4 : 1 |

Fokus (kryterium 2.4.7) – przyciski, karty i linki: obwódka 1 px + miękka poświata; zakładki, menu
w nagłówku i link „← Moje podróże”: jasnozielone tło bez obwódki (`--focus-ring` 22%), szersze od napisu
i nad kreską aktywnej pozycji; przycisk główny dodatkowo ciemnieje
(`--color-accent-hover`). Przezroczysty `outline` zostaje dla trybu wysokiego kontrastu Windows,
w którym cienie są ukrywane:

```css
a:focus-visible,
button:focus-visible {
  outline: 2px solid transparent;
  border-radius: var(--radius-button);
  box-shadow:
    0 0 0 1px var(--focus-ring),
    0 0 14px 4px color-mix(in srgb, var(--focus-ring) 60%, transparent);
}
input:focus,
select:focus {
  outline: none;
  border-bottom-color: var(--focus-ring);
  box-shadow: 0 2px 0 0 var(--focus-ring);   /* linia pogrubia się do 3 px */
}
```

Zasady przy kodowaniu:

- każde pole ma `<label>` (etykieta widoczna albo ukryta wizualnie, np. przy wyszukiwarce),
- zdjęcia mają `alt` z opisem (podpis z albumu), dekoracyjne – `alt=""`,
- `<html lang="pl">`,
- wszystko obsługiwane z klawiatury (Tab, Enter, Spacja), zakładki z `role="tab"` i `aria-selected`
  (wzorzec WAI-ARIA „Tabs”: Tab wchodzi tylko na aktywną zakładkę, strzałki ← → / Home / End przełączają),
- potwierdzenie usunięcia we własnym oknie `<dialog>` (nie `window.confirm`): fokus startuje na „Anuluj”, Esc zamyka,
- błędy formularzy opisane tekstem przy polu, nie tylko kolorem,
- status podróży zawsze jako napis + kolorowa kreska (kolor nie jest jedyną informacją),
- strona działa po powiększeniu tekstu do 200%.

## Testy (Playwright)

Elementy interaktywne mają `data-testid`, np. `trip-card`, `status-tab-all`, `status-tab-planned`, `status-tab-in-progress`,
`status-tab-completed`, `status-tab-archived`, `btn-new-trip`, `input-search`, `input-weather-city`,
`input-convert-amount`, `convert-result`, `widget-next-trip`, `widget-weather`, `widget-nbp`,
`weather-error`, `weather-retry`, `theme-switcher`, `theme-light`, `theme-dark`, `theme-contrast`, `nav-trips`, `nav-stats`, `btn-logout`,
`trip-status`, `countdown`, `weather-current`, `trips-loading`, `trips-error`, `trips-retry`, `trips-empty`,
`login-form`, `input-login`, `input-password`, `btn-login`, `btn-register`, `login-error`, `error-login`,
`error-password`, `weather-loading`, `weather-city-name`, `btn-weather-search`, `weather-search-error`,
`weather-city-results`, `weather-city-option-{n}` (n = 0, 1, 2… w kolejności wyników),
`rates-loading`, `rates-error`, `rates-retry`, `rates-list`, `rate-{KOD}` (np. `rate-EUR`, przycisk wyboru waluty z `aria-pressed`), `rates-date`,
`convert-amount-error`, `convert-error`,
`trip-form`, `input-trip-name`, `input-trip-city`, `input-trip-country`, `input-trip-budget`, `input-trip-start`,
`input-trip-end`, `select-trip-type`, `select-trip-character`, `btn-save-trip`, `btn-cancel-trip`,
`trip-form-error`, `trip-form-loading`, `trip-form-load-error`, `trip-form-retry`,
`error-{pole}` przy polu formularza podróży (np. `error-name`, `error-destination-city`, `error-end-date`,
`error-start-date`), `trip-cover-photo` (zdjęcie na karcie podróży),
`trip-details`, `trip-details-loading`, `trip-details-error`, `trip-details-retry`, `trip-details-title`, `link-back`,
`btn-status-{status}` (np. `btn-status-in-progress`, `btn-status-planned`), `status-error`,
`trip-readonly-notice`, `trip-budget`, `section-panel`, `section-tab-{zakładka}` (`przeglad`, `plan`, `loty`,
`transport`, `posilki`, `noclegi`, `wydatki`, `chce-odwiedzic`, `pakowanie`, `pamietnik`, `kosztorys`),
`btn-edit-trip`, `btn-delete-trip`, `trip-form-readonly`, `trip-photos`, `input-trip-photo`, `error-photo`,
`trip-photo-previews`, `trip-photo-preview-{n}`, `btn-remove-photo-{n}` (n = 0, 1, 2…), `btn-upload-photo`,
`btn-clear-photos`, `photo-uploaded`, `trip-photo-list`, `photo-{id}`, `btn-delete-photo-{id}`,
`trip-photos-loading`, `trip-photos-error`, `trip-photos-empty`, `photo-delete-error`,
`meals-section`, `meals-loading`, `meals-error`, `meals-retry`, `meals-empty`, `meal-list`, `meal-{id}`,
`meals-total`, `btn-add-meal`, `meal-form`, `input-meal-dish`, `input-meal-restaurant`, `input-meal-date`,
`input-meal-cost`, `select-meal-rating`, `btn-save-meal`, `btn-cancel-meal`, `meal-form-error`,
`error-meal-{pole}` (`error-meal-dish`, `error-meal-restaurant-name`, `error-meal-meal-date`, `error-meal-cost`),
`btn-edit-meal-{id}`, `btn-delete-meal-{id}`, `meal-delete-error`,
transport (ten sam wzór co posiłki – `ItemSection`): `transports-section`, `transports-loading`, `transports-error`,
`transports-retry`, `transports-empty`, `transport-list`, `transport-{id}`, `transports-total`, `btn-add-transport`,
`transport-form`, `select-transport-mean`, `input-transport-date`, `input-transport-from`, `input-transport-to`,
`input-transport-cost`, `select-transport-rating`, `btn-save-transport`, `btn-cancel-transport`, `transport-form-error`,
`error-transport-{pole}` (np. `error-transport-route-from`), `btn-edit-transport-{id}`, `btn-delete-transport-{id}`,
`transport-delete-error`,
noclegi i atrakcje (`ItemSection`, prefiks `place`/`places`): `places-section`, `places-loading`, `places-error`,
`places-retry`, `places-empty`, `place-list`, `place-{id}`, `places-total`, `btn-add-place`, `place-form`,
`input-place-name`, `select-place-kind`, `input-place-date`, `input-place-cost`, `select-place-rating`,
`input-place-note`, `btn-save-place`, `btn-cancel-place`, `place-form-error`, `error-place-{pole}`
(np. `error-place-visit-date`), `btn-edit-place-{id}`, `btn-delete-place-{id}`, `place-delete-error`,
wydatki inne (`ItemSection`, prefiks `expense`/`expenses`, bez oceny): `expenses-section`, `expenses-loading`,
`expenses-error`, `expenses-retry`, `expenses-empty`, `expense-list`, `expense-{id}`, `expenses-total`, `btn-add-expense`,
`expense-form`, `input-expense-description`, `select-expense-category`, `input-expense-date`, `input-expense-cost`,
`btn-save-expense`, `btn-cancel-expense`, `expense-form-error`, `error-expense-{pole}`, `btn-edit-expense-{id}`,
`btn-delete-expense-{id}`, `expense-delete-error`,
loty (`ItemSection`, prefiks `flight`/`flights`, tylko podróż zagraniczna): `flights-section`, `flights-loading`,
`flights-error`, `flights-retry`, `flights-empty`, `flight-list`, `flight-{id}`, `flights-total`, `btn-add-flight`,
`flight-form`, `input-flight-number`, `input-flight-from`, `input-flight-to`, `input-flight-departure`,
`input-flight-arrival`, `input-flight-cost`, `select-flight-rating`, `btn-save-flight`, `btn-cancel-flight`,
`flight-form-error`, `error-flight-{pole}` (np. `error-flight-arrival-at`), `btn-edit-flight-{id}`,
`btn-delete-flight-{id}`, `flight-delete-error`,
plan dnia (`ItemSection`, prefiks `plan-point`/`plan-points`, bez kosztu, według dni): `plan-points-section`,
`plan-points-loading`, `plan-points-error`, `plan-points-retry`, `plan-points-empty`, `plan-point-day-{RRRR-MM-DD}`,
`plan-point-{id}`, `btn-add-plan-point`, `plan-point-form`, `input-plan-point-place`, `input-plan-point-day`,
`input-plan-point-time`, `input-plan-point-description`, `btn-save-plan-point`, `btn-cancel-plan-point`,
`plan-point-form-error`, `error-plan-point-{pole}`, `btn-edit-plan-point-{id}`, `btn-copy-plan-point-{id}`,
`btn-delete-plan-point-{id}`, `plan-point-delete-error`,
listy do odhaczania (`ChecklistSection`; „Chcę odwiedzić”: prefiks `wishlist-item`/`wishlist`, pakowanie:
`packing-item`/`packing`): `{plural}-section`, `{plural}-loading`, `{plural}-error`, `{plural}-retry`, `{plural}-empty`,
`{plural}-progress`, `{single}-list`, `{single}-{id}`, `checkbox-{single}-{id}`, `input-{single}-name`,
`input-{single}-note` (tylko „Chcę odwiedzić”), `btn-add-{single}`, `{single}-add-error`, `{single}-error`,
`btn-edit-{single}-{id}`, `input-edit-{single}-name`, `input-edit-{single}-note`, `btn-save-{single}-{id}`,
`btn-cancel-{single}-{id}`, `btn-delete-{single}-{id}` (np. `checkbox-packing-item-12`, `wishlist-progress`),
pamiętnik (`ItemSection`, prefiks `diary-entry`/`diary-entries`, według dni): `diary-entries-section`,
`diary-entries-loading`, `diary-entries-error`, `diary-entries-retry`, `diary-entries-empty`, `diary-entry-day-{RRRR-MM-DD}`,
`diary-entry-{id}`, `btn-add-diary-entry`, `diary-entry-form`, `input-diary-entry-date`, `input-diary-entry-title`,
`input-diary-entry-content`, `btn-save-diary-entry`, `btn-cancel-diary-entry`, `diary-entry-form-error`,
`error-diary-entry-{pole}`, `btn-edit-diary-entry-{id}`, `btn-copy-diary-entry-{id}`, `btn-delete-diary-entry-{id}`,
`diary-entry-delete-error`,
kosztorys: `cost-summary`, `cost-summary-loading`, `cost-summary-error`, `cost-summary-retry`, `cost-total`,
`cost-daily`, `cost-rating`, `budget` (atrybut `data-level`: `no_budget`/`ok`/`warning`/`exceeded`), `budget-status`,
`cost-sections`, `cost-section-{sekcja}` (np. `cost-section-meals`), `recommendations`, `recommendations-loading`,
`recommendations-error`, `recommendations-retry`, `recommendations-empty`, `recommendations-none`,
`rec-previous-trip-{id}`, `rec-restaurant-{n}`, `rec-place-{n}`, `rec-wish-{n}`,
statystyki: `stats`, `stats-loading`, `stats-error`, `stats-retry`, `stats-empty`, `stats-trips-count`,
`stats-total-cost`, `stats-average-trip`, `stats-average-daily`, `stats-years`, `stats-year-{rok}`, `stats-character`,
`stats-character-table`, `stats-character-{nazwa}` (wiersz tabeli, np. `stats-character-Miasto`),
telefon/tablet: `btn-menu` (☰ w nagłówku, `aria-expanded`), pasek na dole „Moich podróży”: `btn-sheet-search`,
`btn-sheet-new-trip`, `btn-sheet-weather`, `btn-sheet-rates`; panel widżetów `widget-sheet`, `btn-sheet-close`,
`btn-copy-{prefiks}-{id}` w każdej sekcji kosztowej (np. `btn-copy-meal-3`, `btn-copy-place-7`) – kopia pozycji do formularza,
album w zakładce „Przegląd”: `trip-album`, `album-loading`, `album-error`, `album-retry`, `album-empty`,
`link-add-photos`, `album-day-{RRRR-MM-DD}`, `album-photo-{id}` (miniatura – otwiera podgląd), `photo-viewer`,
`photo-viewer-caption`, `photo-viewer-counter`, `btn-viewer-prev`, `btn-viewer-next`, `btn-viewer-close`,
dzień i podpis zdjęcia (edycja podróży): `input-upload-day`, `error-upload-day`, `photo-day-{id}`,
`btn-edit-photo-{id}`, `photo-edit-dialog`, `input-photo-day`, `input-photo-caption`, `error-photo-day`,
`error-photo-caption`, `photo-edit-error`, `btn-save-photo-edit`, `btn-cancel-photo-edit`,
`confirm-dialog` (okno potwierdzenia usunięcia, zamiast `window.confirm`), `btn-confirm-ok`, `btn-confirm-cancel`.

## Do dopilnowania

- Archiwum: pola i przyciski edycji ukryte lub zablokowane.
- Zakładka „Loty” tylko dla podróży zagranicznych.
