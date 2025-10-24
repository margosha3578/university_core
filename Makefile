.EXPORT_ALL_VARIABLES:
COMPOSE_FILE ?= ./build/docker-compose/docker-compose.yml
DEV_COMPOSE_FILE ?= ./build/docker-compose/docker-compose.dev.yml
UNIVERSITY_SERVICE ?= web
PROFILE ?= dev
CURRENT_DIR = $(shell pwd)

DOTENV_BASE_FILE ?= ./.env
-include $(DOTENV_BASE_FILE)

.PHONY: help
help: # Display available commands
	@echo "\n\033[0;33mAvailable make commands:\033[0m\n"
	@grep -E '^[a-zA-Z0-9 -]+:.*#'  Makefile | while read -r l; do printf "\033[1;32m$$(echo $$l | cut -f 1 -d':')\033[00m:$$(echo $$l | cut -f 2- -d'#')\n"; done

.PHONY: dev-start
dev-start: dev-build dev-up # Build and spin up the application in one command

.PHONY: prod-start
prod-start: prod-build up # Build and spin up the application in one command

.PHONY: dev-down
dev-down: down # Shut down the application in dev mode and restore dockerignore

.PHONY: restart
restart: down up # Restart the application

.PHONY: up
up:  # Spin up the application
	docker compose -f $(COMPOSE_FILE) up -d
	docker compose ps

.PHONY: dev-up
dev-up: # Spin up the application in dev mode
	docker compose -f $(COMPOSE_FILE) -f $(DEV_COMPOSE_FILE) up -d
	docker compose ps

.PHONY: down
down: # Shut down the application
	docker compose down

.PHONY: logs
logs: # Follow logs of all running containers
	docker compose logs --follow

.PHONY: connect
connect: # Connect to the running core container
	docker compose exec -it $(UNIVERSITY_SERVICE) /bin/bash

.PHONY: dev-build
dev-build: # Build docker image of the application
	docker build --tag=$(UNIVERSITY_SERVICE) --file=build/dockerfile/Dockerfile --build-arg INSTALL_DEV=true .

.PHONY: prod-build
prod-build: # Build docker image of the application
	docker build --tag=$(UNIVERSITY_SERVICE) --file=build/dockerfile/Dockerfile .

.PHONY: populate-db
populate-db: # Populate database with test data
	docker compose exec $(UNIVERSITY_SERVICE) python scripts/populate_db.py
