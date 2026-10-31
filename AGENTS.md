# AGENTS.md – instrukcje dla agentów AI

Ten plik czytają agenci (Claude Code, Codex, Copilot itp.) przed pracą nad repozytorium.
Opisuje kontekst, zasady, komendy i plan kolejnych faz. **Aktualizuj go razem z kodem.**

## 1. Kontekst

* **Moje podróże** – osobisty planer i pamiętnik podróży. Projekt zaliczeniowy z testowania
  aplikacji webowych: liczy się wzorcowe testowanie na wszystkich poziomach (jednostkowe,
  integracyjne, mutacyjne, E2E, manualne) i dobre praktyki.
* Wymagania i decyzje: `docs/wymagania/` (najważniejszy: `opis-aplikacji-i-funkcjonalnosci.md`,
  sekcja 4 „Decyzje” jest wiążąca).
* Aplikacja działa **tylko lokalnie** (localhost). Bez SSR, bez eksportu do plików, koszty tylko w PLN.
* Użytkownik pisze po polsku – odpowiadaj po polsku.

## 2. Stan projektu

| Faza | Zakres | Stan |
|---|---|---|
| 1 | Backend: API, domena, baza, migracje, testy jednostkowe, Swagger, Docker, Sonar, CI | ✅ gotowe |
| 2 | Testy integracyjne backendu (API + prawdziwa baza SQLite) | ⏳ późniejszy etap |
| 3 | Frontend React + Vite (GUI pod Playwright) + Vitest | ⏳ |
| 4 | Testy E2E (Playwright, Python, Page Object) | ⏳ |
| 5 | Dokument scenariuszy testów manualnych | ⏳ |
| 6 | Testy mutacyjne – przegląd ocalałych mutantów, quality gate Sonara | ⏳ (konfiguracja gotowa) |
| 7 | Wariant zaawansowany: filtrowanie, pogoda celu, szablony, propozycje statusu, tryb ciemny | ⏳ |

Kolejność faz 2–7 ustala właściciel projektu. **Testy integracyjne celowo jeszcze nie istnieją**
(decyzja 8 w `docs/wymagania/opis-aplikacji-i-funkcjonalnosci.md`) – nie dodawaj ich, dopóki
właściciel nie poprosi o fazę 2.

## 3. Komendy

Najprościej: skróty z katalogu głównego repozytorium – `make <polecenie>` (`Makefile` na
Linux/macOS/CI, `make.bat` na Windows; w PowerShell `.\make <polecenie>`), lista: `make help`.
Najważniejsze: `make install`, `make run`, `make test`, `make check` (lint + testy jak w CI).
**Nowe polecenie dodawaj w obu plikach jednocześnie** i dopisz je do tabeli w README.
`make.bat` musi mieć końce linii CRLF i tylko znaki ASCII.

Ręcznie: komendy backendu z katalogu `backend/`, z aktywnym venv. Venv leży w `.venv/`
w katalogu głównym repozytorium (bez aktywacji: `..\.venv\Scripts\python.exe -m pytest` itd.).
Nie twórz venv w innych miejscach i nie commituj go.

```bash
pip install -r requirements-dev.txt
uvicorn app.main:app --reload            # http://localhost:8000/docs
pytest                                   # wszystkie testy
pytest -m unit                           # szybkie, bez bazy i sieci
pytest -m integration                    # od fazy 2: API + tymczasowa baza SQLite
pytest --cov                             # pokrycie (próg tymczasowo 60%, po fazie 2 → 90%)
ruff check . && ruff format --check .    # lint i format – muszą przechodzić
alembic revision --autogenerate -m "..." # nowa migracja po zmianie modeli
docker compose run --rm backend-dev mutmut run   # testy mutacyjne (tylko Linux/kontener)
```

## 4. Architektura i zasady (backend)

```
app/domain        czysta logika – NIE importuje fastapi, sqlalchemy, app.db, app.api, app.services
app/db            modele ORM (models.py), typ Money, sesja, uruchamianie migracji
app/schemas       Pydantic: wejście (…In / …Patch) i wyjście (…Out)
app/services      operacje na bazie + wywołania domeny; TU sprawdzane są reguły biznesowe
app/integrations  klienci Open-Meteo / NBP + czyste funkcje parse_*
app/api           cienkie routery, zależności (deps.py), opisy błędów do Swaggera (responses.py)
app/core          błędy aplikacji (errors.py) i handlery → {"detail", "code"}
migrations/       Alembic (render_as_batch dla SQLite); słowniki wypełniane w migracji
```

Zasady obowiązkowe:

1. **Kod i identyfikatory po angielsku, komunikaty dla użytkownika po polsku.** Wartości enumów
   w API po angielsku (`planned`), polskie etykiety w `LabeledEnum.label`.
2. **Każdy błąd ma stały `code`.** Nowa reguła biznesowa → nowa klasa w `app/domain/errors.py`
   (domyślnie 409) albo w `app/core/errors.py`; dopisz kod do tabeli w `docs/api.md`.
3. **Reguły w domenie, nie w routerach.** Router: walidacja Pydantic → serwis → schemat `…Out`.
4. **Każdy zapis do podróży** przechodzi przez `ensure_editable(trip.status)` (archiwum tylko do odczytu).
5. **Izolacja danych:** podróż zawsze pobieraj przez `get_owned_trip` / zależność `OwnedTrip`
   (cudza = 404). Elementy podrzędne filtruj po `trip_id`.
6. **Pieniądze:** `Decimal` w Pythonie, `Money` (grosze) w bazie, `MoneyIn` / `DecimalOut` w schematach.
   Zaokrąglenie: `round_half_up` z `app/domain/common.py`. Nigdy `float` w obliczeniach.
7. **Daty:** „dzisiaj” tylko przez zależność `Today` (`get_today`) – testy ją zamrażają.
8. **Zewnętrzne API** tylko przez klientów z `app/integrations`, wstrzykiwanych zależnością;
   błąd → `ExternalServiceError` → 503. Testy nigdy nie łączą się z siecią.
9. **Zmiana modelu = migracja Alembica** w tym samym commicie (w fazie 2 wymusi to test
   `test_migrations_match_orm_models`; do tego czasu sprawdzaj
   `alembic upgrade head && alembic check` – oczekiwane „No new upgrade operations detected”).
10. **Swagger:** każdy endpoint ma `summary`, `name` (= operationId, unikalne), `responses`
    z `app/api/responses.py`, a tag jest zadeklarowany w `OPENAPI_TAGS` w `app/main.py`.

### Jak dodać nowy rodzaj pozycji kosztowej (przykład polimorfizmu)

1. `app/domain/enums.py` → nowa wartość `Section`.
2. `app/domain/items.py` → nowa klasa dziedzicząca z `RatedTripItem`/`TripItem`
   (ew. nadpisz `is_allowed_for`, `recommendation_*`) i dopisz ją do `ITEM_CLASSES`.
3. `app/db/models.py` → klasa ORM dziedzicząca z `TripItem` z `polymorphic_identity` i `to_domain()`.
4. Migracja Alembica, schematy `…In/…Out` w `app/schemas/items.py`, `ChildResource` w
   `app/services/children.py`, `ChildRouterSpec` w `app/api/routers/trip_children.py`.
5. Kosztorys i średnie **nie wymagają zmian**. Dopisz testy jednostkowe (i integracyjne, gdy już istnieją).

## 5. Zasady testów

* Piramida: dużo testów jednostkowych domeny, mniej integracyjnych, kilka E2E.
* Testy jednostkowe: bez bazy i sieci, w `tests/unit/`; wartości graniczne (np. 89/90/100/101%)
  i oba kierunki warunków – pod testy mutacyjne.
* Testy integracyjne: jeszcze nie istnieją – plan i wymagania w fazie 2 (sekcja 6).
* Nazwy testów opisują zachowanie: `test_flight_cannot_be_added_to_domestic_trip`.
* Znaczniki `unit` / `integration` nadawane automatycznie wg katalogu (`tests/conftest.py`).

### Definition of Done (każda zmiana)

- [ ] `ruff check .` i `ruff format --check .` bez błędów
- [ ] `pytest` zielony, pokrycie ≥ progu z `pyproject.toml` (teraz 60%, po fazie 2 – 90%);
      moduł `app/domain` utrzymuje 100%
- [ ] nowa logika domenowa ma testy jednostkowe; po fazie 2 nowy endpoint ma też test integracyjny
      (w tym 401 bez nagłówka, 404 dla cudzej podróży, 409 dla archiwum, jeśli dotyczy)
- [ ] migracja dla zmian w modelach
- [ ] zaktualizowane `README.md`, `AGENTS.md`, `docs/api.md`

## 6. Plan kolejnych faz

### Faza 2 – Testy integracyjne backendu (późniejszy etap)

Zakres i podejście opisane są też w `docs/wymagania/opis-aplikacji-i-funkcjonalnosci.md`
(sekcja 2.10). Gotowa, działająca wersja tych testów (145 testów, pokrycie ~99%) jest w historii
gita, w pierwszym commicie – można od niej zacząć:
`git checkout 053f839 -- backend/tests/integration` (potem przejrzyj i dostosuj do bieżącego API).

