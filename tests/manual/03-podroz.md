# 03. Podróż (wymaganie 2.3)

Zakres: tworzenie, edycja i usuwanie podróży, typ (krajowa / zagraniczna), charakter, cykl życia
statusów (`w planie ⇄ w trakcie ⇄ zrealizowana ⇄ archiwum`), archiwum tylko do odczytu, blokada
zmiany typu na krajową, gdy podróż ma loty.

| ID | Tytuł | Priorytet | Automat |
|---|---|---|---|
| TC-10 | Użytkownik tworzy podróż, edytuje ją i usuwa | Wysoki | ✅ Tak |
| TC-11 | Formularz podróży odrzuca błędne dane, a po poprawieniu zapisuje podróż | Wysoki | ✅ Tak |
| TC-12 | Typ podróży decyduje o sekcjach, a zmiana na krajową jest zablokowana, gdy są loty | Wysoki | ✅ Tak |
| TC-13 | Status podróży zmienia się o jeden krok do przodu i wstecz | Wysoki | ✅ Tak |
| TC-14 | Podróż w archiwum jest tylko do odczytu do czasu cofnięcia statusu | Wysoki | ✅ Tak |
| TC-15 | Pominięcie etapu statusu przez API jest odrzucane | Średni | ❌ Nie (test API) |

---

### TC-10 Użytkownik tworzy podróż, edytuje ją i usuwa

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.3 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, ekran `/podroze`. Zanotuj liczby przy zakładkach.

**Dane testowe:** nazwa „Rzym zimą”, miasto „Rzym”, kraj „Włochy”, budżet `3000,50`, data od – za
miesiąc, data do – 4 dni później (podróż 5-dniowa), typ „Zagraniczna”, charakter „Miasto”.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Kliknij „Nowa podróż” | Adres `/podroze/nowa`, nagłówek „Nowa podróż”. Domyślnie: typ „Zagraniczna”, charakter „Miasto”. Lista charakterów: Góry, Morze, Miasto, Jeziora, Wieś, Inny. Lista typów: Krajowa, Zagraniczna. |
| 2 | Wypełnij pola danymi testowymi i kliknij „Zapisz podróż” | Adres zmienia się na `/podroze`. Liczniki zakładek „Wszystkie” i „W planie” zwiększyły się o 1. |
| 3 | Zweryfikuj kartę „Rzym zimą” | Karta o statusie „W PLANIE”, daty w formacie DD.MM.RRRR, „Zagraniczna”, „Miasto”. |
| 4 | Kliknij kartę „Rzym zimą” | Szczegóły podróży: tytuł „Rzym zimą”, status „W PLANIE”, przyciski „Edytuj”, „Usuń podróż”, „Rozpocznij podróż” są widoczne i aktywne. |
| 5 | Zweryfikuj zakładkę „Przegląd” | Cel „Rzym, Włochy”, termin zgodny z datami, czas trwania „5 dni”, budżet „3000,50 zł”. W części „Zdjęcia”: „Ta podróż nie ma jeszcze zdjęć. Dodaj je w edycji podróży.” |
| 6 | Kliknij „Edytuj” | Adres `/podroze/<id>/edycja`, nagłówek „Edytuj podróż”, pola wypełnione zapisanymi danymi, widoczne aktywne przyciski "Anuluj" i „Zapisz zmiany”. |
| 7 | Zmień nazwę na „Rzym zimą – zmiana”, charakter na „Inny”, budżet na `5000`, datę od przesuń o 5 dni w przyszłość, datę do przesuń o 6 dni w przyszłość, kliknij „Zapisz zmiany” | Powrót do szczegółów. Tytuł „Rzym zimą – zmiana”, w opisie pod tytułem widoczne zmienione daty oraz charakter = „Inny”. W Przegladzie widoczny zmieniony termin podróży, czas trwania i budżet podróży, zgodne z edytowanymi wartościami w poprzednim kroku. |
| 8 | Kliknij „Usuń podróż” | Otwiera się okno modalne „Usunąć podróż?” z treścią „„Rzym zimą – zmiana” zostanie usunięta razem ze wszystkimi wpisami i zdjęciami. Tego nie da się cofnąć.” Fokus jest na przycisku „Anuluj”. |
| 9 | Kliknij „Anuluj” | Okno się zamyka, podróż nadal jest wyświetlana, a po przeładowaniu strony, status podróży = "W PLANIE" |
| 10 | Kliknij ponownie „Usuń podróż”, następnie w oknie kliknij „Usuń podróż” | Adres `/podroze`, karty „Rzym zimą – zmiana” nie ma na liście "Wszystkie", liczniki zakładek „Wszystkie” i „W planie” wróciły do zanotowanych przed testem. |
| 11 | Wpisz w pasek adres usuniętej podróży `/podroze/<id>` | Komunikat „Nie znaleziono podróży.” i przycisk „Spróbuj ponownie”. |
| 12 | Kliknij "Spróbuj ponownie" | Komunikat „Nie znaleziono podróży.” i przycisk „Spróbuj ponownie”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-11 Formularz podróży odrzuca błędne dane, a po poprawieniu zapisuje podróż

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.3 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, ekran `/podroze/nowa`.

