# 08. Rekomendacje z własnych danych (wymaganie 2.8)

Zakres: przy podróży do miasta, w którym użytkownik już był, zakładka „Kosztorys” pokazuje sekcję
„Polecane z wcześniejszych podróży”: najlepiej ocenione restauracje (z posiłków) oraz noclegi
i atrakcje, a także niezaliczone punkty z list „Chcę odwiedzić” z tamtych podróży.

Reguły: liczą się wcześniejsze podróże do tego samego miasta (bez względu na wielkość liter)
w statusie „w trakcie”, „zrealizowana” lub „archiwum” – **nie** „w planie”. Polecane są miejsca
ze średnią oceną co najmniej 4 (oceny tego samego miejsca z kilku podróży są uśredniane), najwyżej
5 w grupie. Punkt „Chcę odwiedzić” znika z przypomnień, gdy został zaliczony w którejkolwiek
wcześniejszej podróży albo jest już na liście bieżącej podróży.

| ID | Tytuł | Priorytet | Automat |
|---|---|---|---|
| TC-33 | Pierwsza podróż do miasta nie ma rekomendacji | Średni | ✅ Tak |
| TC-34 | Kolejna podróż do miasta poleca najlepiej ocenione miejsca z wcześniejszych podróży | Wysoki | ✅ Tak (dane przez API) |
| TC-35 | Kolejna podróż przypomina niezaliczone punkty z listy „Chcę odwiedzić” | Wysoki | ✅ Tak (dane przez API) |

---

### TC-33 Pierwsza podróż do miasta nie ma rekomendacji

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.8 | Średni | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany. Konto nie ma żadnej podróży do Zamościa (jeśli ma –
użyj innego miasta, do którego konto nie ma podróży).

**Dane testowe:** podróż „Zamość plan” do Zamościa (status „w planie”) z posiłkiem w „Restauracja
z planu”, ocena 5; druga podróż „Zamość znowu” do Zamościa.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Utwórz podróż „Zamość plan” do Zamościa, dodaj posiłek w „Restauracja z planu” z oceną 5 / 5 | Posiłek zapisany, podróż ma status „W PLANIE”. |
| 2 | Otwórz zakładkę „Kosztorys” tej podróży | W sekcji „Polecane z wcześniejszych podróży” widoczny komunikat: „To pierwsza podróż do miasta Zamość. Gdy wrócisz tu kolejny raz, pokażemy najlepiej ocenione restauracje i miejsca z tej podróży.” |
| 3 | Utwórz drugą podróż „Zamość znowu” do Zamościa, otwórz zakładkę „Kosztorys” tej podróży | Widoczny ten sam komunikat „To pierwsza podróż do miasta Zamość…” – podróż „w planie” nie liczy się jako wcześniejsza. |
| 4 | Wróć do podróży „Zamość plan”, kliknij „Rozpocznij podróż”, otwórz „Kosztorys” podróży „Zamość znowu” | W sekcji Polecane z wcześniejszych podróży widoczny komunikat: „Wcześniejsze podróże do miasta Zamość: Zamość plan (…)” a w sekcji „Restauracje” widoczne: „Restauracja z planu ★ 5 / 5 (1 ocena)”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-34 Kolejna podróż do miasta poleca najlepiej ocenione miejsca z wcześniejszych podróży

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.8 | Wysoki | ✅ Tak (wcześniejsze podróże przygotowane przez API) |

**Warunki wstępne:** użytkownik zalogowany. Konto ma dokładnie dwie wcześniejsze podróże do
Krakowa (innych podróży do Krakowa nie ma):
* „Kosztorys test” (archiwum): posiłek w „Budka” – ocena 5; atrakcja „Wawel” – ocena 4; posiłek w „Kazimierz” – bez oceny,
* „Kraków jesień” (zrealizowana): posiłek w „Budka” – ocena 3; posiłek w „Pod Aniołami” – ocena 5; nocleg „Hotel Słaby” – ocena 2.

**Dane testowe:** nowa podróż „Kraków znowu”, miasto wpisane małymi literami: `kraków`.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Utwórz podróż „Kraków znowu” z miastem `kraków`, otwórz zakładkę „Kosztorys” | Sekcja „Polecane z wcześniejszych podróży”: „Wcześniejsze podróże do miasta kraków: Kraków jesień (<daty>), Kosztorys test (<daty>)” – wielkość liter w nazwie miasta nie ma znaczenia. |
| 2 | Zweryfikuj skecje „Restauracje” | Kolejność: „Pod Aniołami ★ 5 / 5 (1 ocena)”, potem „Budka ★ 4 / 5 (2 oceny)” – oceny „Budki” z dwóch podróży (5 i 3) uśrednione do 4. „Kazimierz” (bez oceny) się nie pokazuje. |
| 3 | Zweryfikuj sekcje „Noclegi i atrakcje” | Tylko „Wawel ★ 4 / 5 (1 ocena)”. „Hotel Słaby” (ocena 2, poniżej 4) się nie pokazuje. |
| 4 | Kliknij link „Kraków jesień” | Widoczne są szczegóły wcześniejszej podróży. |
| 5 | Wróć do podróży „Kraków znowu”, otwórz zakładkę „Kosztorys” | Rekomendacje wyglądają tak samo jak w krokach 1–3. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-35 Kolejna podróż przypomina niezaliczone punkty z listy „Chcę odwiedzić”

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.8 | Wysoki | ✅ Tak (wcześniejsza podróż przygotowana przez API) |

**Warunki wstępne:** użytkownik zalogowany. Konto ma wcześniejszą podróż do Krakowa „Kraków jesień”
(zrealizowana) z listą „Chcę odwiedzić”: „Kopiec Kościuszki” – niezaliczony, „Sukiennice” –
zaliczony. Konto ma też nową podróż „Kraków znowu” do Krakowa z pustą listą „Chcę odwiedzić”.

**Dane testowe:** wpis na liście nowej podróży: `kopiec kościuszki` (małymi literami).

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Otwórz podróż „Kraków znowu”, zakładka „Kosztorys” | W rekomendacjach widoczna sekcja „Nie udało się wtedy zobaczyć” z jedną pozycją: „Kopiec Kościuszki”. „Sukiennice” (zaliczone) się nie pokazują. |
| 2 | Kliknij zakładkę „Chcę odwiedzić”, dodaj miejsce `kopiec kościuszki` | Miejsce pojawia się na liście bieżącej podróży. |
| 3 | Wróć do zakładki „Kosztorys” | Sekcja „Nie udało się wtedy zobaczyć” nie jest już widoczna – punkt jest na liście bieżącej podróży (wielkość liter nie ma znaczenia). |
| 4 | Usuń `kopiec kościuszki` z listy „Chcę odwiedzić”, wróć do zakładki „Kosztorys” | Ponownie w skecji „Nie udało się wtedy zobaczyć” widoczna jesr pozycja „Kopiec Kościuszki”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …
