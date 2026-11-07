# 07. Kosztorys i oceny (wymaganie 2.7)

Zakres: suma kosztów całkowita i według sekcji, średnio na dzień, porównanie z budżetem (progi:
poniżej 90% – w budżecie, 90–100% – ostrzeżenie, powyżej 100% – przekroczony), ocena zbiorcza
jako zwykła średnia ocen pozycji i średnie sekcji, widok archiwalny tylko do odczytu.
Na końcu: obowiązkowy przypadek testowy E2E „pełne życie podróży”.

| ID | Tytuł | Priorytet | Automat |
|---|---|---|---|
| TC-29 | Kosztorys sumuje koszty według sekcji i liczy średnie ocen | Wysoki | ✅ Tak |
| TC-30 | Status budżetu zmienia się w progach 90% i 100% | Wysoki | ✅ Tak |
| TC-31 | Kosztorys podróży w archiwum jest tylko do odczytu | Wysoki | ✅ Tak |
| TC-32 | Pełne życie podróży – od rejestracji do kosztorysu w archiwum | Wysoki | ✅ Tak (obowiązkowy E2E) |

---

### TC-29 Kosztorys sumuje koszty według sekcji i liczy średnie ocen

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.7 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż krajową (4 dni, budżet 1000 zł) bez pozycji.

**Dane testowe:** posiłek „Obwarzanek” – 499 zł, ocena 5; przejazd pociągiem Warszawa → Kraków –
300 zł, ocena 4; wydatek inny „Bilet” – 100 zł; atrakcja „Wawel” – 0 zł, ocena 4; posiłek
„Zapiekanka” – 0 zł, bez oceny.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Otwórz zakładkę „Kosztorys” | Widoczne podsumowanie: „Razem: 0,00 zł”. Ocena zbiorcza „brak ocen”. W tabeli widoczne wiersze: Transport, Posiłki, Noclegi i atrakcje, Wydatki inne – **bez „Loty”** (podróż krajowa), wszystkie z 0 pozycji i sumą = 0,00 zł. Pod tabelą widoczna sekcja „Polecane z wcześniejszych podróży”. |
| 2 | W zakładkach podróży dodaj: posiłek „Obwarzanek”, przejazd i wydatek „Bilet”, następnie wróć do „Kosztorysu” | Widoczne podsumowanie: „Razem: 899,00 zł”. „Średnio na dzień: 224,75 zł (4 dni)”. „Ocena zbiorcza: ★ 4,5 / 5 (2 oceny)”. |
| 3 | Zweryfikuj tabelę sekcji Kosztorys| Transport: 1 pozycja, ★ 4 / 5 (1 ocena), 300,00 zł. Posiłki: 1, ★ 5 / 5 (1 ocena), 499,00 zł. Noclegi i atrakcje: 0, „brak ocen”, 0,00 zł. Wydatki inne: 1, „bez ocen”, 100,00 zł. Wiersz „Razem”: 3 pozycje, 899,00 zł. |
| 4 | Dodaj atrakcję „Wawel” (ocena 4) i posiłek „Zapiekanka” bez oceny, następnie wróć do „Kosztorysu” | „Ocena zbiorcza: ★ 4,3 / 5 (3 oceny)” – średnia (5 + 4 + 4) / 3, pozycja bez oceny nie zostaje wliczona. Posiłki: 2 pozycje, ★ 5 / 5 (1 ocena). Noclegi i atrakcje: 1, ★ 4 / 5. |
| 5 | Usuń przejazd w zakładce „Transport”, wróć do „Kosztorysu” | Widoczne podsumowanie: „Razem: 599,00 zł”. Transport: 0 pozycji, 0,00 zł. Ocena zbiorcza ★ 4,5 / 5 (2 oceny). |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-30 Status budżetu zmienia się w progach 90% i 100%

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.7 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż z budżetem 1000 zł i pozycjami na
łącznie 799 zł (bez wydatku „Bilet”), otwarta zakładka „Kosztorys”.

**Dane testowe:** wydatek inny „Bilet” w kwotach: 100 zł → 101 zł → 201 zł → 201,01 zł
(łącznie: 899 / 900 / 1000 / 1000,01 zł).

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Dodaj wydatek „Bilet” za `100` (łącznie 899 zł – 89,9%), otwórz „Kosztorys” | Widoczne podsumowanie: „Wydano 899,00 zł z 1000,00 zł (89,9%)”, „W budżecie – zostało 101,00 zł.” Blok budżetu w kolorze zielonym. |
| 2 | Zmień kwotę „Bilet” na `101` (łącznie 900 zł – 90%), otwórz „Kosztorys” | Widoczne podsumowanie: „Wydano 900,00 zł z 1000,00 zł (90%)”, „Uwaga: wykorzystano 90% budżetu – zostało 100,00 zł.” Blok w kolorze ostrzeżenia. |
| 3 | Zmień kwotę na `201` (łącznie 1000 zł – 100%) | Widoczne podsumowanie: „Uwaga: wykorzystano 100% budżetu – zostało 0,00 zł.” Nadal ostrzeżenie (100% to jeszcze nie przekroczenie). |
| 4 | Zmień kwotę na `201,01` (łącznie 1000,01 zł) | Widoczne podsumowanie: „Wydano 1000,01 zł z 1000,00 zł”, „Budżet przekroczony o 0,01 zł.” Blok w kolorze czerwonym. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-31 Kosztorys podróży w archiwum jest tylko do odczytu

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.7 | Wysoki | ✅ Tak (krok 5 jako zapytanie API w teście) |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż w statusie „zrealizowana” z pozycjami
kosztowymi i budżetem, otwarta zakładka „Kosztorys”. Zapisz wartości „Razem”, „Ocena zbiorcza” i stan budżetu.