**Dane testowe:** nazwa „Test”, miasto „Rzym”, kraj „Włochy”, data od – za miesiąc, data do –
5 dni wcześniej niż data od; budżety: `0`, następnie `2500`.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Nie wypełniając pól, kliknij „Zapisz podróż” | Nad formularzem widoczny komunikat walidacyjny „Popraw zaznaczone pola.” Przy polach: „Podaj nazwę podróży.”, „Podaj miasto.”, „Podaj kraj.”, „Podaj datę rozpoczęcia.”, „Podaj datę zakończenia.” Adres zostaje `/podroze/nowa`. |
| 2 | Wpisz nazwę, miasto, kraj i datę do, datę od (późniejszą niż data od). Budżet `0`. Kliknij „Zapisz podróż” | Błędy przy nazwie, mieście, kraju i dacie od i do znikają. Przy „Data do”: „Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.” Przy budżecie: „Podaj kwotę większą od zera, np. 2500 albo 2500,50.” |
| 3 | Zmień budżet na `abc`, kliknij „Zapisz podróż” | Przy budżecie ten sam komunikat o kwocie. |
| 4 | Ustaw datę do równą dacie od (podróż 1-dniowa), budżet `2500`, kliknij „Zapisz podróż” | Podróż zapisana, adres `/podroze`, karta „Test” widoczna na liście w grupie podróży o statusie „W planie”. |
| 5 | Kliknij „Nowa podróż”, wpisz coś w pole „Nazwa”, kliknij „Anuluj” | Okno „Wyjść bez zapisania?” z przyciskami „Zostań” i „Wyjdź bez zapisania”. |
| 6 | Kliknij „Wyjdź bez zapisania” | Powrót na `/podroze`, nowa podróż nie powstała i nie jest widoczna na liście |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-12 Typ podróży decyduje o sekcjach, a zmiana na krajową jest zablokowana ze względu na loty

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.3 | Wysoki | ✅ Tak (lot dodany przez API) |

**Warunki wstępne:** użytkownik zalogowany. Konto ma zagraniczną podróż „Rzym zimą” (status
„w planie”) z jednym lotem (np. WAW → FCO, pierwszego dnia podróży) oraz krajową podróż.

**Dane testowe:** –

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Otwórz szczegóły podróży zagranicznej „Rzym zimą” | Dostępne są zakładki: Przegląd, Plan dnia, **Loty**, Transport, Posiłki, Noclegi i atrakcje, Wydatki inne, Chcę odwiedzić, Pakowanie, Pamiętnik, Kosztorys. |
| 2 | Kliknij zakładkę „Pakowanie” | „Spakowane: 0 z 3”, na liście trzy rzeczy z dopiskiem „z listy domyślnej”: „Paszport lub dowód osobisty”, „Ubezpieczenie podróżne”, „Przejściówka do gniazdka”. |
| 3 | Otwórz szczegóły podróży krajowej | Dostępne są zakładki: Przegląd, Plan dnia, Transport, Posiłki, Noclegi i atrakcje, Wydatki inne, Chcę odwiedzić, Pakowanie, Pamiętnik, Kosztorys. |
| 4 | Kliknij zakładkę „Pakowanie” | Widoczny nagłówek: "Lista pakowania", "Rzecz do spakowania" oraz widoczny aktywny przycisk "Dodaj" |
| 5 | Przejdź do podróży zagranicznej z korku 1. kliknij „Edytuj”, zmień typ podróży na „Krajowa”, kliknij „Zapisz zmiany” | Formularz zostaje otwarty. Nad formularzem i przy polu „Typ”: „Nie można zmienić typu podróży na „krajowa”, bo podróż ma pozycje w sekcji: Loty. Usuń je najpierw.” |
| 6 | Kliknij „Anuluj”, potem „Wyjdź bez zapisania” | Powrót do szczegółów, typ nadal „Zagraniczna”. |
| 7 | Kliknij zakładkę „Loty”, przy locie kliknij „Usuń”, potwierdź w oknie | Lot zostaje usunięty, w zakłądce Loty widoczny komunikat „Nie dodano jeszcze żadnego lotu.” |
| 8 | Kliknij „Edytuj”, zmień typ na „Krajowa”, kliknij „Zapisz zmiany” | Powrót do szczegółów w zakładce "Przegląd", w opisie podróży typ = „Krajowa”. |
| 9 | Zweryfikuj zakładki | Zakładka „Loty” nie jest widoczna. Pozostałe zakładki są widoczne. |
| 10 | Kliknij zakładkę „Pakowanie” | Widoczny nagłówek: "Lista pakowania", "Rzecz do spakowania" oraz widoczny aktywny przycisk "Dodaj" |
| 11 | Kliknij „Edytuj”, zmień typ na „Zagraniczna”, kliknij „Zapisz zmiany” | Powrót do szczegółów w zakładce "Przegląd", w opisie podróży typ = „Zagraniczna”. |
| 12 | Zweryfikuj zakładki | Zakładka „Loty” jest widoczna. Pozostałe zakładki są widoczne. |
| 13 | Kliknij zakładkę „Pakowanie” | „Spakowane: 0 z 3”, na liście trzy rzeczy z dopiskiem „z listy domyślnej”: „Paszport lub dowód osobisty”, „Ubezpieczenie podróżne”, „Przejściówka do gniazdka”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-13 Status podróży zmienia się o jeden krok do przodu i wstecz

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.3 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż w statusie „w planie”, otwarte jej szczegóły.

