package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/jwtutil"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/response"
	"strings"
)

const UserIDKey = "user_id"
const UserRoleKey = "user_role"
const UserEmailKey = "user_email"

func Auth(jwt *jwtutil.JWTUtil) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		claims, err := jwt.Validate(parts[1])
		if err != nil {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		// Injeta dados do usuário no contexto da requisição
		c.Set(UserIDKey, claims.UserID)
		c.Set(UserRoleKey, claims.Role)
		c.Set(UserEmailKey, claims.Email)

		c.Next()
	}
}