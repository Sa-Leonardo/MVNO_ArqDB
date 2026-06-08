import { api, unwrap } from "@/services/api";
import type {
  Assinatura,
  AtivarChipRequest,
  Chip,
  Cliente,
  CreateChipRequest,
  CreateClienteRequest,
  CreatePlanoRequest,
  CreateRecargaRequest,
  CreateUserRequest,
  Plano,
  Recarga,
  User
} from "@/types/api";

export const mvnoService = {
  listClientes(): Promise<Cliente[]> {
    return unwrap(api.get("/api/v1/clientes"));
  },
  createCliente(payload: CreateClienteRequest): Promise<Cliente> {
    return unwrap(api.post("/api/v1/clientes", payload));
  },
  listPlanos(): Promise<Plano[]> {
    return unwrap(api.get("/api/v1/planos"));
  },
  createPlano(payload: CreatePlanoRequest): Promise<Plano> {
    return unwrap(api.post("/api/v1/planos", payload));
  },
  listChips(status?: string): Promise<Chip[]> {
    return unwrap(api.get("/api/v1/chips", { params: { status: status || undefined } }));
  },
  getChip(iccid: string): Promise<Chip> {
    return unwrap(api.get(`/api/v1/chips/${iccid}`));
  },
  createChip(payload: CreateChipRequest): Promise<Chip> {
    return unwrap(api.post("/api/v1/chips", payload));
  },
  activateChip(iccid: string, payload: AtivarChipRequest): Promise<Chip> {
    return unwrap(api.post(`/api/v1/chips/${iccid}/ativar`, payload));
  },
  createRecarga(iccid: string, payload: CreateRecargaRequest): Promise<Recarga> {
    return unwrap(api.post(`/api/v1/chips/${iccid}/recargas`, payload));
  },
  listRecargas(iccid: string): Promise<Recarga[]> {
    return unwrap(api.get(`/api/v1/chips/${iccid}/recargas`));
  },
  listAssinaturas(iccid: string): Promise<Assinatura[]> {
    return unwrap(api.get(`/api/v1/chips/${iccid}/assinaturas`));
  },
  createUser(payload: CreateUserRequest): Promise<User> {
    return unwrap(api.post("/api/v1/users", payload));
  }
};
