package handler

import (
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/model"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/service"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/dto"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/middleware"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/response"
	"github.com/gin-gonic/gin"
)

type MVNOHandler struct {
	mvnoService service.MVNOService
}

func NewMVNOHandler(mvnoService service.MVNOService) *MVNOHandler {
	return &MVNOHandler{mvnoService: mvnoService}
}

func (h *MVNOHandler) CreateCliente(c *gin.Context) {
	var req dto.CreateClienteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	cliente, err := h.mvnoService.CreateCliente(c.Request.Context(), req, actorFromContext(c))
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, cliente)
}

func (h *MVNOHandler) ListClientes(c *gin.Context) {
	clientes, err := h.mvnoService.ListClientes(c.Request.Context())
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, clientes)
}

func (h *MVNOHandler) CreatePlano(c *gin.Context) {
	var req dto.CreatePlanoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	plano, err := h.mvnoService.CreatePlano(c.Request.Context(), req, actorFromContext(c))
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, plano)
}

func (h *MVNOHandler) ListPlanos(c *gin.Context) {
	planos, err := h.mvnoService.ListPlanos(c.Request.Context())
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, planos)
}

func (h *MVNOHandler) CreateChip(c *gin.Context) {
	var req dto.CreateChipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	chip, err := h.mvnoService.CreateChip(c.Request.Context(), req, actorFromContext(c))
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, chip)
}

func (h *MVNOHandler) ListChips(c *gin.Context) {
	chips, err := h.mvnoService.ListChips(c.Request.Context(), c.Query("status"))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, chips)
}

func (h *MVNOHandler) GetChip(c *gin.Context) {
	chip, err := h.mvnoService.GetChip(c.Request.Context(), c.Param("iccid"))
	if err != nil {
		response.NotFound(c, "chip")
		return
	}
	response.OK(c, chip)
}

func (h *MVNOHandler) ActivateChip(c *gin.Context) {
	var req dto.AtivarChipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	chip, err := h.mvnoService.ActivateChip(c.Request.Context(), c.Param("iccid"), req, actorFromContext(c))
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, chip)
}

func (h *MVNOHandler) CreateRecarga(c *gin.Context) {
	var req dto.CreateRecargaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	recarga, err := h.mvnoService.CreateRecarga(c.Request.Context(), c.Param("iccid"), req, actorFromContext(c))
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, recarga)
}

func (h *MVNOHandler) ListRecargas(c *gin.Context) {
	recargas, err := h.mvnoService.ListRecargas(c.Request.Context(), c.Param("iccid"))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, recargas)
}

func (h *MVNOHandler) ListAssinaturas(c *gin.Context) {
	assinaturas, err := h.mvnoService.ListAssinaturas(c.Request.Context(), c.Param("iccid"))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, assinaturas)
}

func actorFromContext(c *gin.Context) model.AuditActor {
	userID, _ := c.Get(middleware.UserIDKey)
	email, _ := c.Get(middleware.UserEmailKey)
	role, _ := c.Get(middleware.UserRoleKey)

	return model.AuditActor{
		UserID: valueAsString(userID),
		Email:  valueAsString(email),
		Role:   valueAsString(role),
	}
}

func valueAsString(value any) string {
	if text, ok := value.(string); ok {
		return text
	}
	return ""
}
