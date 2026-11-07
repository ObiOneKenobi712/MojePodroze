# 02. Ekran główny „Moje podróże” (wymaganie 2.2)

Zakres: lista podróży w czterech grupach, widżet pogody z wyborem miasta, widżet kursów NBP,
zachowanie widżetów przy awarii zewnętrznego API. Adres: http://localhost:5173/podroze.

| ID | Tytuł | Priorytet | Automat |
|---|---|---|---|
| TC-05 | Podróże wyświetlają się w grupach według statusu | Wysoki | ✅ Tak |
| TC-06 | Użytkownik zmienia miasto w widżecie pogody, a wybór zostaje zapamiętany | Wysoki | ✅ Tak |
| TC-07 | Widżet kursów NBP pokazuje kursy i przelicza kwotę na PLN | Wysoki | ✅ Tak |
| TC-08 | Awaria API pogody i kursów nie blokuje pozostałych funkcji aplikacji | Wysoki | ✅ Tak |

---

### TC-05 Podróże wyświetlają się w grupach według statusu

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.2 | Wysoki | ✅ Tak (dane przygotowane przez API) |

**Warunki wstępne:** użytkownik zalogowany. Konto ma (co najmniej) trzy podróże:
„Podróż planowana” (status „w planie”), „Podróż w trakcie” (status „w trakcie”), „Podróż
zrealizowana” (status „zrealizowana”).

**Dane testowe:** jak w warunkach wstępnych.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Otwórz http://localhost:5173/podroze | Zakładki z liczbą podróży: „Wszystkie”, „W planie”, „W trakcie”, „Zrealizowane”, „Archiwum”. Aktywna zakładka „Wszystkie”. Licznik w zakładce „Wszystkie” = suma liczb z czterech pozostałych zakładek. Zanotuj liczby. |
| 2 | Zweryfikuj sortowanie podróży na liście w zakładce „Wszystkie” | Karty są ułożone grupami: najpierw podróże „W PLANIE”, potem „W TRAKCIE”, „ZREALIZOWANA”, „ARCHIWUM”. Każda karta zawiera: status, daty podróży od-do:, typ i charakter podróży. Są wśród nich trzy podróże z warunków wstępnych. |
| 3 | Zweryfikuj widżet „Najbliższa podróż” | Widoczny jest licznik dni do najwcześniejszej podróży w planie, np. „Za 35 dni: <miasto>”. Licznik wskazuje prawidłową liczbę dni od daty bieżącej - do planowanej daty rozpoczęcia podróży|
| 4 | Kliknij zakładkę „W planie” | Na liście widoczne są tylko karty „W PLANIE”, w tym „Podróż planowana” z warunków wstępnych. Liczba kart zgodna z licznikiem zakładki. |
| 5 | Kliknij zakładkę „W trakcie” | Na liście widoczne są tylko karty „W TRAKCIE”, w tym „Podróż w trakcie” z warunków wstępnych. Liczba kart zgodna z licznikiem zakładki. |
| 6 | Kliknij zakładkę „Zrealizowane” | Na liście widoczne są tylko karty „ZREALIZOWANA”, w tym „Podróż zrealizowana” z warunków wstępnych. Liczba kart zgodna z licznikiem zakładki.|
| 7 | Kliknij kartę „Podróż zrealizowana”, w szczegółach kliknij „Przenieś do archiwum”, potem przejdź ponownie do listy podróży przez kliknięcie „<-Moje podróże” | W porównaniu z krokiem 1: W zakładce „Zrealizowane” licznik pomniejszony się o 1, licznik zakładki „Archiwum” zwiększony o 1, liczniki zakładek „Wszystkie”, "W planie" i "W trakcie" bez zmian. |
| 8 | Kliknij zakładkę „Archiwum” | Na liście widoczna jest „Podróż zrealizowana” ze statusem „ARCHIWUM”. |
| 9 | Kliknij zakładkę „W planie”, potem kartę „Podróż planowana” | Otwierają się szczegóły tej podróży (adres `/podroze/<id>`), tytuł „Podróż planowana”. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-06 Użytkownik zmienia miasto w widżecie pogody, a wybór zostaje zapamiętany

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.2 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, ekran `/podroze`, dostęp do Internetu. Widżet pogody pokazuje
domyślne miasto „Warszawa, Polska”.

**Dane testowe:** wpisy do wyszukiwarki: `K` (1 litera), `Qwxzyv` (nieistniejące miasto), `Kraków`.

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zweryfikuj widżet „Pogoda” | Miasto: „Warszawa, Polska”. Widać temperaturę w °C, opis (np. „pochmurno”) i wiersz „Odczuwalna … °C · wiatr … km/h”. |
| 2 | W polu „Zmień miasto” wpisz `K` i kliknij „Szukaj” | Komunikat: „Wpisz co najmniej 2 litery nazwy miasta.” Pogoda dla Warszawy pozostaje nadal widoczna. |
| 3 | Wpisz `Qwxzyv` i kliknij „Szukaj” | Komunikat: „Nie znaleziono miasta „Qwxzyv”.” |
| 4 | Wpisz `Kraków` i kliknij „Szukaj” | Pod polem pojawia się lista do 5 miast, pierwsze: „Kraków, Województwo małopolskie, Polska”. Komunikat błędu znika. |
| 5 | Kliknij „Kraków, Województwo małopolskie, Polska” | Lista znika, pole wyszukiwania się czyści. Widżet pokazuje „Kraków, Polska” i pogodę dla Krakowa. |
| 6 | Odśwież stronę (F5) | Widżet nadal pokazuje „Kraków, Polska”. |
| 7 | Kliknij „Wyloguj”, zaloguj się ponownie na to samo konto | Widżet pokazuje „Kraków, Polska” – wybór zapisał się w ustawieniach użytkownika. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-07 Widżet kursów NBP pokazuje kursy i przelicza kwotę na PLN

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.2 | Wysoki | ✅ Tak |

