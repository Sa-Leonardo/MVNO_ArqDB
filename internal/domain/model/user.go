package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type UserRole string

const (
	RoleAdmin    UserRole = "admin"
	RoleOperator UserRole = "operator"
	RoleViewer   UserRole = "viewer"
)

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"      json:"id"`
	Name         string             `bson:"name"               json:"name"`
	Email        string             `bson:"email"              json:"email"`
	PasswordHash string             `bson:"password_hash"      json:"-"` // nunca expõe no JSON
	Role         UserRole           `bson:"role"               json:"role"`
	IsActive     bool               `bson:"is_active"          json:"is_active"`
	CreatedAt    time.Time          `bson:"created_at"         json:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at"         json:"updated_at"`
}