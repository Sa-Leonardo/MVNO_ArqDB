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

type MVNORepository interface {
	EnsureIndexes(ctx context.Context) error
	CreateCliente(ctx context.Context, cliente *model.Cliente) error
	FindClienteByID(ctx context.Context, id primitive.ObjectID) (*model.Cliente, error)
	ListClientes(ctx context.Context) ([]model.Cliente, error)
	CreatePlano(ctx context.Context, plano *model.Plano) error
	FindPlanoByID(ctx context.Context, id primitive.ObjectID) (*model.Plano, error)
	ListPlanos(ctx context.Context) ([]model.Plano, error)
	CreateChip(ctx context.Context, chip *model.Chip) error
	FindChipByICCID(ctx context.Context, iccid string) (*model.Chip, error)
	ListChips(ctx context.Context, status string) ([]model.Chip, error)
	ActivateChip(ctx context.Context, chip *model.Chip, assinatura *model.Assinatura) error
	CreateRecarga(ctx context.Context, recarga *model.Recarga) error
	ListRecargasByICCID(ctx context.Context, iccid string) ([]model.Recarga, error)
	ListAssinaturasByICCID(ctx context.Context, iccid string) ([]model.Assinatura, error)
	WriteAuditLog(ctx context.Context, log *model.AuditLog) error
}

type mvnoRepository struct {
	chips       *mongo.Collection
	clientes    *mongo.Collection
	planos      *mongo.Collection
	recargas    *mongo.Collection
	assinaturas *mongo.Collection
	auditLogs   *mongo.Collection
}

func NewMVNORepository(db *mongo.Database) MVNORepository {
	return &mvnoRepository{
		chips:       db.Collection("chips"),
		clientes:    db.Collection("clientes"),
		planos:      db.Collection("planos"),
		recargas:    db.Collection("recargas"),
		assinaturas: db.Collection("assinaturas"),
		auditLogs:   db.Collection("audit_logs"),
	}
}

func (r *mvnoRepository) EnsureIndexes(ctx context.Context) error {
	indexes := []struct {
		collection *mongo.Collection
		models     []mongo.IndexModel
	}{
		{r.chips, []mongo.IndexModel{
			{Keys: bson.D{{Key: "iccid", Value: 1}}, Options: options.Index().SetName("uniq_chips_iccid").SetUnique(true)},
			{Keys: bson.D{{Key: "msisdn", Value: 1}}, Options: options.Index().SetName("idx_chips_msisdn")},
			{Keys: bson.D{{Key: "status", Value: 1}, {Key: "cliente_id", Value: 1}}, Options: options.Index().SetName("idx_chips_status_cliente")},
			{Keys: bson.D{{Key: "assinatura_atual.status", Value: 1}}, Options: options.Index().SetName("idx_chips_assinatura_status")},
		}},
		{r.clientes, []mongo.IndexModel{
			{Keys: bson.D{{Key: "documento", Value: 1}}, Options: options.Index().SetName("uniq_clientes_documento").SetUnique(true)},
			{Keys: bson.D{{Key: "nome", Value: 1}}, Options: options.Index().SetName("idx_clientes_nome")},
			{Keys: bson.D{{Key: "tags", Value: 1}}, Options: options.Index().SetName("idx_clientes_tags")},
		}},
		{r.planos, []mongo.IndexModel{
			{Keys: bson.D{{Key: "nome", Value: 1}}, Options: options.Index().SetName("uniq_planos_nome").SetUnique(true)},
			{Keys: bson.D{{Key: "ativo", Value: 1}, {Key: "valor", Value: 1}}, Options: options.Index().SetName("idx_planos_ativo_valor")},
		}},
		{r.recargas, []mongo.IndexModel{
			{Keys: bson.D{{Key: "iccid", Value: 1}, {Key: "solicitada_em", Value: -1}}, Options: options.Index().SetName("idx_recargas_iccid_data")},
			{Keys: bson.D{{Key: "status", Value: 1}}, Options: options.Index().SetName("idx_recargas_status")},
		}},
		{r.assinaturas, []mongo.IndexModel{
			{Keys: bson.D{{Key: "iccid", Value: 1}, {Key: "inicio_em", Value: -1}}, Options: options.Index().SetName("idx_assinaturas_iccid_inicio")},
			{Keys: bson.D{{Key: "cliente_id", Value: 1}, {Key: "status", Value: 1}}, Options: options.Index().SetName("idx_assinaturas_cliente_status")},
		}},
		{r.auditLogs, []mongo.IndexModel{
			{Keys: bson.D{{Key: "entity", Value: 1}, {Key: "entity_id", Value: 1}, {Key: "occurred_at", Value: -1}}, Options: options.Index().SetName("idx_audit_entity")},
			{Keys: bson.D{{Key: "actor.user_id", Value: 1}, {Key: "occurred_at", Value: -1}}, Options: options.Index().SetName("idx_audit_actor")},
		}},
	}

	for _, item := range indexes {
		if _, err := item.collection.Indexes().CreateMany(ctx, item.models); err != nil {
			return err
		}
	}
	return nil
}

func (r *mvnoRepository) CreateCliente(ctx context.Context, cliente *model.Cliente) error {
	now := time.Now()
	cliente.ID = primitive.NewObjectID()
	cliente.Audit = model.AuditInfo{CreatedAt: now, UpdatedAt: now}
	_, err := r.clientes.InsertOne(ctx, cliente)
	return err
}

func (r *mvnoRepository) FindClienteByID(ctx context.Context, id primitive.ObjectID) (*model.Cliente, error) {
	var cliente model.Cliente
	err := r.clientes.FindOne(ctx, bson.M{"_id": id}).Decode(&cliente)
	return &cliente, err
}

func (r *mvnoRepository) ListClientes(ctx context.Context) ([]model.Cliente, error) {
	cursor, err := r.clientes.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "nome", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var clientes []model.Cliente
	err = cursor.All(ctx, &clientes)
	return clientes, err
}

func (r *mvnoRepository) CreatePlano(ctx context.Context, plano *model.Plano) error {
	now := time.Now()
	plano.ID = primitive.NewObjectID()
	plano.Ativo = true
	plano.Audit = model.AuditInfo{CreatedAt: now, UpdatedAt: now}
	_, err := r.planos.InsertOne(ctx, plano)
	return err
}

func (r *mvnoRepository) FindPlanoByID(ctx context.Context, id primitive.ObjectID) (*model.Plano, error) {
	var plano model.Plano
	err := r.planos.FindOne(ctx, bson.M{"_id": id, "ativo": true}).Decode(&plano)
	return &plano, err
}

func (r *mvnoRepository) ListPlanos(ctx context.Context) ([]model.Plano, error) {
	cursor, err := r.planos.Find(ctx, bson.M{"ativo": true}, options.Find().SetSort(bson.D{{Key: "valor", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var planos []model.Plano
	err = cursor.All(ctx, &planos)
	return planos, err
}

func (r *mvnoRepository) CreateChip(ctx context.Context, chip *model.Chip) error {
	now := time.Now()
	chip.ID = primitive.NewObjectID()
	chip.Status = model.ChipStatusAvailable
	chip.Audit = model.AuditInfo{CreatedAt: now, UpdatedAt: now}
	_, err := r.chips.InsertOne(ctx, chip)
	return err
}

func (r *mvnoRepository) FindChipByICCID(ctx context.Context, iccid string) (*model.Chip, error) {
	var chip model.Chip
	err := r.chips.FindOne(ctx, bson.M{"iccid": iccid}).Decode(&chip)
	return &chip, err
}

func (r *mvnoRepository) ListChips(ctx context.Context, status string) ([]model.Chip, error) {
	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := r.chips.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "audit.created_at", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var chips []model.Chip
	err = cursor.All(ctx, &chips)
	return chips, err
}

func (r *mvnoRepository) ActivateChip(ctx context.Context, chip *model.Chip, assinatura *model.Assinatura) error {
	now := time.Now()
	assinatura.ID = primitive.NewObjectID()
	assinatura.Audit = model.AuditInfo{CreatedAt: now, UpdatedAt: now}

	_, err := r.assinaturas.InsertOne(ctx, assinatura)
	if err != nil {
		return err
	}

	chip.Status = model.ChipStatusActive
	chip.PlanoID = &assinatura.Plano.PlanoID
	chip.ClienteID = &assinatura.ClienteID
	chip.AssinaturaAtual = &model.AssinaturaAtual{
		AssinaturaID: assinatura.ID,
		Status:       assinatura.Status,
		Plano:        assinatura.Plano,
		InicioEm:     assinatura.InicioEm,
		FimEm:        assinatura.FimEm,
	}
	chip.Audit.UpdatedAt = now

	_, err = r.chips.UpdateOne(ctx, bson.M{"_id": chip.ID}, bson.M{"$set": bson.M{
		"status":           chip.Status,
		"cliente_id":       chip.ClienteID,
		"plano_id":         chip.PlanoID,
		"assinatura_atual": chip.AssinaturaAtual,
		"audit.updated_at": chip.Audit.UpdatedAt,
	}})
	return err
}

func (r *mvnoRepository) CreateRecarga(ctx context.Context, recarga *model.Recarga) error {
	recarga.ID = primitive.NewObjectID()
	recarga.Status = model.RecargaStatusApproved
	recarga.SolicitadaEm = time.Now()
	_, err := r.recargas.InsertOne(ctx, recarga)
	return err
}

func (r *mvnoRepository) ListRecargasByICCID(ctx context.Context, iccid string) ([]model.Recarga, error) {
	cursor, err := r.recargas.Find(ctx, bson.M{"iccid": iccid}, options.Find().SetSort(bson.D{{Key: "solicitada_em", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var recargas []model.Recarga
	err = cursor.All(ctx, &recargas)
	return recargas, err
}

func (r *mvnoRepository) ListAssinaturasByICCID(ctx context.Context, iccid string) ([]model.Assinatura, error) {
	cursor, err := r.assinaturas.Find(ctx, bson.M{"iccid": iccid}, options.Find().SetSort(bson.D{{Key: "inicio_em", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var assinaturas []model.Assinatura
	err = cursor.All(ctx, &assinaturas)
	return assinaturas, err
}

func (r *mvnoRepository) WriteAuditLog(ctx context.Context, log *model.AuditLog) error {
	log.ID = primitive.NewObjectID()
	log.OccurredAt = time.Now()
	_, err := r.auditLogs.InsertOne(ctx, log)
	return err
}
