package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/model"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/repository"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/dto"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type MVNOService interface {
	CreateCliente(ctx context.Context, req dto.CreateClienteRequest, actor model.AuditActor) (*model.Cliente, error)
	ListClientes(ctx context.Context) ([]model.Cliente, error)
	UpdateCliente(ctx context.Context, id string, req dto.UpdateClienteRequest, actor model.AuditActor) (*model.Cliente, error)
	DeleteCliente(ctx context.Context, id string, actor model.AuditActor) error
	CreatePlano(ctx context.Context, req dto.CreatePlanoRequest, actor model.AuditActor) (*model.Plano, error)
	ListPlanos(ctx context.Context) ([]model.Plano, error)
	UpdatePlano(ctx context.Context, id string, req dto.UpdatePlanoRequest, actor model.AuditActor) (*model.Plano, error)
	CreateChip(ctx context.Context, req dto.CreateChipRequest, actor model.AuditActor) (*model.Chip, error)
	GetChip(ctx context.Context, iccid string) (*model.Chip, error)
	ListChips(ctx context.Context, status string) ([]model.Chip, error)
	ActivateChip(ctx context.Context, iccid string, req dto.AtivarChipRequest, actor model.AuditActor) (*model.Chip, error)
	CreateRecarga(ctx context.Context, iccid string, req dto.CreateRecargaRequest, actor model.AuditActor) (*model.Recarga, error)
	ListRecargas(ctx context.Context, iccid string) ([]model.Recarga, error)
	ListAssinaturas(ctx context.Context, iccid string) ([]model.Assinatura, error)
	ImportDemoChips(ctx context.Context, actor model.AuditActor) error
	CreateLoteChips(ctx context.Context, req dto.CreateLoteRequest, actor model.AuditActor) (*model.LoteChip, error)
	ListLotes(ctx context.Context) ([]model.LoteChip, error)
}

type mvnoService struct {
	repo repository.MVNORepository
}

func NewMVNOService(repo repository.MVNORepository) MVNOService {
	return &mvnoService{repo: repo}
}

// Implementação do lote de iccids
func (s *mvnoService) ImportDemoChips(
	ctx context.Context,
	actor model.AuditActor,
) error {

	for i := 1; i <= 20; i++ {

		chip := &model.Chip{
			ICCID: fmt.Sprintf(
				"895500000000000%03d",
				i,
			),

			MSISDN: fmt.Sprintf(
				"559399100%04d",
				i,
			),

			Rede: model.ChipRede{
				Operadora: "TIM",
				IMSI: fmt.Sprintf(
					"724040000000000%03d",
					i,
				),
			},

			Tags: []string{
				"demo",
				"lote-001",
			},
		}

		if err := s.repo.CreateChip(ctx, chip); err != nil {
			return err
		}
	}

	s.audit(
		ctx,
		"lote",
		"demo-001",
		"chips.imported",
		actor,
		map[string]any{
			"quantidade": 20,
		},
	)

	return nil
}

func (s *mvnoService) CreateLoteChips(ctx context.Context, req dto.CreateLoteRequest, actor model.AuditActor) (*model.LoteChip, error) {
	iccidPrefix := onlyDigits(req.ICCIDPrefix)
	if iccidPrefix == "" {
		return nil, errors.New("prefixo ICCID invalido")
	}
	if req.Quantidade <= 0 {
		return nil, errors.New("quantidade deve ser maior que zero")
	}

	lote := &model.LoteChip{
		ID:         primitive.NewObjectID(),
		Nome:       strings.TrimSpace(req.Nome),
		Descricao:  strings.TrimSpace(req.Descricao),
		Quantidade: req.Quantidade,
		Status:     model.LoteStatusImported,
	}

	chips := make([]model.Chip, 0, req.Quantidade)
	for i := 1; i <= req.Quantidade; i++ {
		iccid := fmt.Sprintf("%s%06d", iccidPrefix, i)
		chip := model.Chip{
			ICCID:  iccid,
			LoteID: &lote.ID,
			Rede: model.ChipRede{
				Operadora: strings.TrimSpace(req.Operadora),
				IMSI:      sequenceValue(req.IMSIPrefix, i),
			},
			MSISDN: sequenceValue(req.MSISDNPrefix, i),
			Tags:   append([]string{"lote", lote.Nome}, req.Tags...),
		}
		chips = append(chips, chip)
	}

	if err := s.repo.CreateLote(ctx, lote); err != nil {
		return nil, err
	}
	if err := s.repo.CreateManyChips(ctx, chips); err != nil {
		return nil, err
	}

	s.audit(ctx, "lote", lote.ID.Hex(), "chips.batch_imported", actor, map[string]any{
		"lote":       lote,
		"quantidade": req.Quantidade,
	})
	return lote, nil
}