**Warunki wstępne:** użytkownik zalogowany, ekran `/podroze`, dostęp do Internetu.

**Dane testowe:** kwoty: `100`, `12,50`, `-5`, `abc`, `1,234`. Aktualne kursy sprawdź na
https://nbp.pl (tabela A, kurs średni).

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zweryfikuj widżet „Kursy NBP” | Widać trzy przyciski z kursami: EUR, USD, GBP (np. „EUR 4,3916”). Pod nimi „Kurs średni z <data>”. Kursy i data zgadzają się z tabelą A na stronie NBP. |
| 2 | Zweryfikuj kalkulator | Zaznaczona waluta EUR, etykieta „Kwota w EUR”, w polu `100`, wynik „= <100 × kurs EUR> zł”, np. „= 439,16 zł”. |
| 3 | Kliknij przycisk „USD” | USD jest zaznaczony, etykieta zmienia się na „Kwota w USD”, wynik przelicza się po kursie USD. |
| 4 | Wpisz kwotę `12,50` | Po chwili wynik = 12,50 × kurs USD, zaokrąglony do groszy (np. 12,50 × 3,9101 = „48,88 zł”). |
| 5 | Kliknij „GBP” | Wynik przelicza tę samą kwotę po kursie GBP. |
| 6 | Wpisz kwotę `-5` | Wynik „= –”, pod polem komunikat: „Podaj kwotę, np. 100 albo 12,50.” |
| 7 | Wpisz kwotę `abc`, potem `1,234` (3 miejsca po przecinku) | Za każdym razem ten sam komunikat i wynik „= –”. |
| 8 | Wpisz kwotę `100` | Komunikat znika, wynik znowu pokazuje kwotę w zł. |
| 9 | Przejdź do zakładek "W planie", "W trakcie", "Zrealizowane", "Archiwum" | Widżet kursów NBP jest cały czas widoczny, niezależnie od wybranej zakładki. Pokazuje te same wartości co w kroku 1. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

---

### TC-08 Awaria API pogody i kursów nie blokuje pozostałych funkcji aplikacji

| Wymaganie | Priorytet | Automat |
|---|---|---|
| 2.2 | Wysoki | ✅ Tak (obowiązkowy E2E; awaria symulowana przez Playwright `route` – odpowiedź 503) |

**Warunki wstępne:** użytkownik zalogowany, konto ma co najmniej jedną podróż. Manualnie awarię
symuluje się w narzędziach deweloperskich Chrome (F12 → Network → prawy przycisk na zapytaniu
`weather/current` i `exchange-rates` → „Block request URL”).

**Dane testowe:** –

| # | Krok | Oczekiwany wynik |
|---|---|---|
| 1 | Zablokuj zapytania `/api/weather/current` i `/api/exchange-rates`, odśwież stronę `/podroze` | Widżet „Pogoda” pokazuje komunikat o błędzie i przycisk „Spróbuj ponownie”. Przy odpowiedzi 503 z backendu treść to: „Serwis pogody jest chwilowo niedostępny.” |
| 2 | Zweryfikuj widżet „Kursy NBP” | Komunikat o błędzie (przy 503: „Serwis kursów walut NBP jest chwilowo niedostępny.”) i przycisk „Spróbuj ponownie”. |
| 3 | Zweryfikuj listę podróży | Lista i zakładki działają parwidłowo, liczniki są poprawne, widżet „Najbliższa podróż” wskazuje najbliższą podróż z prawidłowym licznikiem dni do danej podróży. |
| 4 | Kliknij zakładkę „W planie”, następnie „Wszystkie” | Możliwa jest nawigacja między zakładkami, karty podróży są widoczne w zakładkach, zgodnie z przypisanym statusem. |
| 5 | Kliknij „Nowa podróż”, następnie „← Moje podróże” | Formularz nowej podróży otwiera się; po powrocie ekran główny z listą wszystkich podróży jest widoczny. |
| 6 | Odblokuj zapytanie pogody, w widżecie „Pogoda” kliknij „Spróbuj ponownie” | Widżet pokazuje miasto i aktualną pogodę, komunikat błędu znika. |
| 7 | Odblokuj zapytanie kursów, w widżecie „Kursy NBP” kliknij „Spróbuj ponownie” | Widżet pokazuje kursy EUR, USD, GBP i datę kursu. |

**Wykonanie:** Data: … · Tester: … · Wynik: … · Uwagi: …

