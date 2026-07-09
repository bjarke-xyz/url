.PHONY: dev build run

dev:
	set -a; [ -f .env ] && . ./.env; set +a; go run .

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o url .

run: build
	./url