* Katalog `backend/tests/integration/`; znacznik `integration` nada `tests/conftest.py` automatycznie.
* `conftest.py`:
  * fixtura sesyjna: `upgrade_to_head()` do pliku-wzorca SQLite w `tmp_path_factory`,
  * fixtura `settings`: kopia wzorca do `tmp_path` dla każdego testu, `upload_dir` w `tmp_path`,
    mały `max_upload_bytes`, `auto_migrate=False`,
  * fixtura `app`: `create_app(settings)` + `dependency_overrides` dla `get_weather_client`,
    `get_rates_client` (atrapy) i `get_today` (stała data, np. 2027-04-20),
  * `client` (`TestClient` w bloku `with`, żeby zadziałał lifespan), `user`, `other_user`.
* `fakes.py`: `FakeWeatherClient`, `FakeRatesClient` z flagą `fail` (symulacja awarii → 503).
* `helpers.py`: rejestracja, nagłówki, `create_trip`, `set_status`, fabryki danych sekcji, stałe
  (bajty PNG/JPEG). Nie importuj niczego z `conftest.py`.
* Pliki testów wg obszarów: konto, podróże (izolacja użytkowników dla każdego endpointu podróży),
  statusy i archiwum (każdy zapis → 409), sekcje pozycji (CRUD parametryzowany), plan/listy/pamiętnik,
  zdjęcia (upload, album, plik, limity), kosztorys/rekomendacje/statystyki/ekran główny,
  zewnętrzne API (także awaria), migracje (`compare_metadata` = brak różnic, downgrade/upgrade,
  słowniki), Swagger/OpenAPI (unikalne operationId, schemat `UserIdHeader`), format błędów, CORS.
* Testy nigdy nie łączą się z siecią; zamykaj silniki SQLAlchemy (`engine.dispose()`), żeby nie
  było `ResourceWarning`.
* Po dodaniu: próg `fail_under` w `backend/pyproject.toml` z powrotem na 90, krok CI
  „Testy integracyjne” w `.github/workflows/backend.yml`, aktualizacja README (sekcja „Testy”),
  tego pliku (tabela faz, sekcja 5, Definition of Done) i decyzji 8 w dokumencie wymagań.

### Faza 3 – Frontend (React + Vite, zwykły JavaScript)

* Katalog `frontend/`. Vite, React Router, `fetch`, Pico CSS. Bez TypeScriptu, bez SSR.
* Moduł `src/api/client.js`: bazowy URL z `import.meta.env.VITE_API_URL`
  (domyślnie `http://localhost:8000`), nagłówek `X-User-Id` z `localStorage`, parsowanie błędów
  `{detail, code, errors}`; 401 → wylogowanie. Endpointy i kody błędów: `docs/api.md`.
* Ekrany: logowanie/rejestracja, „Moje podróże” (4 grupy, odliczanie, widżet pogody z wyszukiwarką
  miasta, kursy + kalkulator, statystyki), formularz podróży, szczegóły podróży z zakładkami sekcji
  (tylko `available_sections`), plan dnia, chcę odwiedzić, lista pakowania, pamiętnik, album,
  kosztorys (alert budżetu: kolor dla `warning`/`exceeded`), rekomendacje.
* Archiwum: gdy `is_read_only`, formularze i przyciski edycji są ukryte/wyłączone.
* Zdjęcia: `fetch(file_url, {headers})` → `blob` → `URL.createObjectURL`.
* **Wzorcowo pod Playwright:**
  * `data-testid` na każdym elemencie interaktywnym i ważnym wyniku, kebab-case, z id dla list:
    `login-form`, `login-input`, `password-input`, `login-submit`, `register-link`,
    `trip-group-planned`, `trip-card-{id}`, `countdown`, `weather-widget`, `weather-city-search`,
    `weather-error`, `rates-widget`, `rate-EUR`, `converter-amount`, `converter-result`,
    `trip-form`, `trip-name-input`, `trip-save`, `status-button-{status}`, `section-tab-{section}`,
    `add-flight-button`, `flight-row-{id}`, `cost-total`, `cost-section-{section}`, `budget-alert`,
    `average-rating`, `album-day-{date}`, `photo-{id}`, `error-message`, `toast-success`.
  * semantyczny HTML (`<main>`, `<nav>`, `<form>`, `<button>`), `<label for>` przy każdym polu,
    role i `aria-live` dla komunikatów, stabilne teksty błędów (z `detail` backendu);
    **żadnych selektorów opartych na klasach CSS** w testach.
* Testy: Vitest + Testing Library (formatowanie kwot i dat, komponenty formularzy i widżetów,
  walidacja po stronie klienta, klient API z atrapą `fetch`), ESLint.
* Docker Compose: usługa `frontend` (port 5173), `MP_CORS_ORIGINS` już obejmuje ten port.
* SonarQube: `frontend/sonar-project.properties` (projekt `moje-podroze-frontend`, raport
  `coverage/lcov.info`) i usługa `sonar-scanner-frontend` w `docker-compose.yml`.
