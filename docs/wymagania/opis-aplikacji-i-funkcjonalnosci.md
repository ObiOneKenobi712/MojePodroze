# Moje podróże: opis aplikacji, funkcjonalności i propozycje

Analiza wymagań na podstawie plików `domena_projektu.txt` i `wymagania.txt` (18.10.2026).
Etap analizy, bez kodu. Wersja 2: wprowadzone decyzje Darka z 18.10.2026 (sekcja 4).
Wersja 3 (18.10.2026): testy integracyjne przeniesione na późniejszy etap (sekcja 2.10, decyzja 8).

## 1. Opis aplikacji

**Moje podróże** to webowa aplikacja do osobistego użytku: planer podróży, pamiętnik odwiedzonych
miejsc i organizer w trakcie wyjazdu. Nie jest to aplikacja biura podróży. Każdy użytkownik zakłada
konto i widzi wyłącznie swoje dane.

Użytkownik tworzy podróż (nazwa, cel, daty, typ, charakter), planuje ją, w trakcie i po wyjeździe
dopisuje przejazdy, loty, posiłki, noclegi, zdjęcia i wpisy do pamiętnika. Każda pozycja ma koszt
i ocenę, więc aplikacja liczy kosztorys (suma i podział na sekcje, porównanie z budżetem) oraz ocenę
zbiorczą. Przy planowaniu kolejnego wyjazdu w to samo miejsce podpowiada najlepiej ocenione wcześniej
miejsca i niezaliczone punkty z listy „chcę odwiedzić”.

Ekran główny pokazuje podróże pogrupowane według statusu, a obok bieżącą pogodę dla wybranego
przez użytkownika miasta i kursy EUR, USD i GBP do PLN z zewnętrznych API. Wszystkie koszty są
wyłącznie w PLN.

Aplikacja działa wyłącznie lokalnie (localhost), bez wdrożenia na serwer.

### Wariant podstawowy i zaawansowany

To jedna spójna aplikacja, której docelowy zakres to suma obu wariantów. Podział służy tylko do
planowania kolejności prac: najpierw powstaje i jest testowany zakres podstawowy (etap 1), potem
dokładane są funkcje zaawansowane (etap 2) w tym samym kodzie, bez osobnych wersji aplikacji.
Model danych i architekturę projektujemy od razu pod pełny zakres, żeby etap 2 nie wymagał przeróbek.

### Architektura

| Warstwa | Technologia |
|---|---|
| Backend (API, logika, baza) | Python, FastAPI, SQLAlchemy, SQLite, zdjęcia w katalogu na dysku |
| Frontend (GUI w przeglądarce) | React + Vite, React Router, fetch, Pico CSS, zwykły JavaScript (CSR, bez SSR) |
| Zewnętrzne API | pogoda i wyszukiwanie miasta (Open-Meteo + jego geocoding, bez klucza), kursy walut (API NBP, bez klucza), zdjęcie miasta celu podróży (REST API Wikipedii, bez klucza) |
| Testy | pytest + pytest-cov, mutmut, Playwright (Python), Vitest dla frontendu, scenariusze manualne |
| Jakość i uruchamianie | Ruff (+ ESLint na froncie), GitHub Actions, Docker Compose, lokalny SonarQube |
| Dokumentacja | README.md, AGENTS.md, dokument scenariuszy testów manualnych |

Cała ważna logika (statusy, reguły typów podróży, kosztorys, oceny, rekomendacje) siedzi w Pythonie,
w osobnym module domenowym bez zależności od FastAPI i bazy. Dzięki temu łatwo go testować jednostkowo
i mutacyjnie. React odpowiada tylko za wyświetlanie.

### Baza danych

Baza to SQLite, czyli jeden plik na dysku obsługiwany przez SQLAlchemy. Przechowuje wszystko, co
użytkownik wpisuje i co musi przetrwać restart aplikacji:

