.PHONY: dev down generate migrate-create migrate-up migrate-down seed test lint

dev:
	docker-compose up --build

down:
	docker-compose down -v

generate:
	cd backend && swag init -g cmd/api/main.go

migrate-create:
	@read -p "Enter migration name: " name; \
	cd backend && go run github.com/pressly/goose/v3/cmd/goose@latest -dir migrations create $$name sql

migrate-up:
	cd backend && go run github.com/pressly/goose/v3/cmd/goose@latest -dir migrations postgres "postgres://root:secretpassword@127.0.0.1:15432/flashdepo?sslmode=disable" up

migrate-down:
	cd backend && go run github.com/pressly/goose/v3/cmd/goose@latest -dir migrations postgres "postgres://root:secretpassword@127.0.0.1:15432/flashdepo?sslmode=disable" down

seed:
	cd backend && go run cmd/seed/main.go

test:
	cd backend && go test ./...

lint:
	cd backend && golangci-lint run
	cd frontend && npm run lint