func (s *mvnoService) ListLotes(ctx context.Context) ([]model.LoteChip, error) {
	return s.repo.ListLotes(ctx)
}

func (s *mvnoService) CreateCliente(ctx context.Context, req dto.CreateClienteRequest, actor model.AuditActor) (*model.Cliente, error) {
	chipICCIDs := uniqueDigits(req.ChipICCIDs)
	if len(chipICCIDs) == 0 {
		return nil, errors.New("cliente deve ter pelo menos um chip")
	}
	if err := s.validateAvailableChips(ctx, chipICCIDs); err != nil {
		return nil, err
	}

	cliente := &model.Cliente{
		Nome:      strings.TrimSpace(req.Nome),
		Documento: onlyDigits(req.Documento),
		Contato: model.ClienteContato{
			Email:    strings.TrimSpace(req.Contato.Email),
			Telefone: strings.TrimSpace(req.Contato.Telefone),
		},
		Endereco: model.ClienteEndereco{
			Logradouro: strings.TrimSpace(req.Endereco.Logradouro),
			Numero:     strings.TrimSpace(req.Endereco.Numero),
			Cidade:     strings.TrimSpace(req.Endereco.Cidade),
			UF:         strings.ToUpper(strings.TrimSpace(req.Endereco.UF)),
			CEP:        onlyDigits(req.Endereco.CEP),
		},
		Tags: req.Tags,
	}

	if err := s.repo.CreateCliente(ctx, cliente); err != nil {
		return nil, err
	}

	if err := s.repo.AssignChipsToCliente(ctx, cliente.ID, chipICCIDs); err != nil {
		_ = s.repo.DeleteCliente(ctx, cliente.ID)
		return nil, errors.New("erro ao vincular chips ao cliente")
	}

	s.audit(ctx, "cliente", cliente.ID.Hex(), "cliente.created", actor, map[string]any{
		"cliente":     cliente,
		"chip_iccids": chipICCIDs,
	})
	return cliente, nil
}

func (s *mvnoService) ListClientes(ctx context.Context) ([]model.Cliente, error) {
	return s.repo.ListClientes(ctx)
}

func (s *mvnoService) UpdateCliente(ctx context.Context, id string, req dto.UpdateClienteRequest, actor model.AuditActor) (*model.Cliente, error) {
	clienteID, err := primitive.ObjectIDFromHex(strings.TrimSpace(id))
	if err != nil {
		return nil, errors.New("cliente_id invalido")
	}

	cliente, err := s.repo.FindClienteByID(ctx, clienteID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("cliente nao encontrado")
		}
		return nil, err
	}

	cliente.Nome = strings.TrimSpace(req.Nome)
	cliente.Documento = onlyDigits(req.Documento)
	cliente.Contato = model.ClienteContato{
		Email:    strings.TrimSpace(req.Contato.Email),
		Telefone: strings.TrimSpace(req.Contato.Telefone),
	}
	cliente.Endereco = model.ClienteEndereco{
		Logradouro: strings.TrimSpace(req.Endereco.Logradouro),
		Numero:     strings.TrimSpace(req.Endereco.Numero),
		Cidade:     strings.TrimSpace(req.Endereco.Cidade),
		UF:         strings.ToUpper(strings.TrimSpace(req.Endereco.UF)),
		CEP:        onlyDigits(req.Endereco.CEP),
	}
	cliente.Tags = req.Tags

	if err := s.repo.UpdateCliente(ctx, cliente); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("cliente nao encontrado")
		}
		return nil, err
	}

	s.audit(ctx, "cliente", cliente.ID.Hex(), "cliente.updated", actor, cliente)
	return cliente, nil
}

func (s *mvnoService) DeleteCliente(ctx context.Context, id string, actor model.AuditActor) error {
	clienteID, err := primitive.ObjectIDFromHex(strings.TrimSpace(id))
	if err != nil {
		return errors.New("cliente_id invalido")
	}

	cliente, err := s.repo.FindClienteByID(ctx, clienteID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return errors.New("cliente nao encontrado")
		}
		return err
	}

	totalChips, err := s.repo.CountChipsByClienteID(ctx, clienteID)
	if err != nil {
		return err
	}
	if totalChips > 0 {
		return errors.New("cliente possui chips vinculados")
	}

	if err := s.repo.DeleteCliente(ctx, clienteID); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return errors.New("cliente nao encontrado")
		}
		return err
	}

	s.audit(ctx, "cliente", cliente.ID.Hex(), "cliente.deleted", actor, cliente)
	return nil
}