| Dane | Co zawierają |
|---|---|
| Użytkownicy | login, hasło (jawnym tekstem, patrz 2.1), wybrane miasto pogody |
| Podróże | właściciel, nazwa, cel, daty, typ, charakter, status, planowany budżet |
| Pozycje podróży | loty, przejazdy, posiłki, noclegi i atrakcje, inne wydatki; każda z kosztem w PLN i oceną 1–5 |
| Plan | plan dnia (punkty z godziną i miejscem), lista „chcę odwiedzić” z oznaczeniem zaliczenia |
| Lista pakowania | rzeczy do spakowania z oznaczeniem spakowania |
| Pamiętnik i zdjęcia | wpisy z datą i treścią; dla zdjęć ścieżka pliku i dzień (same pliki leżą w katalogu na dysku) |
| Słowniki | charaktery podróży, środki transportu, kategorie wydatków |

Bazy nie używamy do przechowywania wyników obliczeń: kosztorys, średnie ocen, statystyki
i rekomendacje backend liczy na bieżąco z powyższych danych. Pogody i kursów walut też nie
zapisujemy, bo pochodzą prosto z zewnętrznych API. Testy integracyjne używają osobnej, tymczasowej
bazy SQLite. Szczegółowy model danych (tabele, kolumny, relacje) będzie następnym krokiem.

## 2. Funkcjonalności (zakres podstawowy)

### 2.1 Konto i bezpieczeństwo
- Proste logowanie: rejestracja zapisuje login i hasło w tabeli użytkowników (hasło jawnym tekstem, bez hashowania i bez tokenów). Logowanie porównuje login i hasło z bazą i zwraca id użytkownika. Bez resetu hasła, e-maili i ról.
- Rozpoznawanie użytkownika: frontend po zalogowaniu trzyma id użytkownika w `localStorage` i wysyła je w nagłówku `X-User-Id` przy każdym zapytaniu. Backend czyta ten nagłówek i filtruje wszystkie dane po właścicielu. Brak nagłówka daje 401.
- Świadome uproszczenie projektu szkoleniowego uruchamianego tylko na localhost: takie logowanie nie jest bezpieczne (hasła jawne, id łatwo podmienić) i warto to jednym zdaniem zaznaczyć w README.
- Każdy użytkownik widzi i edytuje wyłącznie swoje podróże (próba dostępu do cudzej podróży zwraca 404).

### 2.2 Ekran główny „Moje podróże”
- Lista podróży w czterech grupach: **w planie**, **w trakcie**, **zrealizowane**, **archiwum**.
- Widżet pogody: użytkownik wybiera miasto w samym widżecie (pole wyszukiwania), pogoda odświeża się dla wybranego miasta. Wybór zapisuje się w ustawieniach użytkownika, domyślnie Warszawa.
- Widżet kursów EUR/PLN, USD/PLN, GBP/PLN (tabela A NBP).
- Gdy zewnętrzne API nie odpowiada, widżet pokazuje komunikat, a reszta strony działa normalnie.

### 2.3 Podróż
- Tworzenie, edycja, usuwanie: nazwa, cel (miasto/kraj), data od–do, planowany budżet.
- **Typ**: krajowa albo zagraniczna. Decyduje o dostępnych sekcjach.
- **Charakter**: góry, morze, miasto, jeziora… (lista słownikowa, łatwa do rozszerzenia). Służy do filtrowania i statystyk.
- **Cykl życia** jako maszyna stanów: `w planie ⇄ w trakcie ⇄ zrealizowana ⇄ archiwum`.
  Przejścia zawsze o jeden krok, do przodu albo wstecz (cofanie dozwolone, np. omyłkowe „w trakcie”).
  Przeskakiwanie etapów jest zabronione (np. `w planie → archiwum`).
  Zrealizowaną podróż nadal się uzupełnia. Archiwum jest tylko do odczytu (każda próba zapisu zwraca błąd);
  żeby coś poprawić, trzeba najpierw cofnąć podróż do „zrealizowanej”.
- Zmiana typu z zagranicznej na krajową, gdy są już loty: proponuję blokadę z komunikatem
  „usuń najpierw loty” (prosto i łatwo testowalnie).

### 2.4 Sekcje podróży (pozycje)
Wspólna zasada: **każda pozycja ma koszt w PLN i jedną ocenę 1–5**. To miejsce na polimorfizm: klasa bazowa
`Pozycja` z metodami typu `koszt()`, `oceny()`, `sekcja()`, `czy_dozwolona_dla(typ_podrozy)`
i klasy pochodne. Nowy rodzaj pozycji dodaje się bez zmiany kosztorysu.

