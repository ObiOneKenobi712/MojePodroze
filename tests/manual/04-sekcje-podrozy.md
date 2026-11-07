# 04. Sekcje podróży – pozycje (wymaganie 2.4)

Zakres: plan dnia, loty (tylko podróż zagraniczna), transport, posiłki (jedna ocena restauracji),
noclegi i atrakcje, wydatki inne. Każda pozycja kosztowa ma koszt w PLN i jedną ocenę 1–5
(wydatki inne – bez oceny).

Wspólne dla sekcji: formularz otwiera się przyciskiem „Dodaj …”, przy pozycji są przyciski
„Edytuj”, „Kopiuj” (nowy formularz z danymi pozycji) i „Usuń” (z oknem potwierdzenia). Pod listą
sekcji kosztowej jest suma „Razem: … zł”. Data pozycji domyślnie = pierwszy dzień podróży,
kalendarz pozwala wybrać tylko dni z terminu podróży (poza wydatkami innymi).

W przypadkach testowych „dzień 1” oznacza pierwszy dzień podróży, „dzień 2” – drugi itd.

| ID | Tytuł | Priorytet | Automat |
|---|---|---|---|
| TC-16 | Użytkownik układa plan dnia – punkty grupują się według dni i godzin | Wysoki | ✅ Tak |
| TC-17 | Użytkownik dodaje, edytuje, kopiuje i usuwa loty w podróży zagranicznej | Wysoki | ✅ Tak |
| TC-18 | Użytkownik dodaje przejazd z wybranym środkiem transportu | Wysoki | ✅ Tak |
| TC-19 | Posiłek ma jedną ocenę restauracji, a suma sekcji liczy koszty | Wysoki | ✅ Tak |
| TC-20 | Noclegi nie mogą się nakładać, atrakcje mają jedną datę | Wysoki | ✅ Tak |
| TC-21 | Wydatki inne mają kategorię, nie mają oceny, a data jest opcjonalna | Średni | ✅ Tak |

---

### TC-16 Użytkownik układa plan dnia – punkty grupują się według dni i godzin

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.4 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż krajową (status „w planie”, 5 dni) bez punktów planu, otwarta zakładka „Plan dnia”.

**Dane testowe:** punkty: „Westerplatte” – dzień 2, 14:00; „Długi Targ” – dzień 2, 09:30, opis
„Spacer po Starym Mieście”; „Molo w Sopocie” – dzień 1, bez godziny.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zweryfikuj zakładkę | Komunikat: „Plan jest pusty. Dodaj pierwszy punkt – miejsce i dzień, a godzinę, jeśli ją znasz.” |
| 2 | Kliknij „Dodaj punkt planu” | Formularz „Nowy punkt planu” z polami: Miejsce, Dzień (domyślnie dzień 1), Godzina (opcjonalnie), Opis (opcjonalnie). |
| 3 | Nie wpisując miejsca, kliknij „Dodaj” | Widoczny komunikat „Popraw zaznaczone pola.”, przy polu „Miejsce”: „Podaj miejsce.” |
| 4 | Dodaj kolejno trzy punkty z danych testowych | Po każdym zapisie formularz się zamyka, punkt pojawia się na liście. |
| 5 | Zweryfikuj listę | Dwie grupy: „Dzień 1 · <dzień tygodnia>, <data>” z punktem „Molo w Sopocie” („bez godziny”) oraz „Dzień 2 · …” z punktami w kolejności godzin: „Długi Targ” (09:30, z opisem), potem „Westerplatte” (14:00). |
| 6 | Przy pozycji „Westerplatte” kliknij „Edytuj”, zmień godzinę na 08:00, kliknij „Zapisz zmiany” | W grupie „Dzień 2” „Westerplatte” widoczne przed „Długim Targiem”. |
| 7 | Przy pozycji „Molo w Sopocie” kliknij „Kopiuj” | Otwiera się formularz „Nowy punkt planu” wypełniony danymi punktu. |
| 8 | Zmień dzień na dzień 3 i kliknij „Dodaj” | Pojawia się grupa „Dzień 3 · …” z punktem „Molo w Sopocie”; punkt w dniu 1 zostaje widoczny. |
| 9 | Przy punkcie w dniu 3 kliknij „Usuń” i potwierdź | Punkt i grupa „Dzień 3” zostają usunięte i nie są wiodczne na liście. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-17 Użytkownik dodaje, edytuje, kopiuje i usuwa loty w podróży zagranicznej

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.4 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż zagraniczną (5 dni) bez lotów, otwarta zakładka „Loty”.