* CI: osobny workflow `.github/workflows/frontend.yml` (lint, Vitest).

### Faza 4 – Testy E2E (Playwright, Python)

* Katalog `e2e/` z własnym `requirements.txt` (`pytest-playwright`), Page Object w `e2e/pages/`.
* Środowisko: backend z czystą bazą (`MP_DATABASE_URL` na plik tymczasowy) + frontend; dane
  przygotowuj przez API (szybciej), a przez GUI tylko testowany scenariusz.
* Selektory wyłącznie `get_by_test_id`, `get_by_role`, `get_by_label`.
* Obowiązkowe scenariusze: pełne życie podróży (rejestracja → podróż → lot → przejazd → posiłek →
  zdjęcie → statusy → archiwum → kosztorys tylko do odczytu); lotu nie da się dodać do podróży
  krajowej; izolacja dwóch użytkowników; widżet pogody przy awarii API (Playwright `route`).

### Faza 5 – Testy manualne

* `docs/testy-manualne.md`: tabela scenariuszy (ID, warunki wstępne, kroki, oczekiwany wynik,
  wynik/data/tester), w tym czytelność UI, tryb ciemny, brak internetu (widżety), RWD.

### Faza 6 – Testy mutacyjne i jakość

* `docker compose run --rm backend-dev mutmut run` → `mutmut results`; dla każdego ocalałego
  mutanta dopisz test albo uzasadnij w `docs/mutacje.md`, że jest równoważny.
* Quality gate w SonarQube: brak nowych bugów i podatności, pokrycie nowego kodu ≥ 80%,
  duplikacje < 3%.

### Faza 7 – Wariant zaawansowany (ta sama aplikacja, bez osobnych wersji)

| # | Funkcja | Wskazówki dla backendu |
|---|---|---|
| 5 | Filtrowanie i wyszukiwanie podróży | rozszerz `GET /api/trips` o `character_id`, `trip_type`, `year`, `q` (nazwa, bez wielkości liter) |
| 6 | Pogoda dla celu podróży | `GET /api/trips/{id}/weather`: geocoding `destination_city` (+ kraj) → `current_weather`; ten sam klient i atrapa; rozważ zapis współrzędnych celu w `trips` (migracja) |
| 8 | Kopiowanie podróży jako szablonu | `POST /api/trips/{id}/copy` z nową datą startu: kopiuje plan dnia (z przesunięciem dat), listę pakowania (`packed=false`) i budżet; **bez** kosztów, zdjęć, pamiętnika; reguła „co się kopiuje” w domenie + testy jednostkowe |
| 9 | Automatyczne propozycje statusu | funkcja domenowa `suggest_status(snapshot, today)` (np. `planned` i `start_date <= today` → `in_progress`; `in_progress` i `end_date < today` → `completed`); pole `suggested_status` w `TripOut` albo endpoint; tylko propozycja, zmiana nadal przez `/status` |
| 10 | Tryb ciemny | tylko frontend (Pico CSS `data-theme`), zapamiętany w `localStorage`; scenariusz manualny |

Poza zakresem (decyzja): waluty obce w kosztach, mapy, EXIF, OpenStreetMap, udostępnianie linkiem, eksport do PDF/plików.

## 7. Świadome uproszczenia i znane ograniczenia

* Hasła jawnym tekstem, brak tokenów, id w nagłówku `X-User-Id` (decyzja nr 7). Nie „naprawiaj”
  tego bez zgody właściciela projektu – opisane w README.
* Plik zdjęcia wymaga nagłówka `X-User-Id`, więc `<img src>` nie zadziała bez `fetch` → `blob`.
* Zmiana dat podróży nie przesuwa ani nie waliduje istniejących pozycji z datą (plan dnia,
  posiłki, przejazdy, loty, noclegi i atrakcje, pamiętnik) – decyzja: zapis dozwolony. Pozycja
  poza nowym terminem da się zapisać dopiero po poprawieniu jej daty.
* Daty zdjęć (`day`) nie są ograniczone do terminu podróży (domyślnie dzień dodania).
* Zdjęcie miasta z Wikipedii: atrybucja uproszczona do linku do artykułu (`source_url`);
  licencji pliku nie pobieramy. Adres zdjęcia nie jest zapisywany w bazie.
* Statystyki liczą tylko podróże `completed` i `archived`.
* mutmut 3.x nie działa natywnie na Windows (Docker / WSL / GitHub Actions).
* Brak testów integracyjnych (faza 2): API, serwisy i warstwa bazy nie są teraz pokryte testami
  automatycznymi – stąd tymczasowy próg pokrycia 60%.