| Sekcja | Pola | Dostępność |
|---|---|---|
| **Plan dnia** | kalendarz dzień po dniu, punkty planu z godziną i miejscem | obie |
| **Loty** | numer lotu, lotnisko wylotu i przylotu, data i godzina, koszt, ocena | tylko zagraniczna |
| **Transport** | środek (samochód, pociąg, autobus, prom, taksówka…), trasa, data, koszt, ocena | obie |
| **Posiłki** | co i gdzie (restauracja), data, koszt, **jedna ocena: restauracji** | obie |
| **Noclegi i atrakcje** | nazwa miejsca, rodzaj, data (nocleg: zameldowanie i opcjonalnie wymeldowanie), koszt, ocena, notatka | obie (z wariantu podstawowego) |
| **Wydatki inne** | kategoria, kwota w PLN, opis | obie |

### 2.5 Plan i lista „chcę odwiedzić”
- Lista miejsc do odwiedzenia z możliwością odhaczenia jako zaliczone.
- Planowany budżet.

### 2.6 Pamiętnik i album
- Wpisy pamiętnika z datą i treścią.
- Upload zdjęć (zapis na dysku), przypisanie do dnia (data dodania albo ręcznie wybrany dzień).
- Album układany automatycznie według dat.

### 2.7 Kosztorys i oceny
- Suma kosztów całkowita i z podziałem na sekcje.
- Porównanie z budżetem: ile zostało albo o ile przekroczono.
- Ocena zbiorcza jako zwykła średnia wszystkich ocen pozycji (bez wag, każda pozycja wnosi jedną ocenę) oraz średnie dla każdej sekcji.
- Widok archiwalny: kosztorys, ocena zbiorcza i album tylko do odczytu.

### 2.8 Rekomendacje (z własnych danych)
- Przy podróży do miasta, w którym użytkownik już był: najlepiej ocenione wcześniej restauracje i miejsca.
- Przypomnienie niezaliczonych punktów z list „chcę odwiedzić” z wcześniejszych podróży do tego miasta.

### 2.9 Testy (wymagane poziomy)

| Poziom | Co obejmuje |
|---|---|
| Jednostkowe backend (pytest) | maszyna stanów (dozwolone kroki do przodu i wstecz, zabronione przeskoki), reguła tylko do odczytu dla archiwum, reguły sekcji dla typu, kosztorys, średnie ocen, porównanie z budżetem, ranking rekomendacji, parsowanie odpowiedzi API pogody i NBP |
| Jednostkowe frontend (Vitest + Testing Library) | formatowanie kwot i dat, komponenty formularzy i widżetów, walidacja po stronie klienta |
| Integracyjne (pytest + TestClient) | endpointy na prawdziwej bazie SQLite (testowej), autoryzacja i izolacja danych użytkowników, upload zdjęć, zewnętrzne API podmienione atrapami. **Tworzone na późniejszym etapie** (sekcja 2.10) |
| Mutacyjne (mutmut) | moduł domenowy (statusy, kosztorys, oceny, rekomendacje) |
| E2E (Playwright, Python) | pełne życie podróży: rejestracja, utworzenie podróży, lot, przejazd, posiłek, zdjęcie, zmiana statusów, archiwum i sprawdzenie kosztorysu; test, że lotu nie da się dodać do podróży krajowej |
| Manualne | dokument ze scenariuszami: kroki i oczekiwany wynik, w tym czytelność UI i zachowanie przy braku internetu |

Frontend wzorcowo pod Playwright: atrybut `data-testid` na każdym elemencie interaktywnym i ważnym
wyniku (np. `trip-card-{id}`, `cost-total`), semantyczny HTML, etykiety `<label>` przy polach,
role ARIA, stabilne komunikaty błędów, brak selektorów opartych na klasach CSS. W testach wzorzec
Page Object.

### 2.10 Testy integracyjne (planowane na późniejszy etap)

