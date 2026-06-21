package dto

type ClienteContatoRequest struct {
	Email    string `json:"email"    binding:"omitempty,email"`
	Telefone string `json:"telefone"`
}

type ClienteEnderecoRequest struct {
	Logradouro string `json:"logradouro"`
	Numero     string `json:"numero"`
	Cidade     string `json:"cidade"`
	UF         string `json:"uf"`
	CEP        string `json:"cep"`
}

type CreateClienteRequest struct {
	Nome       string                 `json:"nome"        binding:"required,min=2"`
	Documento  string                 `json:"documento"   binding:"required,min=5"`
	Contato    ClienteContatoRequest  `json:"contato"`
	Endereco   ClienteEnderecoRequest `json:"endereco"`
	Tags       []string               `json:"tags"`
	ChipICCIDs []string               `json:"chip_iccids" binding:"required,min=1,dive,required,min=10"`
}

type UpdateClienteRequest struct {
	Nome      string                 `json:"nome"      binding:"required,min=2"`
	Documento string                 `json:"documento" binding:"required,min=5"`
	Contato   ClienteContatoRequest  `json:"contato"`
	Endereco  ClienteEnderecoRequest `json:"endereco"`
	Tags      []string               `json:"tags"`
}

type PlanoBeneficiosRequest struct {
	DadosMB int      `json:"dados_mb" binding:"gte=0"`
	VozMin  int      `json:"voz_min"  binding:"gte=0"`
	SMS     int      `json:"sms"      binding:"gte=0"`
	Apps    []string `json:"apps"`
}

type CreatePlanoRequest struct {
	Nome       string                 `json:"nome"       binding:"required,min=2"`
	Descricao  string                 `json:"descricao"`
	Valor      float64                `json:"valor"      binding:"required,gte=0"`
	Moeda      string                 `json:"moeda"`
	CicloDias  int                    `json:"ciclo_dias" binding:"required,gte=1"`
	Beneficios PlanoBeneficiosRequest `json:"beneficios"`
}

type UpdatePlanoRequest struct {
	Nome       string                 `json:"nome"       binding:"required,min=2"`
	Descricao  string                 `json:"descricao"`
	Valor      float64                `json:"valor"      binding:"required,gte=0"`
	Moeda      string                 `json:"moeda"`
	CicloDias  int                    `json:"ciclo_dias" binding:"required,gte=1"`
	Beneficios PlanoBeneficiosRequest `json:"beneficios"`
	Ativo      *bool                  `json:"ativo"      binding:"required"`
}

type CreateChipRequest struct {
	ICCID     string   `json:"iccid"     binding:"required,min=10"`
	MSISDN    string   `json:"msisdn"`
	Operadora string   `json:"operadora"`
	IMSI      string   `json:"imsi"`
	Tags      []string `json:"tags"`
}

type AtivarChipRequest struct {
	ClienteID string `json:"cliente_id" binding:"required"`
	PlanoID   string `json:"plano_id"   binding:"required"`
}

type CreateRecargaRequest struct {
	Valor      float64 `json:"valor"      binding:"required,gt=0"`
	Moeda      string  `json:"moeda"`
	Referencia string  `json:"referencia"`
}
