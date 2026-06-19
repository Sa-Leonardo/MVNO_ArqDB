package dto

type CreateLoteRequest struct {
	Nome         string   `json:"nome"         binding:"required,min=2"`
	Descricao    string   `json:"descricao"`
	Quantidade   int      `json:"quantidade"   binding:"required,gte=1,lte=1000"`
	ICCIDPrefix  string   `json:"iccid_prefix" binding:"required,min=6"`
	MSISDNPrefix string   `json:"msisdn_prefix"`
	IMSIPrefix   string   `json:"imsi_prefix"`
	Operadora    string   `json:"operadora"`
	Tags         []string `json:"tags"`
}
