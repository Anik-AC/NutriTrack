import { v1 } from "@/lib/api/client";

export interface HealthStatus {
  status: string;
  uptime: number;
  env: string;
}

/** GET /api/v1/health — returns the unwrapped health payload. */
export const getHealth = () => v1.get<HealthStatus>("/health");