Backend etapu 1 ma wyłącznie testy jednostkowe (moduł domenowy, parsowanie odpowiedzi API pogody
i NBP, typ kwot, zapis plików, walidacja danych wejściowych). Testy integracyjne powstaną
w osobnym, późniejszym etapie, w katalogu `backend/tests/integration/`. Do tego czasu próg pokrycia
kodu jest obniżony do 60%; po ich dodaniu wraca do 90%.

Sposób działania:
- pytest + `TestClient` z FastAPI: zapytania przechodzą przez całe API (nagłówek `X-User-Id`,
  walidacja, serwisy, baza), tak jak z frontendu,
- każdy test dostaje własną, świeżą bazę SQLite w katalogu tymczasowym; schemat powstaje przez
  prawdziwe migracje Alembic (raz na sesję do pliku-wzorca, potem kopia pliku dla każdego testu),
- zewnętrzne API (Open-Meteo, NBP) podmienione atrapami, które potrafią też zasymulować awarię,
- „dzisiejsza” data zamrożona (podmiana zależności), żeby odliczanie i domyślny dzień zdjęcia
  dawały powtarzalne wyniki.

Zakres:

| Obszar | Co sprawdzić |
|---|---|
| Konto | rejestracja, logowanie, zajęty login (409), brak lub zły nagłówek `X-User-Id` (401), profil i miasto pogody |
| Podróże | CRUD, izolacja danych (cudza podróż → 404 dla każdego endpointu), domyślna lista pakowania dla zagranicznej, blokada zmiany typu na krajową, gdy są loty |
| Statusy i archiwum | kroki do przodu i wstecz, zakaz przeskoków (409), każdy zapis do archiwum → 409, odczyt archiwum (kosztorys, album) działa, po cofnięciu do „zrealizowanej” edycja znów możliwa |
| Sekcje pozycji | pełny CRUD pięciu sekcji, lot w podróży krajowej → 409, walidacja ocen i kwot, nieistniejące id ze słownika → 422 |
| Plan, listy, pamiętnik | punkt planu poza terminem podróży → 422, odhaczanie „chcę odwiedzić” i pakowania (PATCH), pamiętnik |
| Zdjęcia | upload na dysk, album według dni, pobieranie pliku, odrzucenie plików niebędących zdjęciami i za dużych, usunięcie pliku razem ze zdjęciem i podróżą |
| Kosztorys, rekomendacje, statystyki | sumy i alert budżetu na danych z bazy, rekomendacje z wcześniejszych podróży do miasta, zapytania agregujące w statystykach, ekran główny i odliczanie |
| Zewnętrzne API | pogoda, wyszukiwanie miasta, kursy walut, kalkulator; awaria API → 503, a reszta aplikacji działa |
| Migracje i dokumentacja | migracje zgodne z modelami, cofanie migracji, dane słownikowe, Swagger/OpenAPI, jednolity format błędów, CORS |

## 3. Proponowane nowe funkcjonalności

Wybrałem tylko takie, które są tanie w implementacji i dają dodatkowy materiał do testów.

| # | Funkcjonalność | Nakład | Co daje testom |
|---|---|---|---|
| 1 | **Lista rzeczy do spakowania**: checklista per podróż; dla zagranicznej automatycznie dodaje paszport/dowód, ubezpieczenie, przejściówkę | mały | polimorfizm względem typu podróży, CRUD, prosty E2E |
| 2 | **Odliczanie do najbliższej podróży** na ekranie głównym („za 12 dni: Rzym”) | bardzo mały | czysta logika dat, test jednostkowy z „zamrożoną” datą |
| 3 | **Alert przekroczenia budżetu**: kolor ostrzeżenia przy 90% i przekroczeniu | bardzo mały | wartości graniczne (89/90/100/101%), idealne pod testy mutacyjne |
| 4 | **Statystyki zbiorcze**: średni koszt dnia, porównanie kosztów wg charakteru (góry vs morze), liczba podróży w roku | mały | zapytania agregujące w testach integracyjnych |
| 5 | **Filtrowanie i wyszukiwanie** podróży po charakterze, typie, roku, nazwie | mały | parametry zapytań API, E2E filtrów |
| 6 | **Pogoda dla celu podróży** w widoku podróży (to samo API co na stronie głównej, inne współrzędne) | mały | ponowne użycie klienta API z atrapą |
| 7 | **Kalkulator walut** przy kursach na stronie głównej (kwota w EUR/USD/GBP → PLN) | bardzo mały | zaokrąglenia, test jednostkowy na froncie i backendzie |
| 8 | **Kopiowanie podróży jako szablonu** (np. coroczny wyjazd w góry: kopiuje plan, listę pakowania i budżet, bez kosztów i zdjęć) | mały | reguła, co się kopiuje, a co nie |
| 9 | **Automatyczne zmiany statusu według dat** (przypomnienie lub propozycja „podróż się zaczęła, oznaczyć jako w trakcie?”) | mały | maszyna stanów + daty |
| 10 | **Tryb ciemny** (Pico CSS ma go wbudowanego) | prawie zero | scenariusz manualny |