func (s *mvnoService) CreatePlano(ctx context.Context, req dto.CreatePlanoRequest, actor model.AuditActor) (*model.Plano, error) {
	moeda := strings.ToUpper(strings.TrimSpace(req.Moeda))
	if moeda == "" {
		moeda = "BRL"
	}

	plano := &model.Plano{
		Nome:      strings.TrimSpace(req.Nome),
		Descricao: strings.TrimSpace(req.Descricao),
		Valor:     req.Valor,
		Moeda:     moeda,
		CicloDias: req.CicloDias,
		Beneficios: model.PlanoBeneficios{
			DadosMB: req.Beneficios.DadosMB,
			VozMin:  req.Beneficios.VozMin,
			SMS:     req.Beneficios.SMS,
			Apps:    req.Beneficios.Apps,
		},
	}

	if err := s.repo.CreatePlano(ctx, plano); err != nil {
		return nil, err
	}
	s.audit(ctx, "plano", plano.ID.Hex(), "plano.created", actor, plano)
	return plano, nil
}

func (s *mvnoService) ListPlanos(ctx context.Context) ([]model.Plano, error) {
	return s.repo.ListPlanos(ctx)
}

func (s *mvnoService) UpdatePlano(ctx context.Context, id string, req dto.UpdatePlanoRequest, actor model.AuditActor) (*model.Plano, error) {
	planoID, err := primitive.ObjectIDFromHex(strings.TrimSpace(id))
	if err != nil {
		return nil, errors.New("plano_id invalido")
	}

	plano, err := s.repo.FindPlanoByID(ctx, planoID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("plano nao encontrado")
		}
		return nil, err
	}

	plano.Nome = strings.TrimSpace(req.Nome)
	plano.Descricao = strings.TrimSpace(req.Descricao)
	plano.Valor = req.Valor
	if strings.TrimSpace(req.Moeda) != "" {
		plano.Moeda = strings.ToUpper(strings.TrimSpace(req.Moeda))
	}
	plano.CicloDias = req.CicloDias
	plano.Beneficios = model.PlanoBeneficios{
		DadosMB: req.Beneficios.DadosMB,
		VozMin:  req.Beneficios.VozMin,
		SMS:     req.Beneficios.SMS,
		Apps:    req.Beneficios.Apps,
	}
	if req.Ativo != nil {
		plano.Ativo = *req.Ativo
	}

	if err := s.repo.UpdatePlano(ctx, plano); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("plano nao encontrado")
		}
		return nil, err
	}

	s.audit(ctx, "plano", plano.ID.Hex(), "plano.updated", actor, plano)
	return plano, nil
}

func (s *mvnoService) CreateChip(ctx context.Context, req dto.CreateChipRequest, actor model.AuditActor) (*model.Chip, error) {
	chip := &model.Chip{
		ICCID:  onlyDigits(req.ICCID),
		MSISDN: onlyDigits(req.MSISDN),
		Rede: model.ChipRede{
			Operadora: strings.TrimSpace(req.Operadora),
			IMSI:      onlyDigits(req.IMSI),
		},
		Tags: req.Tags,
	}

	if err := s.repo.CreateChip(ctx, chip); err != nil {
		return nil, err
	}
	s.audit(ctx, "chip", chip.ICCID, "chip.created", actor, chip)
	return chip, nil
}

func (s *mvnoService) GetChip(ctx context.Context, iccid string) (*model.Chip, error) {
	return s.repo.FindChipByICCID(ctx, onlyDigits(iccid))
}

func (s *mvnoService) ListChips(ctx context.Context, status string) ([]model.Chip, error) {
	return s.repo.ListChips(ctx, strings.TrimSpace(status))
}

func (s *mvnoService) ActivateChip(ctx context.Context, iccid string, req dto.AtivarChipRequest, actor model.AuditActor) (*model.Chip, error) {
	chip, err := s.repo.FindChipByICCID(ctx, onlyDigits(iccid))
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("chip nao encontrado")
		}
		return nil, err
	}
	if chip.Status != model.ChipStatusAvailable && chip.Status != model.ChipStatusReserved {
		return nil, errors.New("somente chips disponiveis ou reservados podem ser ativados")
	}

	clienteID, err := primitive.ObjectIDFromHex(req.ClienteID)
	if err != nil {
		return nil, errors.New("cliente_id invalido")
	}
	planoID, err := primitive.ObjectIDFromHex(req.PlanoID)
	if err != nil {
		return nil, errors.New("plano_id invalido")
	}

	cliente, err := s.repo.FindClienteByID(ctx, clienteID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("cliente nao encontrado")
		}
		return nil, err
	}
	plano, err := s.repo.FindPlanoByID(ctx, planoID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("plano nao encontrado")
		}
		return nil, err
	}
	if !plano.Ativo {
		return nil, errors.New("plano selecionado esta inativo")
	}
	if chip.ClienteID != nil && *chip.ClienteID != cliente.ID {
		return nil, errors.New("chip reservado para outro cliente")
	}

	now := time.Now()
	assinatura := &model.Assinatura{
		ICCID:     chip.ICCID,
		ClienteID: cliente.ID,
		Plano:     planoSnapshot(plano),
		Status:    model.AssinaturaStatusActive,
		InicioEm:  now,
	}

	if err := s.repo.ActivateChip(ctx, chip, assinatura); err != nil {
		return nil, err
	}
	s.audit(ctx, "chip", chip.ICCID, "chip.activated", actor, map[string]any{
		"chip":       chip,
		"cliente_id": cliente.ID.Hex(),
		"plano_id":   plano.ID.Hex(),
		"assinatura": assinatura.ID.Hex(),
	})
	return chip, nil
}

func (s *mvnoService) CreateRecarga(ctx context.Context, iccid string, req dto.CreateRecargaRequest, actor model.AuditActor) (*model.Recarga, error) {
	chip, err := s.repo.FindChipByICCID(ctx, onlyDigits(iccid))
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("chip nao encontrado")
		}
		return nil, err
	}
	if chip.Status != model.ChipStatusActive {
		return nil, errors.New("recarga exige chip ativo")
	}

	moeda := strings.ToUpper(strings.TrimSpace(req.Moeda))
	if moeda == "" {
		moeda = "BRL"
	}
	recarga := &model.Recarga{
		ICCID:      chip.ICCID,
		Valor:      req.Valor,
		Moeda:      moeda,
		Referencia: strings.TrimSpace(req.Referencia),
	}
	if err := s.repo.CreateRecarga(ctx, recarga); err != nil {
		return nil, err
	}
	s.audit(ctx, "recarga", recarga.ID.Hex(), "recarga.created", actor, recarga)
	return recarga, nil
}

func (s *mvnoService) ListRecargas(ctx context.Context, iccid string) ([]model.Recarga, error) {
	return s.repo.ListRecargasByICCID(ctx, onlyDigits(iccid))
}

func (s *mvnoService) ListAssinaturas(ctx context.Context, iccid string) ([]model.Assinatura, error) {
	return s.repo.ListAssinaturasByICCID(ctx, onlyDigits(iccid))
}

func (s *mvnoService) audit(ctx context.Context, entity, entityID, action string, actor model.AuditActor, snapshot any) {
	_ = s.repo.WriteAuditLog(ctx, &model.AuditLog{
		Entity:   entity,
		EntityID: entityID,
		Action:   action,
		Actor:    actor,
		Snapshot: map[string]any{"data": snapshot},
	})
}

func planoSnapshot(plano *model.Plano) model.PlanoSnapshot {
	return model.PlanoSnapshot{
		PlanoID:    plano.ID,
		Nome:       plano.Nome,
		Valor:      plano.Valor,
		Moeda:      plano.Moeda,
		CicloDias:  plano.CicloDias,
		Beneficios: plano.Beneficios,
	}
}

func onlyDigits(value string) string {
	var builder strings.Builder
	for _, char := range value {
		if char >= '0' && char <= '9' {
			builder.WriteRune(char)
		}
	}
	return builder.String()
}

func uniqueDigits(values []string) []string {
	seen := make(map[string]bool, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		digits := onlyDigits(value)
		if digits == "" || seen[digits] {
			continue
		}
		seen[digits] = true
		result = append(result, digits)
	}
	return result
}

func sequenceValue(prefix string, index int) string {
	digits := onlyDigits(prefix)
	if digits == "" {
		return ""
	}
	return fmt.Sprintf("%s%06d", digits, index)
}

func (s *mvnoService) validateAvailableChips(ctx context.Context, iccids []string) error {
	chips, err := s.repo.FindChipsByICCIDs(ctx, iccids)
	if err != nil {
		return err
	}
	if len(chips) != len(iccids) {
		return errors.New("um ou mais chips nao foram encontrados")
	}

	for _, chip := range chips {
		if chip.Status != model.ChipStatusAvailable || chip.ClienteID != nil {
			return errors.New("um ou mais chips nao estao disponiveis")
		}
	}

	return nil
}
