import { QueryClient } from "@tanstack/react-query";

/**
 * App-wide React Query client. Mounted via QueryClientProvider in main.tsx.
 * Defaults tuned for a dashboard app: data is fresh for a minute, retries once,
 * and we don't refetch on every window focus (avoids hammering the API).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      gcTime: 5 * 60_000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