**Decyzja (zaakceptowana przez Darka)**:
- **Wariant podstawowy** dostaje 1, 2, 3, 4 i 7 (lista pakowania, odliczanie, alert budżetu, statystyki, kalkulator walut).
- **Wariant zaawansowany** (etap 2, w tej samej aplikacji): 5, 6, 8, 9 i 10 (filtrowanie, pogoda celu podróży, szablony, automatyczne propozycje statusu, tryb ciemny).
- Kalkulator walut (7) jest tylko narzędziem pomocniczym na stronie głównej: przelicza kwotę, ale nic nie zapisuje. Wszystkie koszty w podróżach są wyłącznie w PLN.
- Odpada: koszty w obcych walutach, mapy, EXIF, OpenStreetMap, udostępnianie linkiem, eksport do PDF i innych plików.

## 4. Decyzje (potwierdzone przez Darka 18.10.2026)

| # | Pytanie | Decyzja |
|---|---|---|
| 1 | Zrealizowana a archiwum | Dwa różne etapy: zrealizowaną można uzupełniać, archiwum jest tylko do odczytu. |
| 2 | Ocena zbiorcza | Zwykła średnia bez wag. Posiłek ma **jedną ocenę: restauracji** (bez osobnej oceny dania). |
| 3 | Waluta kosztów | **Tylko PLN.** Bez walut obcych, także w wariancie zaawansowanym. |
| 4 | Plan dzień po dniu | Plan dnia i lista „chcę odwiedzić” dla obu typów podróży, loty tylko dla zagranicznych. |
| 5 | Cofanie statusu | **Można cofać.** Przyjmuję: o jeden krok wstecz, także z archiwum do zrealizowanej; bez przeskakiwania etapów. |
| 6 | Pogoda na stronie głównej | Użytkownik **wybiera miasto w widżecie** i widzi jego pogodę; wybór zapamiętany, domyślnie Warszawa. |
| 7 | Logowanie | Bardzo proste: login i hasło zapisane w bazie jawnym tekstem, bez hashowania i tokenów; id użytkownika w nagłówku `X-User-Id`. |
| 8 | Testy integracyjne | **Tworzone na późniejszym etapie** (sekcja 2.10). Backend etapu 1 ma tylko testy jednostkowe. |
| 9 | Daty pozycji (prośba frontendu, 31.10.2026) | Daty pozycji i wpisów pamiętnika w terminie podróży (wydatek – dowolna; lot – liczy się wylot, przylot najpóźniej 48 h później). Nocleg od–do, jeden nocleg na noc. Zmiana dat podróży **nie** sprawdza istniejących pozycji. |
| 10 | Okładka i zdjęcie miasta (prośba frontendu, 31.10.2026) | Użytkownik wybiera okładkę spośród zdjęć podróży (domyślnie pierwsze zdjęcie albumu). Podróż bez zdjęć może pokazać zdjęcie miasta z Wikipedii z linkiem do źródła. |

## 5. Kolejne kroki
1. Model danych: tabele i relacje.
2. Założenie repozytorium ze szkieletem (backend, frontend, Docker Compose, CI, SonarQube, README, AGENTS.md).
3. Testy integracyjne backendu (sekcja 2.10) – na późniejszym etapie; plan w `AGENTS.md`.
