package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserRole string

const (
	RoleAdmin    UserRole = "admin"
	RoleOperator UserRole = "operator"
	RoleViewer   UserRole = "viewer"
)

type UserIdentity struct {
	Name  string `bson:"name"  json:"name"`
	Email string `bson:"email" json:"email"`
}

type UserCredentials struct {
	PasswordHash string `bson:"password_hash" json:"-"`
}

type UserAccess struct {
	Role        UserRole `bson:"role"        json:"role"`
	Permissions []string `bson:"permissions" json:"permissions"`
	Scopes      []string `bson:"scopes"      json:"scopes"`
}

type UserStatus struct {
	IsActive bool       `bson:"is_active"           json:"is_active"`
	LockedAt *time.Time `bson:"locked_at,omitempty" json:"locked_at,omitempty"`
}

type UserAudit struct {
	CreatedAt   time.Time  `bson:"created_at"              json:"created_at"`
	UpdatedAt   time.Time  `bson:"updated_at"              json:"updated_at"`
	LastLoginAt *time.Time `bson:"last_login_at,omitempty" json:"last_login_at,omitempty"`
}

type UserMetadata struct {
	Source string   `bson:"source" json:"source"`
	Tags   []string `bson:"tags"   json:"tags"`
}

type User struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Identity    UserIdentity       `bson:"identity"      json:"identity"`
	Credentials UserCredentials    `bson:"credentials"   json:"-"`
	Access      UserAccess         `bson:"access"        json:"access"`
	Status      UserStatus         `bson:"status"        json:"status"`
	Audit       UserAudit          `bson:"audit"         json:"audit"`
	Metadata    UserMetadata       `bson:"metadata"      json:"metadata"`
}
