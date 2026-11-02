@echo off
rem ==========================================================================
rem  Skroty polecen projektu "Moje podroze" dla Windows (cmd i PowerShell).
rem  Uzycie:  make <polecenie>        (cmd)
rem           .\make <polecenie>      (PowerShell)
rem  Te same polecenia sa w Makefile (Linux/macOS/CI). Lista: make help
rem ==========================================================================
setlocal
rem Sciezki zapamietane przed "shift" (shift przesuwa tez %0).
set "SELF=%~f0"
set "ROOT=%~dp0"
set "VENV=%ROOT%.venv"
set "PY=%VENV%\Scripts\python.exe"
set "BACKEND=%ROOT%backend"

set "TARGET=%~1"
if "%TARGET%"=="" set "TARGET=help"

rem Dodatkowe argumenty przekazywane dalej, np.: make test -k status
set "ARGS="
:collect_args
shift
if "%~1"=="" goto args_done
set "ARGS=%ARGS% %1"
goto collect_args
:args_done

if /i "%TARGET%"=="help" goto help
if /i "%TARGET%"=="install" goto install

if not exist "%PY%" (
    echo Brak srodowiska .venv. Uruchom najpierw: make install
    exit /b 1
)

if /i "%TARGET%"=="run" goto run
if /i "%TARGET%"=="test" goto test
if /i "%TARGET%"=="test-unit" goto test_unit
if /i "%TARGET%"=="cov" goto cov
if /i "%TARGET%"=="cov-html" goto cov_html
if /i "%TARGET%"=="lint" goto lint
if /i "%TARGET%"=="format" goto format
if /i "%TARGET%"=="check" goto check
if /i "%TARGET%"=="migrate" goto migrate
if /i "%TARGET%"=="migration-check" goto migration_check
if /i "%TARGET%"=="reset-db" goto reset_db
if /i "%TARGET%"=="sonar-reports" goto sonar_reports
if /i "%TARGET%"=="sonar-up" goto sonar_up
if /i "%TARGET%"=="sonar" goto sonar
if /i "%TARGET%"=="sonar-down" goto sonar_down
if /i "%TARGET%"=="mutation" goto mutation
if /i "%TARGET%"=="docker-up" goto docker_up
if /i "%TARGET%"=="docker-down" goto docker_down
if /i "%TARGET%"=="clean" goto clean

echo Nieznane polecenie: %TARGET%
echo.
goto help_fail

:help
call :print_help
exit /b 0

:help_fail
call :print_help
exit /b 1

:print_help
echo Uzycie: make ^<polecenie^>   (w PowerShell: .\make ^<polecenie^>)
echo.
echo  Srodowisko
echo    install          utworz .venv i zainstaluj biblioteki (requirements-dev.txt)
echo    run              uruchom serwer: http://localhost:8000/docs
echo.
echo  Testy
echo    test             wszystkie testy (pytest); np. make test -k status
echo    test-unit        tylko testy jednostkowe
echo    cov              testy + pokrycie kodu w konsoli
echo    cov-html         testy + raport pokrycia HTML (backend\htmlcov\index.html)
echo    mutation         testy mutacyjne mutmut (Docker)
echo.
echo  Jakosc kodu
echo    lint             Ruff: lint i sprawdzenie formatowania
echo    format           Ruff: popraw formatowanie i proste bledy
echo    check            lint + testy z pokryciem (jak w CI)
echo    sonar-reports    raporty dla SonarQube (pokrycie, wyniki testow, Ruff)
echo    sonar-up         uruchom serwer SonarQube (Docker): http://localhost:9000
echo    sonar            analiza w SonarQube (wymaga zmiennej SONAR_TOKEN)
echo    sonar-down       zatrzymaj SonarQube
echo.
echo  Baza danych
echo    migrate          zastosuj migracje (alembic upgrade head)
echo    migration-check  sprawdz, czy migracje sa zgodne z modelami
echo    reset-db         usun lokalna baze i zdjecia (backend\data)
echo.
echo  Docker i porzadki
echo    docker-up        backend i frontend w Dockerze: http://localhost:5173
echo    docker-down      zatrzymaj kontenery
echo    clean            usun cache i wygenerowane raporty
exit /b 0

:install
if not exist "%PY%" (
    echo Tworze srodowisko .venv ...
    py -3.13 -m venv "%VENV%" || (
        echo Nie udalo sie utworzyc .venv. Czy Python 3.13 jest zainstalowany? Sprawdz: py --list
        exit /b 1
    )
)
"%PY%" -m pip install --upgrade pip
"%PY%" -m pip install -r "%BACKEND%\requirements-dev.txt"
exit /b %ERRORLEVEL%

:run
call :in_backend "%PY%" -m uvicorn app.main:app --reload%ARGS%
exit /b %ERRORLEVEL%

:test
call :in_backend "%PY%" -m pytest%ARGS%
exit /b %ERRORLEVEL%

:test_unit
call :in_backend "%PY%" -m pytest -m unit%ARGS%
exit /b %ERRORLEVEL%

:cov
call :in_backend "%PY%" -m pytest --cov --cov-report=term-missing%ARGS%
exit /b %ERRORLEVEL%

:cov_html
call :in_backend "%PY%" -m pytest --cov --cov-report=html%ARGS%
if errorlevel 1 exit /b %ERRORLEVEL%
echo Raport: %BACKEND%\htmlcov\index.html
exit /b 0

:lint
call :in_backend "%PY%" -m ruff check .
if errorlevel 1 exit /b %ERRORLEVEL%
call :in_backend "%PY%" -m ruff format --check .
exit /b %ERRORLEVEL%

:format
call :in_backend "%PY%" -m ruff format .
if errorlevel 1 exit /b %ERRORLEVEL%
call :in_backend "%PY%" -m ruff check . --fix
exit /b %ERRORLEVEL%

:check
call "%SELF%" lint
if errorlevel 1 exit /b %ERRORLEVEL%
call :in_backend "%PY%" -m pytest --cov
exit /b %ERRORLEVEL%

:migrate
call :in_backend "%PY%" -m alembic upgrade head
exit /b %ERRORLEVEL%

:migration_check
call :in_backend "%PY%" -m alembic upgrade head
if errorlevel 1 exit /b %ERRORLEVEL%
call :in_backend "%PY%" -m alembic check
exit /b %ERRORLEVEL%

:reset_db
if not exist "%BACKEND%\data" (
    echo Brak katalogu backend\data - nie ma czego usuwac.
    exit /b 0
)
set "CONFIRM="
set /p "CONFIRM=Usunac lokalna baze i zdjecia (backend\data)? Zatrzymaj najpierw serwer. [t/N] "
if /i not "%CONFIRM%"=="t" (
    echo Anulowano.
    exit /b 0
)
rmdir /s /q "%BACKEND%\data"
echo Usunieto. Nowa, pusta baza powstanie przy nastepnym uruchomieniu serwera.
exit /b 0

:sonar_reports
call :in_backend "%PY%" -m pytest --cov --cov-report=xml --junitxml=test-results.xml
if errorlevel 1 exit /b %ERRORLEVEL%
call :in_backend "%PY%" -m ruff check . --output-format=json --exit-zero -o ruff-report.json
exit /b %ERRORLEVEL%

:sonar_up
docker compose --profile sonar up -d
if errorlevel 1 exit /b %ERRORLEVEL%
echo SonarQube startuje (1-2 min): http://localhost:9000
exit /b 0

:sonar
if "%SONAR_TOKEN%"=="" (
    echo Ustaw najpierw token, np. w cmd:  set SONAR_TOKEN=sqa_...
    echo                        w PowerShell:  $env:SONAR_TOKEN="sqa_..."
    exit /b 1
)
call "%SELF%" sonar-reports
if errorlevel 1 exit /b %ERRORLEVEL%
docker compose run --rm sonar-scanner-backend
if errorlevel 1 exit /b %ERRORLEVEL%
echo Wyniki: http://localhost:9000/dashboard?id=moje-podroze-backend
exit /b 0

:sonar_down
docker compose --profile sonar down
exit /b %ERRORLEVEL%

:mutation
docker compose run --rm backend-dev mutmut run
docker compose run --rm backend-dev mutmut results
exit /b %ERRORLEVEL%

:docker_up
docker compose up -d --build
if errorlevel 1 exit /b %ERRORLEVEL%
echo Backend: http://localhost:8000/docs
exit /b 0

:docker_down
docker compose down
exit /b %ERRORLEVEL%

:clean
pushd "%BACKEND%"
for %%d in (.pytest_cache .ruff_cache htmlcov mutants .scannerwork) do if exist "%%d" rmdir /s /q "%%d"
for %%f in (.coverage coverage.xml test-results.xml ruff-report.json) do if exist "%%f" del /q "%%f"
for /d /r %%d in (__pycache__) do if exist "%%d" rmdir /s /q "%%d"
popd
echo Wyczyszczono cache i raporty.
exit /b 0

rem --- Uruchamia polecenie w katalogu backend\ i zwraca jego kod wyjscia ---
:in_backend
pushd "%BACKEND%"
%*
set "RC=%ERRORLEVEL%"
popd
exit /b %RC%
