package database

import (
	"context"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"time"
)

type MongoDB struct {
	Client *mongo.Client
	DB     *mongo.Database
}

func Connect(uri, dbName string) *MongoDB {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(uri)

	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Fatalf("erro ao conectar no MongoDB: %v", err)
	}

	// Verifica se a conexão está viva
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("MongoDB não respondeu ao ping: %v", err)
	}

	log.Printf("MongoDB conectado: %s", dbName)

	return &MongoDB{
		Client: client,
		DB:     client.Database(dbName),
	}
}

// Disconnect encerra a conexão com segurança — chamado no shutdown
func (m *MongoDB) Disconnect() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := m.Client.Disconnect(ctx); err != nil {
		log.Printf("erro ao desconectar MongoDB: %v", err)
	}

	log.Println("MongoDB desconectado")
}

// Collection retorna uma collection pelo nome
func (m *MongoDB) Collection(name string) *mongo.Collection {
	return m.DB.Collection(name)
}