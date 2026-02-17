.PHONY: build test lint migrate run clean

build:
	go build -o bin/api cmd/api/main.go
	go build -o bin/worker cmd/worker/main.go

test:
	go test -v ./...

lint:
	# Expects golangci-lint installed
	golangci-lint run

migrate:
	# Run SQL files
	cat internal/db/migrations/001_init.sql | docker compose exec -T postgres psql -U fortistack -d fortistack
	cat internal/db/migrations/002_indexes.sql | docker compose exec -T postgres psql -U fortistack -d fortistack
	cat internal/db/migrations/003_scans.sql | docker compose exec -T postgres psql -U fortistack -d fortistack
	# Create default admin user (dynamic hash)
	# This requires Go installed locally to run the hash generator
	cat cmd/admin/main.go > /dev/null || true # Ensure file exists
	# Use password123 as default admin password
	HASH=$$(go run cmd/admin/main.go password123); \
	echo "INSERT INTO users (email, password_hash, role, is_active) VALUES ('admin@fortistack.local', '$$HASH', 'admin', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;" | docker compose exec -T postgres psql -U fortistack -d fortistack

run:
	docker compose up --build

clean:
	docker compose down
	rm -rf bin/

seed:
	# Run the Go seed script
	# Default DSN assumes local docker setup
	DB_DSN="postgres://fortistack:fortistaticpassword@localhost:5432/fortistack?sslmode=disable" go run cmd/seed/main.go
