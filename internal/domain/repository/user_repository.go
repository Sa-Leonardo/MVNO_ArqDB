package repository

import (
	"context"
	"time"

	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserRepository interface {
	EnsureIndexes(ctx context.Context) error
	FindByEmail(ctx context.Context, email string) (*model.User, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*model.User, error)

	Create(ctx context.Context, user *model.User) error
	List(ctx context.Context) ([]model.User, error)
	Update(ctx context.Context, user *model.User) error

	Deactivate(ctx context.Context, id primitive.ObjectID) error

	Reactivate(ctx context.Context, id primitive.ObjectID) error
}

type userRepository struct {
	collection *mongo.Collection
}

func NewUserRepository(db *mongo.Database) UserRepository {
	return &userRepository{
		collection: db.Collection("users"),
	}
}

func (r *userRepository) EnsureIndexes(ctx context.Context) error {
	if err := r.migrateLegacyDocuments(ctx); err != nil {
		return err
	}

	models := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "identity.email", Value: 1}},
			Options: options.Index().
				SetName("uniq_users_identity_email").
				SetUnique(true).
				SetPartialFilterExpression(bson.M{"identity.email": bson.M{"$exists": true}}),
		},
		{
			Keys: bson.D{
				{Key: "status.is_active", Value: 1},
				{Key: "access.role", Value: 1},
			},
			Options: options.Index().SetName("idx_users_status_role"),
		},
		{
			Keys:    bson.D{{Key: "metadata.tags", Value: 1}},
			Options: options.Index().SetName("idx_users_metadata_tags"),
		},
	}

	_, err := r.collection.Indexes().CreateMany(ctx, models)
	return err
}

func (r *userRepository) migrateLegacyDocuments(ctx context.Context) error {
	filter := bson.M{"identity": bson.M{"$exists": false}}
	update := mongo.Pipeline{
		{{
			Key: "$set",
			Value: bson.D{
				{Key: "identity", Value: bson.D{
					{Key: "name", Value: "$name"},
					{Key: "email", Value: "$email"},
				}},
				{Key: "credentials", Value: bson.D{
					{Key: "password_hash", Value: "$password_hash"},
				}},
				{Key: "access", Value: bson.D{
					{Key: "role", Value: bson.D{{Key: "$ifNull", Value: bson.A{"$role", model.RoleViewer}}}},
					{Key: "permissions", Value: bson.A{}},
					{Key: "scopes", Value: bson.A{"mvno"}},
				}},
				{Key: "status", Value: bson.D{
					{Key: "is_active", Value: bson.D{{Key: "$ifNull", Value: bson.A{"$is_active", true}}}},
				}},
				{Key: "audit", Value: bson.D{
					{Key: "created_at", Value: "$created_at"},
					{Key: "updated_at", Value: "$updated_at"},
				}},
				{Key: "metadata", Value: bson.D{
					{Key: "source", Value: "legacy"},
					{Key: "tags", Value: bson.A{"user", "legacy"}},
				}},
			},
		}},
		{{
			Key: "$unset",
			Value: bson.A{
				"name",
				"email",
				"password_hash",
				"role",
				"is_active",
				"created_at",
				"updated_at",
			},
		}},
	}

	_, err := r.collection.UpdateMany(ctx, filter, update)
	return err
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	var user model.User
	err := r.collection.FindOne(ctx, bson.M{
		"identity.email":   email,
		"status.is_active": true,
	}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByID(
	ctx context.Context,
	id primitive.ObjectID,
) (*model.User, error) {

	var user model.User

	err := r.collection.FindOne(
		ctx,
		bson.M{"_id": id},
	).Decode(&user)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *userRepository) Create(ctx context.Context, user *model.User) error {
	user.ID = primitive.NewObjectID()
	now := time.Now()
	user.Status.IsActive = true
	user.Audit.CreatedAt = now
	user.Audit.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, user)
	return err
}

// listar usuários
func (r *userRepository) List(ctx context.Context) ([]model.User, error) {
	cursor, err := r.collection.Find(
		ctx,
		bson.M{},
		options.Find().
			SetSort(bson.D{{Key: "identity.name", Value: 1}}),
	)

	if err != nil {
		return nil, err
	}

	defer cursor.Close(ctx)

	var users []model.User

	if err := cursor.All(ctx, &users); err != nil {
		return nil, err
	}

	return users, nil
}

// atualizar usuário
func (r *userRepository) Update(
	ctx context.Context,
	user *model.User,
) error {

	user.Audit.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": user.ID},
		bson.M{
			"$set": bson.M{
				"identity.name":    user.Identity.Name,
				"identity.email":   user.Identity.Email,
				"access.role":      user.Access.Role,
				"status.is_active": user.Status.IsActive,
				"audit.updated_at": user.Audit.UpdatedAt,
			},
		},
	)

	return err
}

// Desativar o usuário
func (r *userRepository) Deactivate(
	ctx context.Context,
	id primitive.ObjectID,
) error {

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{
			"$set": bson.M{
				"status.is_active": false,
				"audit.updated_at": time.Now(),
			},
		},
	)

	return err
}

func (r *userRepository) Reactivate(
	ctx context.Context,
	id primitive.ObjectID,
) error {

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{
			"$set": bson.M{
				"status.is_active": true,
				"audit.updated_at": time.Now(),
			},
		},
	)

	return err
}
