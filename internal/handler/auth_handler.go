package handler

import (
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/service"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/dto"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/middleware"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/response"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.authService.Login(c.Request.Context(), req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.OK(c, result)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get(middleware.UserIDKey)

	user, err := h.authService.GetUserByID(c.Request.Context(), userID.(string))
	if err != nil {
		response.NotFound(c, "usuário")
		return
	}

	response.OK(c, user)
}

func (h *AuthHandler) CreateUser(c *gin.Context) {
	var req dto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.authService.CreateUser(c.Request.Context(), req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, user)
}

func (h *AuthHandler) ListUsers(c *gin.Context) {
	users, err := h.authService.ListUsers(c.Request.Context())
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, users)
}

func (h *AuthHandler) GetUser(c *gin.Context) {
	user, err := h.authService.GetUserByID(
		c.Request.Context(),
		c.Param("id"),
	)

	if err != nil {
		response.NotFound(c, "usuário")
		return
	}

	response.OK(c, user)
}

func (h *AuthHandler) UpdateUser(c *gin.Context) {
	var req dto.UpdateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.authService.UpdateUser(
		c.Request.Context(),
		c.Param("id"),
		req,
	)

	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.OK(c, user)
}

func (h *AuthHandler) DeactivateUser(c *gin.Context) {

	err := h.authService.DeactivateUser(
		c.Request.Context(),
		c.Param("id"),
	)

	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.OK(c, gin.H{
		"message": "usuário desativado",
	})
}

func (h *AuthHandler) ReactivateUser(c *gin.Context) {
	err := h.authService.ReactivateUser(
		c.Request.Context(),
		c.Param("id"),
	)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.OK(c, gin.H{
		"message": "usuário ativado",
	})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	err := h.authService.ChangeUserPassword(
		c.Request.Context(),
		c.Param("id"),
		req.Password,
	)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.OK(c, gin.H{
		"message": "senha alterada com sucesso",
	})
}
