# 01. Logowanie i rejestracja (wymaganie 2.1)

Zakres: rejestracja, logowanie i wylogowanie. Strona logowania: http://localhost:5173/logowanie.

Zasady walidacji: login 3–50 znaków, tylko litery, cyfry oraz `_`, `.`, `-`; hasło co najmniej 4 znaki.

| ID | Tytuł | Priorytet | Automat |
|---|---|---|---|
| TC-01 | Nowy użytkownik zakłada konto, wylogowuje się i loguje ponownie | Wysoki | ❌ Nie |
| TC-02 | Formularz rejestracji odrzuca błędne dane, a po poprawieniu zakłada konto | Wysoki | ❌ Nie |
| TC-03 | Nieudane logowanie i próba rejestracji na zajęty login, potem poprawne logowanie | Wysoki | ❌ Nie |
| TC-04 | Zalogowany użytkownik pozostaje zalogowany po odświeżeniu i w nowej karcie | Średni | ❌ Nie |

---

### TC-01 Nowy użytkownik zakłada konto, wylogowuje się i loguje ponownie

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.1 | Wysoki | ❌ Nie |

**Warunki wstępne:** aplikacja uruchomiona, użytkownik niezalogowany (np. nowe okno incognito).

**Dane testowe:** nowy, nieużywany login; poprawne hasło (co najmniej 4 znaki).

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Otwórz http://localhost:5173 | Adres zmienia się na `/logowanie`. Widać nagłówek „Zaloguj się”, pola „Login” i „Hasło” oraz przyciski „Zarejestruj się” i „Zaloguj się”. |
| 2 | Wpisz nowy login | Pole zawiera wpisany tekst, brak komunikatów błędu. |
| 3 | Wpisz hasło | Znaki są ukryte (wykropkowane). |
| 4 | Kliknij „Zarejestruj się” | Adres zmienia się na `/podroze`. W nagłówku widać „Moje podróże”, „Statystyki” i przycisk „Wyloguj”. |
| 5 | Obejrzyj listę podróży | Zakładki „Wszystkie 0”, „W planie 0”, „W trakcie 0”, „Zrealizowane 0”, „Archiwum 0”. Komunikat: „Nie masz jeszcze żadnych podróży. Dodaj pierwszą przyciskiem „Nowa podróż”.” |
| 6 | Kliknij „Wyloguj” | Adres zmienia się na `/logowanie`, formularz jest pusty. |
| 7 | Wpisz w pasek adresu http://localhost:5173/podroze i zatwierdź | Aplikacja przekierowuje z powrotem na `/logowanie` – bez logowania nie da się wejść na listę podróży. |
| 8 | Wpisz login i hasło z kroków 2–3, kliknij „Zaloguj się” | Adres zmienia się na `/podroze`, widać ekran „Moje podróże” tego samego konta (0 podróży). |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-02 Formularz rejestracji odrzuca błędne dane, a po poprawieniu zakłada konto

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.1 | Wysoki | ❌ Nie |

**Warunki wstępne:** strona `/logowanie`, użytkownik niezalogowany.

**Dane testowe:** login 2-znakowy, login 51-znakowy, login ze spacją w środku, login ze znakiem `@`,
hasło 3-znakowe, hasło 4-znakowe; na końcu nowy, nieużywany login.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Nie wpisując nic, kliknij „Zarejestruj się” | Pod polem „Login”: „Podaj login.”, pod polem „Hasło”: „Podaj hasło.” Adres zostaje `/logowanie`. |
| 2 | Wpisz login 2-znakowy i hasło 3-znakowe, kliknij „Zarejestruj się” | Pod polem „Login”: „Login musi mieć od 3 do 50 znaków.”, pod polem „Hasło”: „Hasło musi mieć co najmniej 4 znaki.” |
| 3 | Zmień login na login ze spacją w środku, hasło na 4-znakowe, kliknij „Zarejestruj się” | Pod polem „Login”: „Login może zawierać tylko litery, cyfry oraz znaki „_”, „.” i „-”.” Błąd przy haśle znika. |
| 4 | Zmień login na login ze znakiem `@`, kliknij „Zarejestruj się” | Ten sam komunikat o dozwolonych znakach. Konto nie powstaje. |
| 5 | Zmień login na 51-znakowy, kliknij „Zarejestruj się” | Pod polem „Login”: „Login musi mieć od 3 do 50 znaków.” |
| 6 | Zmień login na nowy, nieużywany (hasło 4-znakowe zostaje), kliknij „Zarejestruj się” | Komunikaty błędów znikają, adres zmienia się na `/podroze` – konto założone. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-03 Nieudane logowanie i próba rejestracji na zajęty login, potem poprawne logowanie

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.1 | Wysoki | ❌ Nie |

**Warunki wstępne:** istnieje konto z hasłem zawierającym wielką literę (np. z TC-01), użytkownik wylogowany, strona `/logowanie`.

**Dane testowe:** login istniejącego konta i jego hasło; to samo hasło pisane małymi literami; login, który nie istnieje.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Wpisz login, który nie istnieje, i dowolne hasło, kliknij „Zaloguj się” | Nad polami komunikat: „Nieprawidłowy login lub hasło.” Adres zostaje `/logowanie`. |
| 2 | Wpisz login istniejącego konta i jego hasło pisane małymi literami, kliknij „Zaloguj się” | Ten sam komunikat: „Nieprawidłowy login lub hasło.” – hasło rozróżnia wielkość liter, a aplikacja nie zdradza, czy login istnieje. |
| 3 | Nie zmieniając danych, kliknij „Zarejestruj się” | Komunikat: „Login „<login>” jest już zajęty.” Drugie konto o tym loginie nie powstaje. |
| 4 | Wpisz poprawne hasło i kliknij "Zaloguj się" | Wykonuje się logowanie (nie rejestracja): adres zmienia się na `/podroze`, widać przycisk „Wyloguj”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-04 Zalogowany użytkownik pozostaje zalogowany po odświeżeniu i w nowej karcie

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.1 | Średni | ❌ Nie |

**Warunki wstępne:** użytkownik zalogowany, otwarty ekran `/podroze`.

**Dane testowe:** –

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Odśwież stronę (F5) | Nadal widać ekran „Moje podróże” – nie trzeba logować się ponownie. |
| 2 | Wpisz w pasek adresu http://localhost:5173/logowanie | Aplikacja od razu przechodzi na `/podroze` – zalogowany nie widzi formularza logowania. |
| 3 | Otwórz nową kartę i wejdź na http://localhost:5173 | Otwiera się `/podroze`, użytkownik nadal zalogowany. |
| 4 | W nowej karcie kliknij „Wyloguj”, wróć do pierwszej karty i odśwież ją | Pierwsza karta przechodzi na `/logowanie` – wylogowanie działa we wszystkich kartach po odświeżeniu. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …
