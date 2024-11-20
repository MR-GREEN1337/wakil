.PHONY: install_deps backend frontend all stop format lint lint-and-format test

all: install_deps backend frontend

install_deps:
	@echo "Install Python Poetry to build the project"
	curl -sSL https://install.python-poetry.org | python3 -
	@echo "Installing dependencies for all services..."
	cd backend && poetry install --with dev
	cd frontend && npm install

backend:
	@echo "Starting backend..."
	cd backend && uvicorn src.main:app --reload &  # Run in background

format:
	@echo "Formatting backend code..."
	cd backend && poetry run ruff format .

lint:
	@echo "Linting backend code..."
	cd backend && poetry run ruff check --fix

lint-and-format: format lint

test:
	@echo "Running tests for the backend..."
	cd backend && pytest ./tests

frontend:
	@echo "Starting frontend..."
	cd frontend && npm run dev &  # Run in background
	@echo "Everything is up and running! Run 'make stop' to stop everything"

stop:
	@echo "Stopping all services..."
	# Stopping the backend (Uvicorn on port 8000) and frontend (Node.js)
	@pkill -f 'uvicorn.*8000'
	@pkill -f 'node.*frontend'

