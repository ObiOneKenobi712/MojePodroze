# 06. Pamiętnik i album (wymaganie 2.6)

Zakres: wpisy pamiętnika z datą i treścią (zakładka „Pamiętnik”), upload zdjęć z przypisaniem do
dnia (sekcja „Zdjęcia” w edycji podróży), album układany automatycznie według dat (zakładka
„Przegląd”), okładka podróży.

Pliki testowe (przygotuj przed testem): dwa małe obrazki – jeden PNG, jeden JPG – oraz plik
tekstowy `.txt`.

| ID | Tytuł | Priorytet | Automat |
|---|---|---|---|
| TC-25 | Użytkownik prowadzi pamiętnik – wpisy grupują się według dni | Wysoki | ✅ Tak |
| TC-26 | Użytkownik wgrywa zdjęcia do wybranego dnia, a plik, który nie jest zdjęciem, jest pomijany | Wysoki | ❌ Nie |
| TC-27 | Album układa zdjęcia według dni, a podgląd pokazuje je po kolei | Wysoki | ❌ Nie |
| TC-28 | Użytkownik wybiera okładkę podróży i usuwa zdjęcie | Średni | ❌ Nie |

---

### TC-25 Użytkownik prowadzi pamiętnik – wpisy grupują się według dni

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.6 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż (5 dni, status „w planie” lub „w trakcie”)
z pustym pamiętnikiem, otwarta zakładka „Pamiętnik”.

**Dane testowe:** wpis 1 – dzień 2, tytuł „Spacer po Starówce”, treść w dwóch akapitach
„Rano Długi Targ.” / „Po południu Westerplatte.”; wpis 2 – dzień 1, bez tytułu, treść
„Przyjazd pociągiem, wieczorem molo.”

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zweryfikuj zakładkę | Widoczny komunikat: „Pamiętnik jest pusty. Zapisz pierwsze wrażenia z podróży.” i przycisk „Dodaj wpis”. |
| 2 | Kliknij „Dodaj wpis” | Widoczny formularz „Nowy wpis”: Dzień (domyślnie dzień 1; kalendarz tylko w terminie podróży), Tytuł (opcjonalnie), Treść. |
| 3 | Kliknij „Dodaj” bez wpisania treści | Widoczny komunikat walidacyjny formularza: „Popraw zaznaczone pola.”, przy polu treść widoczny komunikat wlidacyjny: „Napisz treść wpisu.” |
| 4 | Dodaj wpis 1 z danych testowych | Wpis pojawia się w grupie: „Dzień 2 · <dzień tygodnia>, <data>” z tytułem i treścią dodanymi w poprzednim korku, w dwóch akapitach. |
| 5 | Dodaj wpis 2 z danych testowych (bez tytułu) | Wpis pojawia się na liście w grupie „Dzień 1 · …” jest widoczny **nad** grupą „Dzień 2” – wpisy ułożone według dni, nie według kolejności dodania. Wpis bez tytułu pokazuje samą treść. |
| 6 | Przy wpisie z dnia 1 kliknij „Edytuj”, dopisz tytuł „Przyjazd”, kliknij „Zapisz zmiany” | Wpis ma tytuł „Przyjazd”. |
| 7 | Przy wpisie „Spacer po Starówce” kliknij „Usuń” | widoczne okno modalne „Usunąć wpis?” z treścią „Wpis „Spacer po Starówce” (<data>) zniknie z listy.” |
| 8 | Kliknij „Usuń wpis” | Wpis i grupa „Dzień 2” zostają usunięte, na liście zostaje wpis z dnia 1. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-26 Użytkownik wgrywa zdjęcia do wybranego dnia, a plik, który nie jest zdjęciem, jest pomijany

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.6 | Wysoki | ❌ Nie |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż (5 dni) bez zdjęć.

