package service

import (
	"context"
	"errors"
	"fmt"
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
			return nil, errors.New("credenciais inválidas")
		}
		return nil, errors.New("erro ao buscar usuário")
	}

	ok := crypto.CheckPassword(req.Password, user.PasswordHash)

	fmt.Println("senha válida?", ok)

	if !ok {
	return nil, errors.New("credenciais inválidas")
}

	token, err := s.jwt.Generate(user.ID.Hex(), user.Email, string(user.Role))
	if err != nil {
		return nil, errors.New("erro ao gerar token")
	}

	return &dto.LoginResponse{
		Token: token,
		User: dto.UserSummary{
			ID:    user.ID.Hex(),
			Name:  user.Name,
			Email: user.Email,
			Role:  string(user.Role),
		},
	}, nil
}

func (s *authService) CreateUser(ctx context.Context, req dto.CreateUserRequest) (*model.User, error) {
	// Verifica se email já existe
	existing, _ := s.userRepo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("email já cadastrado")
	}

	hash, err := crypto.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("erro ao processar senha")
	}

	user := &model.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hash,
		Role:         model.UserRole(req.Role),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, errors.New("erro ao criar usuário")
	}

	return user, nil
}

func (s *authService) GetUserByID(ctx context.Context, id string) (*model.User, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("id inválido")
	}
	return s.userRepo.FindByID(ctx, oid)
}