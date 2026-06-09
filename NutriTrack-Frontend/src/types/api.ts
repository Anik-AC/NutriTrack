/**
 * Shared TypeScript types for API responses.
 *
 * Mirrors the backend's standardized envelope (Phase 0.2):
 *   success: { success: true,  data: T }
 *   error:   { success: false, error: { code, message, details? } }
 *
 * New (v1) endpoints return these shapes. Use `ApiResponse<T>` for responses you
 * unwrap manually, or `unwrap()` to throw on error and return `data`.
 */

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const isApiSuccess = <T>(res: ApiResponse<T>): res is ApiSuccess<T> => res.success === true;

/** Narrow an ApiResponse to its data, throwing the error otherwise. */
export function unwrap<T>(res: ApiResponse<T>): T {
  if (isApiSuccess(res)) return res.data;
  const err = new Error(res.error.message) as Error & { code?: string; details?: unknown };
  err.code = res.error.code;
  err.details = res.error.details;
  throw err;
}

/** Shared domain types used across features (extend as features are built out). */
export type UserType = "customer" | "coach" | "admin";

export interface AuthedUser {
  userid: string;
  token: string;
  name: string;
  profileCompleted: boolean;
  userType: UserType;
  verified: boolean;
  tokenExpiry: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