**Dane testowe:** –

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zweryfikuj nagłówek podróży | Status „W PLANIE”. Widoczny i aktywny przycisk: „Rozpocznij podróż”. Przyciski „Edytuj” i „Usuń podróż” nadal dostępne. |
| 2 | Kliknij „Rozpocznij podróż” | Status „W TRAKCIE”. Widoczne i aktywne przyciski: „Cofnij”, "Zakończ podróż". Przyciski „Edytuj” i „Usuń podróż” nadal dostępne. |
| 3 | Wróć na listę podróży „← Moje podróże” | Podróż jest widoczna w zakładce "Wszystkie" ze statusem „W trakcie” oraz w zakładce „W trakcie”. |
| 4 | Przejdź ponownie do podróży i kliknij „Cofnij” | Status wraca do „W PLANIE”. Widoczny i aktywny przycisk: „Rozpocznij podróż”. Przyciski „Edytuj” i „Usuń podróż” nadal dostępne. |
| 5 | Wróć na listę podróży „← Moje podróże” | Podróż jest widoczna w zakładce "Wszystkie" ze statusem „W planie” oraz w zakładce „W planie”. |
| 6 | Przejdź ponownie do podróży i kliknij „Rozpocznij podróż”, następnie kliknij „Zakończ podróż” | Status „ZREALIZOWANA”. Widoczne i aktywne przyciski: „Cofnij” i „Przenieś do archiwum”. Przyciski „Edytuj” i „Usuń podróż” nadal dostępne. |
| 7 | Wróć na listę podróży „← Moje podróże” | Podróż jest widoczna w zakładce "Wszystkie" ze statusem „Zrealizowana” oraz w zakładce „Zrealizowane”. |
| 8 | Przejdź ponownie do podróży i kliknij „Cofnij” | Status „W TRAKCIE”. Widoczne i aktywne przyciski: „Cofnij”, "Zakończ podróż". Przyciski „Edytuj” i „Usuń podróż” nadal dostępne. |
| 9 | Wróć na listę podróży „← Moje podróże” | Podróż jest widoczna w zakładce "Wszystkie" ze statusem „W trakcie” oraz w zakładce „W trakcie”. |
| 10 | Przejdź ponownie do podróży i kliknij "Zakończ podróż", następnie „Przenieś do archiwum” | Status „ARCHIWUM”. Widoczny i aktywny przycisk: „Cofnij”. Przyciski „Edytuj” i „Usuń podróż” nie są widoczne. Widoczny jest komunikat 'Podróż jest w archiwum – można ją tylko przeglądać. Aby coś zmienić, cofnij status.' |
| 11 | Wróć na listę podróży „← Moje podróże” | Podróż jest widoczna w zakładce "Wszystkie" ze statusem „W archiwum" oraz w zakładce „Archiwum”. |
| 12 | Przejdź ponownie do podróży i kliknij „Cofnij” | Status „ZREALIZOWANA”. Widoczne i aktywne przyciski: „Cofnij” i „Przenieś do archiwum”. Komunikat 'Podróż jest w archiwum – można ją tylko przeglądać. Aby coś zmienić, cofnij status.' nie jest już widoczny. Przyciski „Edytuj” i „Usuń podróż” nadal dostępne. |
| 13 | Wróć na listę podróży „← Moje podróże” | Podróż jest widoczna w zakładce "Wszystkie" ze statusem „Zrealizowana” oraz w zakładce „Zrealizowane”. |


