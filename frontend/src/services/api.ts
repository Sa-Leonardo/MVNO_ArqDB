import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { sessionStorageService } from "@/utils/storage";
import type { APIResponse } from "@/types/api";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  timeout: 20_000
});

api.interceptors.request.use((config) => {
  const token = sessionStorageService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<APIResponse<unknown>>) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    const message = payload?.error || payload?.message || error.message;

    if (status === 401) {
      sessionStorageService.clear();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error("Acesso negado para esta ação.");
      return Promise.reject(error);
    }

    if (message) {
      error.message = message;
    }
    return Promise.reject(error);
  }
);

export async function unwrap<T>(promise: Promise<{ data: APIResponse<T> }>): Promise<T> {
  const response = await promise;
  if (!response.data.success) {
    throw new Error(response.data.error || response.data.message || "Erro na API");
  }
  return response.data.data as T;
}