**Dane testowe:** lot TP 1245, WAW → LIS, wylot dzień 1 08:00, koszt `850,00`, ocena 4 / 5;
przyloty: dzień 1 07:00 (przed wylotem), dzień 3 09:00 (ponad 48 h), dzień 1 12:30 (poprawny).

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zweryfikuj zakładkę | Widoczny komunikat „Nie dodano jeszcze żadnego lotu.” i przycisk „Dodaj lot”. |
| 2 | Kliknij „Dodaj lot”, potem od razu „Dodaj” | widoczne komunikaty walidacyjne „Popraw zaznaczone pola.” Przy polach: „Podaj numer lotu, np. LO 327.”, „Podaj lotnisko wylotu.”, „Podaj lotnisko przylotu.”, „Podaj datę i godzinę wylotu.”, „Podaj kwotę, np. 45 albo 45,50.” |
| 3 | Zweryfikuj listę „Ocena” | Opcje: „bez oceny”, „5 / 5”, „4 / 5”, „3 / 5”, „2 / 5”, „1 / 5”. |
| 4 | Wypełnij lot danymi testowymi, przylot: dzień 1 07:00, kliknij „Dodaj” | Przy przylocie widoczny komunikat: „Przylot nie może być wcześniejszy niż wylot.” |
| 5 | Zmień przylot na dzień 3 09:00, kliknij „Dodaj” | Przy przylocie: „Przylot najpóźniej 48 godziny po wylocie.” |
| 6 | Zmień przylot na dzień 1 12:30, kliknij „Dodaj” | Formularz się zamyka. Na liście widoczny lot: „WAW → LIS”, „TP 1245 · wylot <data>, 08:00 · przylot <data>, 12:30”, 4 gwiazdki, „850,00 zł”. Pod listą widoczne podsumowanie: „Razem: 850,00 zł”. |
| 7 | Kliknij „Edytuj” przy locie | Formularz „Edytuj lot” z danymi lotu i przyciskiem „Zapisz zmiany”. |
| 8 | Zmień koszt na `900`, kliknij „Zapisz zmiany” | Na liście „900,00 zł”, „Razem: 900,00 zł”. |
| 9 | Kliknij „Kopiuj” przy locie | Formularz „Nowy lot” wypełniony danymi lotu TP 1245. |
| 10 | Zmień: numer TP 1246, LIS → WAW, wylot dzień 5 18:00, przylot wyczyść, kliknij „Dodaj” | Na liście dwa loty, drugi bez przylotu. Pod listą widoczne podsumowanie: „Razem: 1800,00 zł”. |
| 11 | Przy locie TP 1245 kliknij „Usuń” | Okno „Usunąć lot?” z treścią „Lot TP 1245 (WAW → LIS) zniknie z listy i z kosztorysu.” |
| 12 | Kliknij „Usuń lot” | Na liście widoczny tylko TP 1246. Pod listą widoczne podsumowanie: „Razem: 900,00 zł”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …


---

### TC-18 Użytkownik dodaje przejazd z wybranym środkiem transportu

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.4 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż (dowolnego typu) bez przejazdów, otwarta zakładka „Transport”.

