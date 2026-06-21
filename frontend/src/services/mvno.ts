import { api, unwrap } from "@/services/api";
import type {
  Assinatura,
  AtivarChipRequest,
  Chip,
  Cliente,
  CreateChipRequest,
  CreateLoteRequest,
  CreateClienteRequest,
  CreatePlanoRequest,
  CreateRecargaRequest,
  CreateUserRequest,
  Plano,
  LoteChip,
  Recarga,
  UpdateClienteRequest,
  UpdatePlanoRequest,
  User,
  UserRole
} from "@/types/api";

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: UserRole;
}

export const mvnoService = {
  // =========================
  // CLIENTES
  // =========================
  listClientes(): Promise<Cliente[]> {
    return unwrap(api.get("/api/v1/clientes"));
  },

  createCliente(payload: CreateClienteRequest): Promise<Cliente> {
    return unwrap(api.post("/api/v1/clientes", payload));
  },

  updateCliente(id: string, payload: UpdateClienteRequest): Promise<Cliente> {
    return unwrap(api.put(`/api/v1/clientes/${id}`, payload));
  },

  deleteCliente(id: string): Promise<void> {
    return unwrap(api.delete(`/api/v1/clientes/${id}`));
  },

  // =========================
  // PLANOS
  // =========================
  listPlanos(): Promise<Plano[]> {
    return unwrap(api.get("/api/v1/planos"));
  },

  createPlano(payload: CreatePlanoRequest): Promise<Plano> {
    return unwrap(api.post("/api/v1/planos", payload));
  },

  updatePlano(id: string, payload: UpdatePlanoRequest): Promise<Plano> {
    return unwrap(api.put(`/api/v1/planos/${id}`, payload));
  },

  // =========================
  // CHIPS
  // =========================
  listChips(status?: string): Promise<Chip[]> {
    return unwrap(
      api.get("/api/v1/chips", {
        params: {
          status: status || undefined
        }
      })
    );
  },

  getChip(iccid: string): Promise<Chip> {
    return unwrap(api.get(`/api/v1/chips/${iccid}`));
  },

  createChip(payload: CreateChipRequest): Promise<Chip> {
    return unwrap(api.post("/api/v1/chips", payload));
  },

  createLote(payload: CreateLoteRequest): Promise<LoteChip> {
    return unwrap(api.post("/api/v1/chips/lotes", payload));
  },

  listLotes(): Promise<LoteChip[]> {
    return unwrap(api.get("/api/v1/chips/lotes"));
  },

  activateChip(
    iccid: string,
    payload: AtivarChipRequest
  ): Promise<Chip> {
    return unwrap(
      api.post(`/api/v1/chips/${iccid}/ativar`, payload)
    );
  },

  createRecarga(
    iccid: string,
    payload: CreateRecargaRequest
  ): Promise<Recarga> {
    return unwrap(
      api.post(`/api/v1/chips/${iccid}/recargas`, payload)
    );
  },

  listRecargas(iccid: string): Promise<Recarga[]> {
    return unwrap(
      api.get(`/api/v1/chips/${iccid}/recargas`)
    );
  },

  listAssinaturas(iccid: string): Promise<Assinatura[]> {
    return unwrap(
      api.get(`/api/v1/chips/${iccid}/assinaturas`)
    );
  },

  // =========================
  // USUÁRIOS
  // =========================
  listUsers(): Promise<User[]> {
    return unwrap(api.get("/api/v1/users"));
  },

  createUser(payload: CreateUserRequest): Promise<User> {
    return unwrap(api.post("/api/v1/users", payload));
  },

  updateUser(
    id: string,
    payload: UpdateUserRequest
  ): Promise<User> {
    return unwrap(
      api.put(`/api/v1/users/${id}`, payload)
    );
  },

  deactivateUser(id: string): Promise<void> {
    return unwrap(
      api.patch(`/api/v1/users/${id}/deactivate`)
    );
  },

  reactivateUser(id: string): Promise<void> {
    return unwrap(
      api.patch(`/api/v1/users/${id}/reactivate`)
    );
  },

  changeUserPassword(id: string, password: string): Promise<void> {
    return unwrap(
      api.patch(`/api/v1/users/${id}/password`, { password })
    );
  }
};
