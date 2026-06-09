import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../api/health";

/**
 * Reference React Query hook — proves the full data stack end-to-end:
 * React Query → v1 client → `{ success, data }` unwrap → typed result.
 * Use this as the template for feature data hooks.
 */
export const useHealth = () =>
  useQuery({
    queryKey: ["system", "health"],
    queryFn: getHealth,
  });
