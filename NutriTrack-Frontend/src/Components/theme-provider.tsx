import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

/**
 * App-wide theme provider using the Tailwind `class` strategy.
 * Wraps next-themes so dark mode is toggled by adding/removing the
 * `dark` class on <html>, matching the shadcn/ui + Tailwind v4 setup.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
