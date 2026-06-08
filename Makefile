.PHONY: run build tidy

run:
	go run .

build:
	go build -o bin/mvno-api .

tidy:
	go mod tidy