**Dane testowe:** –

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Kliknij „Przenieś do archiwum” | Status podróży „ARCHIWUM”, widoczny komunikat „Podróż jest w archiwum – można ją tylko przeglądać. Aby coś zmienić, cofnij status.” |
| 2 | Zweryfikuj zakładkę „Kosztorys” | Podsumowanie: „Razem”, „Średnio na dzień”, „Ocena zbiorcza”, budżet i tabela sekcji są widoczne i mają te same wartości co przed archiwizacją. |
| 3 | Kliknij zakładkę „Przegląd” | Album jest widoczny. Przy podróży bez zdjęć: „Ta podróż nie ma jeszcze zdjęć.” – **bez** linku „Dodaj je w edycji podróży”. |
| 4 | Przejdź po pozostałych zakładkach sekcji kosztowych (Transport, Posiłki, Noclegi i atrakcje, Wydatki inne) | Pozycje widoczne, brak przycisków: „Dodaj …”, „Edytuj”, „Kopiuj”, „Usuń”. Podróż jest w archiwum i jest tylko do odczytu. |
| 5 | Kliknij "cofnij" | Status podróży "ZREALIZOWANA"
| 6 | Zweryfikuj zakładki kosztowe (Transport, Posiłki, Noclegi i atrakcje, Wydatki inne) | Przyciski dodawania pozycji w zakładkach kosztowych są widoczne i okatywne, tak jak przyciski Edycji, Usuwania i Kopiowania pozycji w zakłądkach kosztowych

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-32 Pełne życie podróży – od utworzenia do kosztorysu w archiwum

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.3, 2.4, 2.6, 2.7 | Wysoki | ✅ Tak (obowiązkowy E2E – wszystko przez GUI) |

**Warunki wstępne:** użytkownik zalogowany, ekran `/podroze`. Konto nie ma podróży o nazwie „Lizbona 2027”.

**Dane testowe:** podróż „Lizbona 2027” – Lizbona, Portugalia, zagraniczna,
charakter „Miasto”, 5 dni, budżet `4000`; lot TP 1245 WAW → LIS, dzień 1 08:00, 850 zł, ocena 4;
przejazd taksówką Lotnisko → Hotel, dzień 1, 60 zł, ocena 3; posiłek „Bacalhau” w „Taberna
Alfama”, dzień 2, 95 zł, ocena 5; jeden obrazek PNG.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Kliknij „Nowa podróż”, wypełnij dane podróży, kliknij „Zapisz podróż” | Karta „Lizbona 2027” w grupie „W planie”, „Zagraniczna”, „Miasto”. |
| 2 | Otwórz podróż, zakładka „Loty”, dodaj lot | Widoczna pozycja dodanego lotu „WAW → LIS” na liście, Podsumowanie: „Razem: 850,00 zł”. |
| 3 | Zakładka „Transport”, dodaj przejazd taksówką | Widoczna pozycja dodanego przejazdu „Lotnisko → Hotel”, „Taksówka”, Podsumowanie: „Razem: 60,00 zł”. |
| 4 | Zakładka „Posiłki”, dodaj posiłek | Widoczna pozycja dodanego posiłku: „Bacalhau”, „Taberna Alfama”, 5 gwiazdek, Podsumownaie: Razem: 95,00 zł”. |
| 5 | Kliknij „Edytuj”, w sekcji „Zdjęcia” wybierz obrazek PNG, kliknij „Wgraj 1 zdjęcie”, potem „Wróć do podróży” | „Dodano 1 zdjęcie.” W „Przeglądzie” widoczny album z grupą „Dzień 1 · …” i miniaturą dodanego zdjęcia. |
| 6 | Kliknij „Rozpocznij podróż” | Status „W TRAKCIE”. |
| 7 | Kliknij „Zakończ podróż” | Status „ZREALIZOWANA”. |
| 8 | Kliknij „Przenieś do archiwum” | Status „ARCHIWUM”, komunikat o trybie tylko do odczytu, brak „Edytuj” i „Usuń podróż”. |
| 9 | Kliknij zakładkę „Kosztorys” | „Razem: 1005,00 zł”, „Średnio na dzień: 201,00 zł (5 dni)”, „Ocena zbiorcza: ★ 4 / 5 (3 oceny)”. Budżet: „Wydano 1005,00 zł z 4000,00 zł”, „W budżecie – zostało 2995,00 zł.” Tabela: Loty 850,00 zł, Transport 60,00 zł, Posiłki 95,00 zł. |
| 10 | Przejdź po zakładkach „Loty”, „Transport”, „Posiłki” | Pozycje widoczne, brak przycisków dodawania, edycji i usuwania. |
| 11 | Wróć na „← Moje podróże”, kliknij zakładkę „Archiwum” | Na liście widoczna jest karta „Lizbona 2027” z napisem „ARCHIWUM” i zdjęciem okładki. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …
