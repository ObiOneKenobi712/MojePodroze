# Skróty poleceń projektu „Moje podróże” – Linux, macOS, CI (GNU make).
# Na Windows bez make użyj make.bat z tymi samymi poleceniami: `make test` (cmd), `.\make test` (PowerShell).
#
# Użycie: make <polecenie>          lista poleceń: make help
# Dodatkowe argumenty pytesta:      make test ARGS="-k status"

SHELL := /bin/sh
BACKEND := backend
ARGS ?=

ifeq ($(OS),Windows_NT)
PY := $(CURDIR)/.venv/Scripts/python.exe
PYTHON_BOOTSTRAP := py -3.13
else
PY := $(CURDIR)/.venv/bin/python
PYTHON_BOOTSTRAP := python3
endif

.DEFAULT_GOAL := help
.PHONY: help install run test test-unit cov cov-html lint format check migrate migration-check
.PHONY: reset-db sonar-reports sonar-up sonar sonar-down mutation docker-up docker-down clean

help: ## lista poleceń
	@echo "Użycie: make <polecenie>"
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-16s %s\n", $$1, $$2}'

# --- Środowisko -----------------------------------------------------------------------------

install: ## utwórz .venv i zainstaluj biblioteki (requirements-dev.txt)
	test -x "$(PY)" || $(PYTHON_BOOTSTRAP) -m venv .venv
	"$(PY)" -m pip install --upgrade pip
	"$(PY)" -m pip install -r $(BACKEND)/requirements-dev.txt

run: ## uruchom serwer: http://localhost:8000/docs
	cd $(BACKEND) && "$(PY)" -m uvicorn app.main:app --reload $(ARGS)

# --- Testy ----------------------------------------------------------------------------------

test: ## wszystkie testy (pytest)
	cd $(BACKEND) && "$(PY)" -m pytest $(ARGS)

test-unit: ## tylko testy jednostkowe
	cd $(BACKEND) && "$(PY)" -m pytest -m unit $(ARGS)

cov: ## testy + pokrycie kodu w konsoli
	cd $(BACKEND) && "$(PY)" -m pytest --cov --cov-report=term-missing $(ARGS)

cov-html: ## testy + raport pokrycia HTML (backend/htmlcov/index.html)
	cd $(BACKEND) && "$(PY)" -m pytest --cov --cov-report=html $(ARGS)

mutation: ## testy mutacyjne mutmut (Docker)
	docker compose run --rm backend-dev mutmut run
	docker compose run --rm backend-dev mutmut results

# --- Jakość kodu ----------------------------------------------------------------------------

lint: ## Ruff: lint i sprawdzenie formatowania
	cd $(BACKEND) && "$(PY)" -m ruff check . && "$(PY)" -m ruff format --check .

format: ## Ruff: popraw formatowanie i proste błędy
	cd $(BACKEND) && "$(PY)" -m ruff format . && "$(PY)" -m ruff check . --fix

check: lint ## lint + testy z pokryciem (jak w CI)
	cd $(BACKEND) && "$(PY)" -m pytest --cov

sonar-reports: ## raporty dla SonarQube (pokrycie, wyniki testów, Ruff)
	cd $(BACKEND) && "$(PY)" -m pytest --cov --cov-report=xml --junitxml=test-results.xml
	cd $(BACKEND) && "$(PY)" -m ruff check . --output-format=json --exit-zero -o ruff-report.json

sonar-up: ## uruchom serwer SonarQube (Docker): http://localhost:9000
	docker compose --profile sonar up -d

sonar: ## analiza w SonarQube (wymaga zmiennej SONAR_TOKEN)
	@test -n "$$SONAR_TOKEN" || { echo "Ustaw najpierw token: export SONAR_TOKEN=sqa_..."; exit 1; }
	$(MAKE) sonar-reports
	docker compose run --rm sonar-scanner-backend
	@echo "Wyniki: http://localhost:9000/dashboard?id=moje-podroze-backend"

sonar-down: ## zatrzymaj SonarQube
	docker compose --profile sonar down

# --- Baza danych ----------------------------------------------------------------------------

migrate: ## zastosuj migracje (alembic upgrade head)
	cd $(BACKEND) && "$(PY)" -m alembic upgrade head

migration-check: ## sprawdź, czy migracje są zgodne z modelami
	cd $(BACKEND) && "$(PY)" -m alembic upgrade head && "$(PY)" -m alembic check

reset-db: ## usuń lokalną bazę i zdjęcia (backend/data)
	@printf "Usunąć lokalną bazę i zdjęcia (backend/data)? Zatrzymaj najpierw serwer. [t/N] "; \
	read answer; \
	if [ "$$answer" = "t" ]; then rm -rf $(BACKEND)/data && echo "Usunięto."; else echo "Anulowano."; fi

# --- Docker i porządki ----------------------------------------------------------------------

docker-up: ## backend i frontend w Dockerze: http://localhost:5173
	docker compose up -d --build

docker-down: ## zatrzymaj kontenery
	docker compose down

clean: ## usuń cache i wygenerowane raporty
	cd $(BACKEND) && rm -rf .pytest_cache .ruff_cache htmlcov mutants .scannerwork \
		.coverage coverage.xml test-results.xml ruff-report.json
	find $(BACKEND) -type d -name __pycache__ -prune -exec rm -rf {} +
