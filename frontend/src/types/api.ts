export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type UserRole = "admin" | "operator" | "viewer";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserSummary;
}

export interface UserIdentity {
  name: string;
  email: string;
}

export interface UserAccess {
  role: UserRole;
  permissions: string[];
  scopes: string[];
}

export interface UserStatus {
  is_active: boolean;
  locked_at?: string;
}

export interface UserAudit {
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface User {
  id: string;
  identity: UserIdentity;
  access: UserAccess;
  status: UserStatus;
  audit: UserAudit;
}

export type ChipStatus =
  | "available"
  | "reserved"
  | "active"
  | "suspended"
  | "canceled";

export type AssinaturaStatus = "active" | "paused" | "canceled";
export type RecargaStatus = "pending" | "approved" | "rejected";

export interface AuditInfo {
  created_at: string;
  updated_at: string;
}

export interface ClienteContato {
  email?: string;
  telefone?: string;
}

export interface ClienteEndereco {
  logradouro?: string;
  numero?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  documento: string;
  contato: ClienteContato;
  endereco: ClienteEndereco;
  tags: string[];
  audit: AuditInfo;
}

export interface PlanoBeneficios {
  dados_mb: number;
  voz_min: number;
  sms: number;
  apps: string[];
}

export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  moeda: string;
  ciclo_dias: number;
  beneficios: PlanoBeneficios;
  ativo: boolean;
  audit: AuditInfo;
}

export interface PlanoSnapshot {
  plano_id: string;
  nome: string;
  valor: number;
  moeda: string;
  ciclo_dias: number;
  beneficios: PlanoBeneficios;
}

export interface AssinaturaAtual {
  assinatura_id: string;
  status: AssinaturaStatus;
  plano: PlanoSnapshot;
  inicio_em: string;
  fim_em?: string;
}

export interface ChipRede {
  operadora?: string;
  imsi?: string;
}

export interface Chip {
  id: string;
  iccid: string;
  lote_id?: string;
  msisdn?: string;
  status: ChipStatus;
  cliente_id?: string;
  plano_id?: string;
  rede: ChipRede;
  assinatura_atual?: AssinaturaAtual;
  tags: string[];
  audit: AuditInfo;
}

export interface Assinatura {
  id: string;
  iccid: string;
  cliente_id: string;
  plano: PlanoSnapshot;
  status: AssinaturaStatus;
  inicio_em: string;
  fim_em?: string;
  cancelada_em?: string;
  audit: AuditInfo;
}

export interface Recarga {
  id: string;
  iccid: string;
  valor: number;
  moeda: string;
  status: RecargaStatus;
  referencia?: string;
  solicitada_em: string;
  processada_em?: string;
}

export interface CreateClienteRequest {
  nome: string;
  documento: string;
  contato: ClienteContato;
  endereco: ClienteEndereco;
  tags: string[];
  chip_iccids: string[];
}

export interface UpdateClienteRequest {
  nome: string;
  documento: string;
  contato: ClienteContato;
  endereco: ClienteEndereco;
  tags: string[];
}

export interface CreatePlanoRequest {
  nome: string;
  descricao: string;
  valor: number;
  moeda: string;
  ciclo_dias: number;
  beneficios: PlanoBeneficios;
}

export interface UpdatePlanoRequest {
  nome: string;
  descricao: string;
  valor: number;
  moeda: string;
  ciclo_dias: number;
  beneficios: PlanoBeneficios;
  ativo: boolean;
}

export interface CreateChipRequest {
  iccid: string;
  msisdn?: string;
  operadora?: string;
  imsi?: string;
  tags: string[];
}

export type LoteStatus = "imported" | "active" | "closed";

export interface LoteChip {
  id: string;
  nome: string;
  descricao: string;
  quantidade: number;
  criado_em: string;
  status: LoteStatus;
  audit: AuditInfo;
}

export interface CreateLoteRequest {
  nome: string;
  descricao: string;
  quantidade: number;
  iccid_prefix: string;
  msisdn_prefix?: string;
  imsi_prefix?: string;
  operadora?: string;
  tags: string[];
}

export interface AtivarChipRequest {
  cliente_id: string;
  plano_id: string;
}

export interface CreateRecargaRequest {
  valor: number;
  moeda: string;
  referencia?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: UserRole;
}
