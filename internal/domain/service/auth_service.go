package service

import (
	"context"
	"errors"

	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/model"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/repository"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/dto"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/crypto"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/jwtutil"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AuthService interface {
	Login(ctx context.Context, req dto.LoginRequest) (*dto.LoginResponse, error)
	CreateUser(ctx context.Context, req dto.CreateUserRequest) (*model.User, error)
	GetUserByID(ctx context.Context, id string) (*model.User, error)
}

type authService struct {
	userRepo repository.UserRepository
	jwt      *jwtutil.JWTUtil
}

func NewAuthService(userRepo repository.UserRepository, jwt *jwtutil.JWTUtil) AuthService {
	return &authService{
		userRepo: userRepo,
		jwt:      jwt,
	}
}

func (s *authService) Login(ctx context.Context, req dto.LoginRequest) (*dto.LoginResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("credenciais invalidas")
		}
		return nil, errors.New("erro ao buscar usuario")
	}

	if !crypto.CheckPassword(req.Password, user.Credentials.PasswordHash) {
		return nil, errors.New("credenciais invalidas")
	}

	token, err := s.jwt.Generate(user.ID.Hex(), user.Identity.Email, string(user.Access.Role))
	if err != nil {
		return nil, errors.New("erro ao gerar token")
	}

	return &dto.LoginResponse{
		Token: token,
		User: dto.UserSummary{
			ID:    user.ID.Hex(),
			Name:  user.Identity.Name,
			Email: user.Identity.Email,
			Role:  string(user.Access.Role),
		},
	}, nil
}

func (s *authService) CreateUser(ctx context.Context, req dto.CreateUserRequest) (*model.User, error) {
	existing, _ := s.userRepo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("email ja cadastrado")
	}

	hash, err := crypto.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("erro ao processar senha")
	}

	role := model.UserRole(req.Role)
	user := &model.User{
		Identity: model.UserIdentity{
			Name:  req.Name,
			Email: req.Email,
		},
		Credentials: model.UserCredentials{
			PasswordHash: hash,
		},
		Access: model.UserAccess{
			Role:        role,
			Permissions: defaultPermissions(role),
			Scopes:      []string{"mvno"},
		},
		Metadata: model.UserMetadata{
			Source: "api",
			Tags:   []string{"user"},
		},
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, errors.New("erro ao criar usuario")
	}

	return user, nil
}

func (s *authService) GetUserByID(ctx context.Context, id string) (*model.User, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("id invalido")
	}
	return s.userRepo.FindByID(ctx, oid)
}

func defaultPermissions(role model.UserRole) []string {
	switch role {
	case model.RoleAdmin:
		return []string{"users:create", "users:read", "inventory:write", "inventory:read"}
	case model.RoleOperator:
		return []string{"inventory:write", "inventory:read"}
	default:
		return []string{"inventory:read"}
	}
}
