import { api, unwrap } from "@/services/api";
import type { LoginRequest, LoginResponse, User, UserSummary } from "@/types/api";

export const authService = {
  login(payload: LoginRequest): Promise<LoginResponse> {
    return unwrap(api.post("/auth/login", payload));
  },
  me(): Promise<User | UserSummary> {
    return unwrap(api.get("/api/v1/auth/me"));
  }
};
