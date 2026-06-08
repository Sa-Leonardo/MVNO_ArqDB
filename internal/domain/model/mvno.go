package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChipStatus string

const (
	ChipStatusAvailable ChipStatus = "available"
	ChipStatusReserved  ChipStatus = "reserved"
	ChipStatusActive    ChipStatus = "active"
	ChipStatusSuspended ChipStatus = "suspended"
	ChipStatusCanceled  ChipStatus = "canceled"
)

type AssinaturaStatus string

const (
	AssinaturaStatusActive   AssinaturaStatus = "active"
	AssinaturaStatusPaused   AssinaturaStatus = "paused"
	AssinaturaStatusCanceled AssinaturaStatus = "canceled"
)

type RecargaStatus string

const (
	RecargaStatusPending  RecargaStatus = "pending"
	RecargaStatusApproved RecargaStatus = "approved"
	RecargaStatusRejected RecargaStatus = "rejected"
)

type AuditActor struct {
	UserID string `bson:"user_id,omitempty" json:"user_id,omitempty"`
	Email  string `bson:"email,omitempty"   json:"email,omitempty"`
	Role   string `bson:"role,omitempty"    json:"role,omitempty"`
}

type AuditInfo struct {
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

type ClienteContato struct {
	Email    string `bson:"email,omitempty"    json:"email,omitempty"`
	Telefone string `bson:"telefone,omitempty" json:"telefone,omitempty"`
}

type ClienteEndereco struct {
	Logradouro string `bson:"logradouro,omitempty" json:"logradouro,omitempty"`
	Numero     string `bson:"numero,omitempty"     json:"numero,omitempty"`
	Cidade     string `bson:"cidade,omitempty"     json:"cidade,omitempty"`
	UF         string `bson:"uf,omitempty"         json:"uf,omitempty"`
	CEP        string `bson:"cep,omitempty"        json:"cep,omitempty"`
}

type Cliente struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Nome      string             `bson:"nome"          json:"nome"`
	Documento string             `bson:"documento"     json:"documento"`
	Contato   ClienteContato     `bson:"contato"       json:"contato"`
	Endereco  ClienteEndereco    `bson:"endereco"      json:"endereco"`
	Tags      []string           `bson:"tags"          json:"tags"`
	Audit     AuditInfo          `bson:"audit"         json:"audit"`
}

type PlanoBeneficios struct {
	DadosMB int      `bson:"dados_mb" json:"dados_mb"`
	VozMin  int      `bson:"voz_min"  json:"voz_min"`
	SMS     int      `bson:"sms"      json:"sms"`
	Apps    []string `bson:"apps"     json:"apps"`
}

type Plano struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Nome       string             `bson:"nome"          json:"nome"`
	Descricao  string             `bson:"descricao"     json:"descricao"`
	Valor      float64            `bson:"valor"         json:"valor"`
	Moeda      string             `bson:"moeda"         json:"moeda"`
	CicloDias  int                `bson:"ciclo_dias"    json:"ciclo_dias"`
	Beneficios PlanoBeneficios    `bson:"beneficios"    json:"beneficios"`
	Ativo      bool               `bson:"ativo"         json:"ativo"`
	Audit      AuditInfo          `bson:"audit"         json:"audit"`
}

type PlanoSnapshot struct {
	PlanoID    primitive.ObjectID `bson:"plano_id"    json:"plano_id"`
	Nome       string             `bson:"nome"        json:"nome"`
	Valor      float64            `bson:"valor"       json:"valor"`
	Moeda      string             `bson:"moeda"       json:"moeda"`
	CicloDias  int                `bson:"ciclo_dias"  json:"ciclo_dias"`
	Beneficios PlanoBeneficios    `bson:"beneficios"  json:"beneficios"`
}

type AssinaturaAtual struct {
	AssinaturaID primitive.ObjectID `bson:"assinatura_id" json:"assinatura_id"`
	Status       AssinaturaStatus   `bson:"status"        json:"status"`
	Plano        PlanoSnapshot      `bson:"plano"         json:"plano"`
	InicioEm     time.Time          `bson:"inicio_em"     json:"inicio_em"`
	FimEm        *time.Time         `bson:"fim_em,omitempty" json:"fim_em,omitempty"`
}

type ChipRede struct {
	Operadora string `bson:"operadora,omitempty" json:"operadora,omitempty"`
	IMSI      string `bson:"imsi,omitempty"      json:"imsi,omitempty"`
}

type Chip struct {
	ID              primitive.ObjectID  `bson:"_id,omitempty"                json:"id"`
	ICCID           string              `bson:"iccid"                         json:"iccid"`
	MSISDN          string              `bson:"msisdn,omitempty"              json:"msisdn,omitempty"`
	Status          ChipStatus          `bson:"status"                        json:"status"`
	ClienteID       *primitive.ObjectID `bson:"cliente_id,omitempty"          json:"cliente_id,omitempty"`
	PlanoID         *primitive.ObjectID `bson:"plano_id,omitempty"            json:"plano_id,omitempty"`
	Rede            ChipRede            `bson:"rede"                          json:"rede"`
	AssinaturaAtual *AssinaturaAtual    `bson:"assinatura_atual,omitempty"    json:"assinatura_atual,omitempty"`
	Tags            []string            `bson:"tags"                          json:"tags"`
	Audit           AuditInfo           `bson:"audit"                         json:"audit"`
}

type Assinatura struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ICCID       string             `bson:"iccid"          json:"iccid"`
	ClienteID   primitive.ObjectID `bson:"cliente_id"     json:"cliente_id"`
	Plano       PlanoSnapshot      `bson:"plano"          json:"plano"`
	Status      AssinaturaStatus   `bson:"status"         json:"status"`
	InicioEm    time.Time          `bson:"inicio_em"      json:"inicio_em"`
	FimEm       *time.Time         `bson:"fim_em,omitempty" json:"fim_em,omitempty"`
	CanceladaEm *time.Time         `bson:"cancelada_em,omitempty" json:"cancelada_em,omitempty"`
	Audit       AuditInfo          `bson:"audit"          json:"audit"`
}

type Recarga struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ICCID        string             `bson:"iccid"          json:"iccid"`
	Valor        float64            `bson:"valor"          json:"valor"`
	Moeda        string             `bson:"moeda"          json:"moeda"`
	Status       RecargaStatus      `bson:"status"         json:"status"`
	Referencia   string             `bson:"referencia,omitempty" json:"referencia,omitempty"`
	SolicitadaEm time.Time          `bson:"solicitada_em" json:"solicitada_em"`
	ProcessadaEm *time.Time         `bson:"processada_em,omitempty" json:"processada_em,omitempty"`
}

type AuditLog struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Entity     string             `bson:"entity"        json:"entity"`
	EntityID   string             `bson:"entity_id"     json:"entity_id"`
	Action     string             `bson:"action"        json:"action"`
	Actor      AuditActor         `bson:"actor"         json:"actor"`
	OccurredAt time.Time          `bson:"occurred_at"   json:"occurred_at"`
	Snapshot   map[string]any     `bson:"snapshot"      json:"snapshot"`
}