**Dane testowe:** plik `.txt`, obrazek PNG, obrazek JPG.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Otwórz szczegóły podróży, w zakładce „Przegląd” w sekcji ZDJĘCIA kliknij link „Dodaj je w edycji podróży” | Otwiera się formularz „Edytuj podróż”. Pod formularzem w sekcji „Zdjęcia” widoczny komunikat: „Ta podróż nie ma jeszcze zdjęć.”, pole „Dodaj zdjęcia” z podpowiedzią „Możesz wybrać kilka plików naraz (najwyżej 20). JPG, PNG, GIF albo WEBP, każdy do 10 MB.” |
| 2 | W polu „Dodaj zdjęcia” wybierz plik `.txt` | Widoczny komunikat „Pominięto:” i „<nazwa>.txt: nieobsługiwany format (tylko JPG, PNG, GIF, WEBP)”. Plik nie trafia na listę do wysłania. |
| 3 | Wybierz naraz pliki PNG i JPG | Po wybraniu, w sekcji "Dodaj zdjęcia" pojawiają się podglądy obu plików z nazwami i przyciskiem usunięcia z listy. Pole „Dzień zdjęć” ma domyślnie dzień 1. Widoczne przyciski „Wgraj 2 zdjęcia” i „Wyczyść listę”. |
| 4 | Ustaw „Dzień zdjęć” na dzień 2, kliknij „Wgraj 2 zdjęcia” | Widoczny komunikat powodzenia „Dodano 2 zdjęcia.” Podglądy są widoczne w sekcji "Zdjęcia". Na liście zdjęć podróży widoczne są 2 zdjęcia z datą dnia 2; pierwsze ma oznaczenie „Okładka”. |
| 5 | Kliknij „Wróć do podróży” | W zakładce „Przegląd”, w sekcji „Zdjęcia”: grupa „Dzień 2 · <data>” widoczne są miniatury zdjęć. |
| 6 | Wróć na „← Moje podróże” | Karta podróży pokazuje zdjęcie okładki (pierwsze wgrane zdjęcie) zamiast samego kolorowego tła. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-27 Album układa zdjęcia według dni, a podgląd pokazuje je po kolei

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.6 | Wysoki | ❌ Nie |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż (5 dni) z dwoma zdjęciami przypisanymi
do dnia 2 (np. po TC-26), otwarty formularz edycji podróży.

**Dane testowe:** nowy dzień drugiego zdjęcia – dzień 4; dzień błędny – tydzień po końcu podróży;
podpis „Zachód słońca nad Motławą”.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Przy drugim zdjęciu kliknij ikonę ołówka („Zmień dzień i podpis”) | Widoczne okno „Dzień i podpis zdjęcia” z polami „Dzień” i „Podpis (opcjonalnie)”. |
| 2 | Wpisz dzień tydzień po końcu podróży, kliknij „Zapisz” | Widoczny komunikat: „Wybierz dzień w terminie podróży: <data od> – <data do>.” Okno zostaje otwarte. |
| 3 | Ustaw dzień 4, wpisz podpis „Zachód słońca nad Motławą”, kliknij „Zapisz” | Okno zamyka się, przy zdjęciu widoczna jest data dnia 4. |
| 4 | Kliknij „Wróć do podróży” i zweryfikuj sekcję "Zdjęcia" w zakładce „Przegląd” | Widoczne są dwie grupy zdjęć, w kolejności dat: „Dzień 2 · <data>” (1 zdjęcie) i „Dzień 4 · <data>” (1 zdjęcie z podpisem „Zachód słońca nad Motławą”). |
| 5 | Kliknij miniaturę w grupie „Dzień 2” | Otwiera się podgląd zdjęcia, licznik „1 / 2”. |
| 6 | Naciśnij strzałkę w prawo (→) albo kliknij „Następne zdjęcie” | Podgląd pokazuje zdjęcie z dnia 4, licznik „2 / 2”, podpis „Zachód słońca nad Motławą”. |
| 7 | Naciśnij Esc | Podgląd  zamyk asię. Widoczne są szczegóły podróży. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-28 Użytkownik wybiera okładkę podróży i usuwa zdjęcie

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.6 | Średni | ❌ Nie |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż z dwoma zdjęciami, otwarta „Edytuj podróż”.

**Dane testowe:** –

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zweryfikuj listę zdjęć | Pierwsze zdjęcie ma oznaczenie „Okładka”, drugie – przycisk „Ustaw jako okładkę”. |
| 2 | Przy drugim zdjęciu kliknij „Ustaw jako okładkę” | Oznaczenie „Okładka” widoczne jest przy drugim zdjęciu, przy pierwszym pojawia się przycisk „Ustaw jako okładkę”. |
| 3 | Przy pierwszym zdjęciu kliknij przycisk usuwania | Widoczne okno modalne „Usunąć zdjęcie?” z treścią „Zdjęcie 1 zostanie usunięte z podróży. Tego nie da się cofnąć.” |
| 4 | Kliknij „Usuń zdjęcie” | Na liście zostaje jedno zdjęcie z oznaczeniem „Okładka”. |
| 5 | Wróć do szczegółów podróży | W albumie widoczne jest tylko jedno zdjęcie (Okładka). |
| 6 | Wróć na „← Moje podróże” | Karta podróży pokazuje wybraną okładkę. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …
