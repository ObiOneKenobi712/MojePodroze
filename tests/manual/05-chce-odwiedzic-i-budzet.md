# 05. Lista „Chcę odwiedzić” i planowany budżet (wymaganie 2.5)

Zakres: lista miejsc do odwiedzenia z odhaczaniem jako zaliczone (zakładka „Chcę odwiedzić” w
szczegółach podróży) oraz planowany budżet podróży (ustawiany w formularzu podróży, opcjonalny).
Porównanie wydatków z budżetem i progi ostrzeżeń: plik 07.

| ID | Tytuł | Priorytet | Automat |
|---|---|---|---|
| TC-23 | Użytkownik tworzy listę „Chcę odwiedzić” i odhacza zaliczone miejsca | Wysoki | ✅ Tak |
| TC-24 | Użytkownik ustawia, zmienia i usuwa planowany budżet podróży | Wysoki | ✅ Tak |

---

### TC-23 Użytkownik tworzy listę „Chcę odwiedzić” i odhacza zaliczone miejsca

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.5 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż (status „w planie”) z pustą listą
„Chcę odwiedzić”, otwarta zakładka „Chcę odwiedzić”.

**Dane testowe:** „Bazylika Mariacka” z notatką „Wejść na wieżę”; „Fontanna Neptuna” i „Żuraw” bez notatki.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zweryfikuj zakładkę | Widoczne są pola „Miejsce” i „Notatka (opcjonalnie)”, przycisk „Dodaj”. Komunikat: „Lista jest pusta. Dopisz miejsca, które chcesz zobaczyć – odhaczysz je na miejscu.” |
| 2 | Nie wpisując nic, kliknij „Dodaj” | Widoczny komunikat walidacyjny: „Podaj nazwę.” Żadna pozycja nie zostaje dodana. |
| 3 | Dodaj pozycję „Bazylika Mariacka” z notatką „Wejść na wieżę” | Miejsce pojawia się na liście z notatką pod nazwą. Pola formularza się czyszczą. |
| 4 | Dodaj pozycję „Fontanna Neptuna” i „Żuraw” (bez notatek) | Na liście są 3 miejsca, każde z polem wyboru i przyciskami „Edytuj”, „Usuń”. Nad listą: „Zaliczone: 0 z 3”. |
| 5 | Zaznacz pole wyboru przy „Bazylika Mariacka” | „Zaliczone: 1 z 3”. |
| 6 | Odśwież stronę (F5) | Pole przy „Bazylika Mariacka” nadal zaznaczone, Widoczny licznik: „Zaliczone: 1 z 3” – stan zapisał się w bazie. |
| 7 | Odznacz pole przy „Bazylika Mariacka” | Widoczny licznik: „Zaliczone: 0 z 3”. |
| 8 | Przy pozycji „Fontanna Neptuna” kliknij „Edytuj”, zmień nazwę na „Fontanna Neptuna na Długim Targu”, zapisz | Na liście widoczna jest nowa nazwa pozycji. |
| 9 | Przy pozycji „Żuraw” kliknij „Usuń” | Widoczne okno modalne „Usunąć miejsce?” z treścią „„Żuraw” zniknie z listy.” |
| 10 | Kliknij „Usuń miejsce” | Pozycja „Żuraw” nie jest widoczna na liście, widoczny licznik: „Zaliczone: 0 z 2”. |
| 11 | Zaznacz oba pozostałe miejsca | Widoczny licznik: „Zaliczone: 2 z 2”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-24 Użytkownik ustawia, zmienia i usuwa planowany budżet podróży

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.5 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, konto ma podróż z budżetem 5000 zł i pozycjami
kosztowymi na łączną kwotę mniejszą niż 4000 zł, otwarte szczegóły podróży.

**Dane testowe:** budżety: puste pole, `4000.5` (z kropką), `0`.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zweryfikuj zakładkę „Przegląd” | Widoczna pozycja „Budżet: 5000,00 zł”. |
| 2 | Kliknij „Edytuj”, wyczyść pole „Budżet (PLN, opcjonalnie)”, kliknij „Zapisz zmiany” | Zapisano pomyślnie (budżet jest opcjonalny). W „Przeglądzie” widoczne pole: „Budżet: nie ustalono”. |
| 3 | Kliknij zakładkę „Kosztorys” | W bloku „Budżet” widoczny komunikat „Nie ustalono budżetu. Ustaw go w edycji podróży.” (link). |
| 4 | Kliknij link „Ustaw go w edycji podróży” | Otwiera się formularz „Edytuj podróż” (`/podroze/<id>/edycja`). |
| 5 | Wpisz budżet `0`, kliknij „Zapisz zmiany” | Przy budżecie widoczny komunikat walidacyjny: „Podaj kwotę większą od zera, np. 2500 albo 2500,50.” |
| 6 | Wpisz budżet `4000.5`, kliknij „Zapisz zmiany” | Powrót do szczegółów podroży. W zakładce „Przegląd”: „Budżet: 4000,50 zł” (kropka zamieniona na przecinek, 2 miejsca po przecinku). |
| 7 | Kliknij zakładkę „Kosztorys” | W bloku „Budżet” widoczne: „Wydano <suma> z 4000,50 zł (<procent>%)” i „W budżecie – zostało <4000,50 − suma>.” |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …
