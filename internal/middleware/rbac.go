package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/response"
)

// RequireRole bloqueia acesso se o role do usuário não estiver na lista permitida
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get(UserRoleKey)
		if !exists {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		for _, role := range roles {
			if userRole == role {
				c.Next()
				return
			}
		}

		response.Forbidden(c)
		c.Abort()
	}
}