import axiosInstance from "@/utils/axiosInstance";
import { unwrap, type ApiResponse } from "@/types/api";

/**
 * Shared API client layer.
 *
 * - `apiClient` is the configured axios instance (auth header + auto token refresh).
 * - The `v1` helpers target the versioned `/api/v1/*` endpoints and unwrap the
 *   standard `{ success, data }` envelope, returning `data` directly (or throwing
 *   an Error carrying `code`/`details` on `{ success:false }`).
 *
 * Use these in feature `api/` modules; wrap them with React Query hooks in `hooks/`.
 */
export const apiClient = axiosInstance;

const V1 = "/api/v1";

async function request<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  return unwrap(res.data);
}

export const v1 = {
  get: <T>(path: string, config?: object) => request<T>(apiClient.get(`${V1}${path}`, config)),
  post: <T>(path: string, body?: unknown, config?: object) =>
    request<T>(apiClient.post(`${V1}${path}`, body, config)),
  put: <T>(path: string, body?: unknown, config?: object) =>
    request<T>(apiClient.put(`${V1}${path}`, body, config)),
  patch: <T>(path: string, body?: unknown, config?: object) =>
    request<T>(apiClient.patch(`${V1}${path}`, body, config)),
  delete: <T>(path: string, config?: object) => request<T>(apiClient.delete(`${V1}${path}`, config)),
};