**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-14 Podróż w archiwum jest tylko do odczytu do czasu cofnięcia statusu

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.3 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż zagraniczną w statusie „zrealizowana” z co najmniej jedna pozycją w każdej zakładce, otwarte szczegóły podróży.

**Dane testowe:** –

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Kliknij „Przenieś do archiwum” | Status „ARCHIWUM”. Komunikat: „Podróż jest w archiwum – można ją tylko przeglądać. Aby coś zmienić, cofnij status.” Przyciski „Edytuj” i „Usuń podróż” nie są widoczne. |
| 2 | Kliknij zakładkę „Posiłki” | Posiłek jest widoczny, ale nie ma przycisku „Dodaj posiłek” ani przycisków „Edytuj”, „Kopiuj”, „Usuń” przy pozycji. |
| 3 | Przejrzyj zakładki „Plan dnia”, "Loty", "Transport", "Noclegi i atrakcje", "Wydatki inne", „Chcę odwiedzić”, „Pakowanie”, „Pamiętnik”, "Kosztorys" | W żadnej nie ma przycisków dodawania, edycji ani usuwania; pola wyboru są zablokowane, pozycje w zakładkach są widoczne. |
| 4 | Wpisz w pasek adres `/podroze/<id>/edycja` | Zamiast formularza komunikat: „Podróż jest w archiwum – nie można jej edytować. Aby coś zmienić, cofnij jej status.” i link „Wróć do podróży”. |
| 5 | Kliknij „Wróć do podróży”, następnie kliknij „Cofnij” | Status „ZREALIZOWANA”, komunikat o archiwum nie jest już widoczny, ponownie widoczne i aktywne są przyciski „Edytuj” i „Usuń podróż”. |
| 7 | Kliknij zakładkę „Plan dnia” | Widoczny jest przycisk „Dodaj punkt planu”. |
| 8 | Kliknij zakładkę „Transport” | Widoczny jest przycisk „Dodaj przejazd”. |
| 9 | Kliknij zakładkę „Posiłki” | Widoczny jest przycisk „Dodaj posiłek” oraz przyciski „Edytuj”, „Kopiuj”, „Usuń” przy posiłkach. |
| 10 | Kliknij zakładkę „Noclegi i atrakcje” | Widoczny jest przycisk „Dodaj nocleg lub atrakcje” oraz przyciski „Edytuj”, „Kopiuj”, „Usuń” przy noclegu. |
| 11 | Kliknij zakładkę „Wydatki inne” | Widoczny jest przycisk „Dodaj wydatek”. |
| 12 | Kliknij zakładkę „Chcę odwiedzić” | Widoczny jest przycisk „Dodaj” oraz przyciski „Edytuj”, „Usuń” przy pozycji. |
| 13 | Kliknij zakładkę „Pakowanie” | Widoczny jest przycisk „Dodaj” oraz  Lista pakowania: „Spakowane: 0 z 3”, na liście trzy rzeczy z dopiskiem „z listy domyślnej”: „Paszport lub dowód osobisty”, „Ubezpieczenie podróżne”, „Przejściówka do gniazdka”. |
| 14 | Kliknij zakładkę „Pamiętnik” | Widoczny jest przycisk „Dodaj wpis”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-15 Pominięcie etapu statusu przez API jest odrzucane

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.3 | Średni | ❌ Nie (test API w `tests/e2e`, bez GUI) |

GUI nie pokazuje przycisku przeskakującego etap, więc regułę sprawdza się przez API – ręcznie w
Swaggerze: http://localhost:8000/docs.

**Warunki wstępne:** konto ma podróż w statusie „w planie”; znane id użytkownika i id podróży.

**Dane testowe:** status docelowy `archived`.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Wywołaj `POST /api/trips/{id}/status` z treścią `{"status": "archived"}` | Odpowiedź **409**, `code`: `INVALID_STATUS_TRANSITION`, `detail`: „Nie można zmienić statusu z „w planie” na „archiwum”. Status zmienia się zawsze o jeden krok do przodu albo wstecz.” |
| 2 | Zweryfikuj szczegóły podróży w aplikacji | Status podróży nadal „W PLANIE”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …
