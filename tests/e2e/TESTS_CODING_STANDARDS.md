# Standardy pisania testów E2E

Zasady obowiązujące w testach Playwright w katalogu `tests/e2e`. Przypadki testowe, na których
opierają się testy, są w `tests/manual`.

## Struktura projektu

| Katalog | Zawartość |
|---|---|
| `config/` | zmienne środowiskowe (`env.config.ts`), logowanie przed testami (`global.setup.ts`) |
| `src/pages/` | page objecty: ekrany z własnym adresem, dziedziczą po `BasePage` |
| `src/components/` | części ekranu z własnymi elementami: menu, zakładki, widgety |
| `src/views/` | formularze i panele bez własnego adresu |
| `src/fixtures/` | fixture'y; testy importują `test` i `expect` z `merge.fixture.ts` |
| `src/api/` | klienci API do przygotowania danych testowych |
| `src/enums/` | stałe zestawy wartości, np. etykiety statusów |
| `src/models/` | interfejsy danych |
| `src/factories/` | funkcje tworzące losowe dane testowe |
| `src/test-data/` | stałe dane testowe, np. użytkownik testowy |
| `src/utils/` | narzędzia, np. dekorator `step` |
| `tests/smoke/` | testy smoke |
| `tests/e2e/` | testy przypadków testowych z `tests/manual` |
| `tmp/` | zapisana sesja, plik ignorowany przez gita |

Nazwy plików piszemy w kebab-case z przyrostkiem typu: `my-trips.page.ts`,
`main-menu.component.ts`, `add-flight.view.ts`, `user.model.ts`, `login.spec.ts`.

Plik testu przypadku testowego zaczyna się od jego numeru, a reszta nazwy jest bez polskich znaków:
`TC-05-podroze-w-grupach-wedlug-statusu.spec.ts`.

## Nazwy

Kod i identyfikatory są po angielsku. Tytuły testów, nazwy kroków i opisy asercji są po polsku.

| Element | Zapis | Przykład |
|---|---|---|
| Model | PascalCase z przyrostkiem `Model` | `LoginUserModel` |
| Lokator | camelCase, opisowo | `newTripButton`, `statsTab`, `weatherWidget` |
| Metoda | camelCase, `czasownikRzeczownik` | `clickStatsTab`, `login` |
| Oczekiwana wartość | camelCase z przedrostkiem `expected` | `expectedRatesTitle` |

Tytuł testu zaczyna się wielką literą i opisuje zachowanie. Test przypadku testowego ma na początku
tytułu jego numer:

```typescript
// ✅
test("TC-05 Podróże wyświetlają się w grupach według statusu @logged", ...);
test("Logowanie poprawnymi danymi otwiera stronę Moje podróże @smoke", ...);

// ❌
test("test logowania", ...);
```

## Selektory

Kolejność wyboru:

1. `getByTestId`,
2. `id`, np. `locator("#menu-toggle")`,
3. `getByRole` z nazwą.

Nie używamy selektorów opartych na klasach CSS. Nazwa przycisku nie jest częścią selektora, tylko
ewentualnej asercji, żeby zmiana napisu nie psuła wszystkich testów używających tego elementu.

Nowy `data-testid` dopisujemy do listy w `docs/design/README.md`.

## Page objecty, komponenty i views

| | Page | Component | View |
|---|---|---|---|
| Opisuje | cały ekran z adresem | część ekranu | formularz lub panel |
| Dziedziczy po `BasePage` | tak | nie | nie |
| `url` i `goto()` | tak | nie | nie |

* Komponenty są polami page objectu: `myTripsPage.mainMenu`, `myTripsPage.statusTabs`.
* Page object udostępnia lokatory. Asercje piszemy tylko w testach.
* Metoda, która **przechodzi na inny ekran**, zwraca jego page object.

```typescript
// ✅
async clickStatsTab(): Promise<StatsPage> {
  await this.statsTab.click();
  return new StatsPage(this.page);
}

// ❌
async clickStatsTab(): Promise<void> {
  await this.statsTab.click();
}
```

W teście korzystamy ze zwróconego obiektu, zamiast tworzyć go ręcznie:

```typescript
// ✅
const statsPage = await myTripsPage.mainMenu.clickStatsTab();

// ❌
await myTripsPage.mainMenu.clickStatsTab();
const statsPage = new StatsPage(page);
```

* Szczegóły techniczne aplikacji ukrywamy w page objecie. Przykład: test używa lokatora
  `mainMenu.activeTab`.
* Modyfikatory dostępu dodajemy tylko wtedy, gdy są potrzebne, np. `constructor(private page: Page)`.

## Fixture'y

* Fixture'y tworzymy tylko dla ekranów, od których zaczynają się testy, np. `loginPage`, `myTripsPage`.
* W teście wywoływany jest **jeden** page z fixture'a. Do kolejnych przechodzimy
  przez metody zwracające page objecty.
* Nowy zestaw fixture'ów dopisujemy w `merge.fixture.ts`.

## Kroki w raporcie

**Akcje** opisuje dekorator `@step` przy metodach page objectów. Nazwa jest w trybie rozkazującym:

```typescript
@step("Zaloguj użytkownika")
async login(loginUserData: LoginUserModel): Promise<MyTripsPage> { ... }

@step((tripName: string) => `Otwórz podróż „${tripName}”`)
async gotoTrip(tripName: string): Promise<TripPage> { ... }
```

W nazwie kroku nigdy nie umieszczamy loginu ani hasła.

**Asercje** grupujemy w `test.step` z nazwą zaczynającą się od „Zweryfikuj”. Jeden krok obejmuje
grupę powiązanych asercji, a nie pojedynczy `expect`:

```typescript
await test.step("Zweryfikuj widget kursów NBP", async () => {
  await expect(ratesWidget.title).toHaveText(expectedRatesTitle);
  await expect(ratesWidget.ratesList).toBeVisible();
});
```

Akcji w teście nie wrapujemy w `test.step`. Wyjątkiem są długie przypadki testowe, np. TC-32, gdzie
`test.step` może połączyć kilka metod w jeden etap.

## Asercje

Używamy wyłącznie asercji z automatycznym ponawianiem:

```typescript
// ✅
await expect(newTripButton).toBeVisible();

// ❌
expect(await newTripButton.isVisible()).toBe(true);
```

Nie używamy `waitForTimeout`.

| Co sprawdzamy | Asercja |
|---|---|
| Element jest widoczny | `toBeVisible` |
| Element zniknął | `toBeHidden` |
| Dokładny tekst | `toHaveText` |
| Tekst z częścią zmienną, np. licznikiem | `toContainText` |
| Wartość pola formularza | `toHaveValue` |
| Liczba elementów | `toHaveCount` |
| Adres i tytuł strony | `toHaveURL`, `toHaveTitle` |
| Przycisk aktywny lub zablokowany | `toBeEnabled`, `toBeDisabled` |
| Atrybut | `toHaveAttribute` |

* `expect` przerywa test przy błędzie. `expect.soft` stosujemy przy kilku niezależnych sprawdzeniach.
* **Testy smoke** sprawdzają, czy główne obszary ekranu są na miejscu: `toBeVisible`, a tekst tylko
  tam, gdzie mówi, co to za obszar, np. tytuły widgetów i nazwy zakładek.
* **Testy przypadków testowych** sprawdzają to, co jest celem testu: komunikaty, kwoty, statusy, nazwy
  pozycji. Nie sprawdzamy napisów na przyciskach, które tylko klikamy.
* Gdy celem jest napis przycisku, zakładki lub nagłówka, najpierw `toBeVisible`, potem `toContainText`.

## Oczekiwane wartości

Oczekiwane wartości trzymamy w stałych `expected...` na początku testu:

```typescript
// ✅
const expectedRatesTitle = "Kursy NBP";
await expect(ratesWidget.title).toHaveText(expectedRatesTitle);

// ❌
await expect(ratesWidget.title).toHaveText("Kursy NBP");
```

## Opisy asercji

Opis dodajemy tylko wtedy, gdy z samej asercji nie wynika, co jest sprawdzane. Jeśli opis zawiera
oczekiwaną wartość, używa tej samej stałej co asercja:

```typescript
// ✅ selektor aktywnej zakładki nic nie mówi czytelnikowi
await expect(mainMenu.activeTab, `Aktywna zakładka to „${expectedTitle}”`).toHaveText(expectedTitle);

// ✅ data-testid mówi, co jest sprawdzane
await expect(mainMenu.logoutButton).toBeVisible();

// ❌ opis powtarza to, co widać w kodzie
await expect(mainMenu.logoutButton, "Przycisk Wyloguj jest widoczny").toBeVisible();
```

## Układ testu

Test ma kolejno: przygotowanie, akcję i sprawdzenie. Części rozdzielamy pustą linią. Nie dodajemy
komentarzy `// Arrange`, `// Act`, `// Assert`.

```typescript
test("TC-10 Tytuł testu @logged", async ({ myTripsPage }) => {
  const tripData = prepareRandomTrip();
  const expectedStatus = "W PLANIE";

  const tripPage = await myTripsPage.createTrip(tripData);

  await test.step("Zweryfikuj utworzoną podróż", async () => {
    await expect(tripPage.tripStatus).toHaveText(expectedStatus);
  });
});
```

## Niezależność testów

* Każdy test jest w osobnym pliku. Nie używamy `test.describe.configure({ mode: "serial" })`.
* Żaden test nie korzysta z danych utworzonych przez inny test.
* Testy z `@logged` korzystają z jednego użytkownika testowego, dlatego dane izolujemy unikalnymi
  wartościami. Nazwy i miasta dostają unikalną końcówkę, np. `Kraków-a1b2`.
* Testy uruchamiamy na jednym workerze (`workers: 1`), bo część z nich zmienia wspólny stan
  użytkownika, np. miasto pogody.

## Tagi

| Tag | Znaczenie |
|---|---|
| `@smoke` | test smoke |
| `@logged` | test wymaga zalogowanego użytkownika i korzysta z zapisanej sesji |

W PowerShellu tag trzeba podać w cudzysłowie:

```
npx playwright test --grep "@smoke"
```

Pojedynczy przypadek testowy uruchamiamy po numerze z tytułu:

```
npx playwright test --grep "TC-05"
```

## Dane logowania

* Login i hasło są wyłącznie w pliku `.env`, którego nie dodajemy do repozytorium. Wzór jest
  w `.env.template`.
* Użytkownik testowy jest logowany raz, w `config/global.setup.ts`, poza raportem.
