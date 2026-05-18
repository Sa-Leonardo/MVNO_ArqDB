.PHONY: run build tidy

run:
	go run cmd/api/main.go

build:
	go build -o bin/mvno-api cmd/api/main.go

tidy:
	go mod tidy