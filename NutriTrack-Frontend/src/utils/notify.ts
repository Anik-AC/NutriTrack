import { toast as sonnerToast } from "sonner";

export type NotifyStatus =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading"
  | "default";

export interface NotifyOptions {
  title: string;
  description?: string;
  status?: NotifyStatus;
  /** Chakra-compatible fields kept for call-site parity; mapped where supported. */
  duration?: number;
  isClosable?: boolean;
  position?: string;
}

/**
 * Drop-in replacement for Chakra UI's `useToast()` callback, backed by Sonner.
 * Accepts the same `{ title, description, status, duration, ... }` shape so existing
 * call sites (and their tests) need no structural changes. The `<Toaster />` lives in
 * `main.tsx`; `position` is configured there globally rather than per-toast.
 */
export function notify({ title, description, status = "info", duration }: NotifyOptions) {
  const options =
    description !== undefined || duration !== undefined
      ? { description, duration }
      : undefined;

  switch (status) {
    case "success":
      return sonnerToast.success(title, options);
    case "error":
      return sonnerToast.error(title, options);
    case "warning":
      return sonnerToast.warning(title, options);
    case "loading":
      return sonnerToast.loading(title, options);
    default:
      return sonnerToast(title, options);
  }
}