**Dane testowe:** pociąg, dzień 1, Warszawa → Gdańsk, koszt `159,90`, ocena 5 / 5.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zweryfikuj zakładkę | Widoczny komunikat „Nie dodano jeszcze żadnego przejazdu.” i przycisk „Dodaj przejazd”. |
| 2 | Kliknij „Dodaj przejazd” | Formularz „Nowy przejazd”. Lista „Środek transportu”: Samochód, Pociąg, Autobus, Prom, Taksówka, Komunikacja miejska, Rower, Inny. Data domyślnie dzień 1, kalendarz tylko w terminie podróży. |
| 3 | Kliknij „Dodaj” bez wypełniania | Widoczny komunikat walidacyjny formularza: "Popraw zaznaczone pola". Przy polach widoczne komunikaty walidacyjne: „Podaj miejsce wyjazdu.”, „Podaj miejsce docelowe.”, „Podaj kwotę, np. 45 albo 45,50.” |
| 4 | Wypełnij dane testowe, kliknij „Dodaj” | Na liście: „Warszawa → Gdańsk”, „Pociąg · <data dnia 1>”, 5 gwiazdek, „159,90 zł”. „Razem: 159,90 zł”. |
| 5 | Kliknij „Kopiuj”, zamień trasę na Gdańsk → Warszawa, dzień 5, kliknij „Dodaj” | Dwa przejazdy sa widoczne na liście, „Razem: 319,80 zł”. |
| 6 | Przy przejeździe Gdańsk → Warszawa kliknij „Edytuj”, zmień środek na „Autobus”, koszt `49`, kliknij „Zapisz zmiany” | Widoczna pozycja „Autobus”, „49,00 zł”; „Razem: 208,90 zł”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-19 Posiłek ma jedną ocenę restauracji, a suma sekcji liczy koszty

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.4 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż bez posiłków, otwarta zakładka „Posiłki”.

**Dane testowe:** „Pierogi” w „Pierogarnia Mandu”, dzień 2, koszt `62,50`, ocena 5 / 5;
„Zupa rybna” w „Bar przy plaży”, dzień 3, koszt `0`, bez oceny; koszt błędny `-10`.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Kliknij „Dodaj posiłek”, następnie „Dodaj” bez wypełniania | Widoczny komunikat walidacyjny formularza: "Popraw zaznaczone pola". Przy polach widoczne komunikaty walidacyjne: „Podaj, co było jedzone.”, „Podaj nazwę restauracji.”, „Podaj kwotę, np. 45 albo 45,50.” |
| 2 | Zweryfikuj formularz | Pola: Danie, Restauracja, Data, Koszt (PLN), **Ocena restauracji** – jedno pole oceny (brak osobnej oceny dania). |
| 3 | Wpisz „Pierogi”, „Pierogarnia Mandu”, dzień 2, koszt `-10`, kliknij „Dodaj” | Przy koszcie: „Podaj kwotę, np. 45 albo 45,50.” |
| 4 | Zmień koszt na `62,50`, ocena 5 / 5, kliknij „Dodaj” | Na liście: „Pierogi”, „Pierogarnia Mandu · <data>”, 5 gwiazdek, „62,50 zł”. „Razem: 62,50 zł”. |
| 5 | Dodaj „Zupa rybna” z kosztem `0` i oceną „bez oceny” | Pozycja z napisem „bez oceny” i „0,00 zł”. „Razem: 62,50 zł”. |
| 6 | Przy pozycji „Pierogi” kliknij „Usuń”, następnie w oknie wybierz „Anuluj” | Pozycja zostaje widoczna na liście. |
| 7 | Ponownie kliknij „Usuń” przy pozycji „Pierogi” i potwierdź | Na liście widoczna tylko „Zupa rybna”, „Razem: 0,00 zł”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-20 Noclegi nie mogą się nakładać, atrakcje mają jedną datę

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.4 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż (5 dni) bez noclegów i atrakcji, otwarta zakładka „Noclegi i atrakcje”.

