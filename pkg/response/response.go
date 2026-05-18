package response

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func OK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
	})
}

func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    data,
	})
}

func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, APIResponse{
		Success: false,
		Error:   message,
	})
}

func Unauthorized(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, APIResponse{
		Success: false,
		Error:   "não autorizado",
	})
}

func Forbidden(c *gin.Context) {
	c.JSON(http.StatusForbidden, APIResponse{
		Success: false,
		Error:   "acesso negado",
	})
}

func NotFound(c *gin.Context, entity string) {
	c.JSON(http.StatusNotFound, APIResponse{
		Success: false,
		Error:   entity + " não encontrado",
	})
}

func InternalError(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, APIResponse{
		Success: false,
		Error:   "erro interno do servidor",
	})
}