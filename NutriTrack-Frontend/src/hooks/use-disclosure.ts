import { useCallback, useState } from "react"

export interface UseDisclosureReturn {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onToggle: () => void
  setOpen: (open: boolean) => void
}

/**
 * Lightweight replacement for Chakra UI's `useDisclosure`.
 * Manages open/close state for modals, drawers, popovers, etc.
 */
export function useDisclosure(defaultIsOpen = false): UseDisclosureReturn {
  const [isOpen, setOpen] = useState(defaultIsOpen)

  const onOpen = useCallback(() => setOpen(true), [])
  const onClose = useCallback(() => setOpen(false), [])
  const onToggle = useCallback(() => setOpen((prev) => !prev), [])

  return { isOpen, onOpen, onClose, onToggle, setOpen }
}