**Dane testowe:** „Hotel Gdańsk” – nocleg, zameldowanie dzień 1, wymeldowanie dzień 4, koszt `1200`,
ocena 4 / 5; „Hostel Motława” – nocleg, koszt `150`; „Muzeum II Wojny Światowej” – atrakcja,
dzień 2, koszt `40`, ocena 5 / 5, notatka „Kupić bilety online”.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Kliknij „Dodaj nocleg lub atrakcję” | Formularz „Nowy nocleg lub atrakcja”. Rodzaj: Nocleg / Atrakcja (domyślnie Nocleg). Przy noclegu pole daty nazywa się „Zameldowanie” i jest pole „Wymeldowanie (opcjonalnie)”. |
| 2 | Wpisz „Hotel Gdańsk”, zameldowanie dzień 1, wymeldowanie też dzień 1, koszt i ocenę, kliknij „Dodaj” | Przy wymeldowaniu widoczny komunikat walidacyjny: „Wymeldowanie musi być później niż zameldowanie.” |
| 3 | Zmień wymeldowanie na dzień 4, kliknij „Dodaj” | Na liście: „Hotel Gdańsk”, „Nocleg · <dzień 1>–<dzień 4> · 3 noce”, 4 gwiazdki, „1200,00 zł”. |
| 4 | Dodaj nocleg „Hostel Motława” z zameldowaniem dzień 3 (bez wymeldowania), kliknij „Dodaj” | Przy zameldowaniu widoczny komunikat walidacyjny: „W tym terminie jest już nocleg „Hotel Gdańsk” (<dzień 1>–<dzień 4>). Zmień daty albo edytuj tamten nocleg.” |
| 5 | Zmień zameldowanie na dzień 4 (dzień wymeldowania z hotelu), kliknij „Dodaj” | Zapisano pomyślnie: „Hostel Motława”, „Nocleg · <dzień 4>–<dzień 5> · 1 noc”, „bez oceny”. |
| 6 | Kliknij „Dodaj nocleg lub atrakcję”, wybierz rodzaj „Atrakcja” | Pole daty = „Data”, pole „Wymeldowanie” nie jest widoczne. |
| 7 | Wypełnij atrakcję danymi testowymi z notatką, kliknij „Dodaj” | Na liście widoczne: „Muzeum II Wojny Światowej”, „Atrakcja · <dzień 2>”, 5 gwiazdek, notatka „Kupić bilety online”, „40,00 zł”. |
| 8 | Zweryfikuj sumę | „Razem: 1390,00 zł”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-21 Wydatki inne mają kategorię, nie mają oceny, a data jest opcjonalna

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.4 | Średni | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż bez wydatków, otwarta zakładka „Wydatki inne”.

**Dane testowe:** „Ubezpieczenie podróżne” – kategoria Ubezpieczenie, data 3 tygodnie **przed**
podróżą, kwota `89,99`; „Magnes na lodówkę” – kategoria Pamiątki, bez daty, kwota `15`.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Kliknij „Dodaj wydatek” | Formularz „Nowy wydatek”: Opis, Kategoria (Bilety wstępu, Pamiątki, Ubezpieczenie, Zakupy, Opłaty i parkingi, Inne), Data (opcjonalnie) – pusta, Kwota (PLN). **Brak pola oceny.** |
| 2 | Kliknij „Dodaj” bez wypełniania | Widoczny komunikat walidacyjny formularza: "Popraw zaznaczone pola". Przy polach widoczne komunikaty walidacyjne: „Podaj, na co był wydatek.”, „Podaj kwotę, np. 45 albo 45,50.” |
| 3 | Dodaj „Ubezpieczenie podróżne” z datą sprzed podróży | Zapisano pomyślnie (data wydatku może być poza terminem podróży). Widoczna dodana pozycja: „Ubezpieczenie · <data>”, „89,99 zł”, bez gwiazdek. |
| 4 | Dodaj „Magnes na lodówkę” bez daty | Widoczna dodana pozycja: „Pamiątki · bez daty”, „15,00 zł”. |
| 5 | Zweryfikuj sumę | „Razem: 104,99 zł”. |
| 6 | Kliknij zakładkę „Kosztorys” | W wierszu „Wydatki inne” liczba pozycji 2, średnia ocena „bez ocen”, suma 104,99 zł. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …
