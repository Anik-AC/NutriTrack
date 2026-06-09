# Chakra UI → shadcn/ui + Tailwind Migration Map

Reference for Phase 0.1. Foundation: shadcn/ui (Radix, `new-york` style), Tailwind v4,
class-based dark mode via `next-themes`, toasts via `sonner`.

## Layout & typography primitives → Tailwind utility classes

| Chakra | Replacement |
| --- | --- |
| `<Box>` | `<div className="...">` |
| `<Flex>` | `<div className="flex ...">` |
| `<Stack>` | `<div className="flex flex-col gap-... ">` (Chakra `spacing` → `gap-`) |
| `<HStack>` | `<div className="flex flex-row items-center gap-...">` |
| `<VStack>` | `<div className="flex flex-col items-center gap-...">` |
| `<Grid>` / `<GridItem>` | `<div className="grid ...">` / `<div className="col-span-...">` |
| `<SimpleGrid columns={n}>` | `<div className="grid grid-cols-{n} gap-...">` |
| `<Container>` | `<div className="mx-auto w-full max-w-... px-...">` |
| `<Spacer>` | `flex-1` on a spacer `div`, or `justify-between` on parent |
| `<Divider>` | `<Separator />` (`@/Components/ui/separator`) or `<hr>` |
| `<Text>` | `<p>` / `<span>` with Tailwind text classes |
| `<Heading>` | `<h1..h6>` with Tailwind text classes |
| `<Link>` (Chakra) | `<a>` (Tailwind) or React Router `<Link>` for routing |
| `<Image>` | `<img>` |
| `<Icon as={X}>` / `chakra(...)` | lucide-react icon or raw SVG + Tailwind |

### Chakra style props → Tailwind (common)
`p/px/py/m/mx/my` → `p-/px-/...` · `bg` → `bg-[...]` · `color` → `text-[...]` ·
`fontSize` → `text-*` · `fontWeight` → `font-*` · `rounded`/`borderRadius` → `rounded-*` ·
`w/h` → `w-*/h-*` · `align`/`justify` → `items-*`/`justify-*` · `gap`/`spacing` → `gap-*`.
Responsive object `{ base, md }` → `class md:class`.

## Form components → shadcn/ui (`@/Components/ui/*`)

| Chakra | shadcn |
| --- | --- |
| `Input` | `input` |
| `InputGroup` + `InputRightElement` | relative wrapper `div` + absolutely-positioned element |
| `Textarea` | `textarea` |
| `Select` | `select` |
| `Checkbox` | `checkbox` |
| `Switch` | `switch` |
| `FormControl` / `FormLabel` | `label` + Tailwind layout |
| `Button` / `IconButton` | `button` (`size="icon"` for IconButton) |
| `Progress` | `progress` |
| `Slider` + `SliderTrack/FilledTrack/Thumb` | `slider` |

## Overlay components → shadcn/ui

| Chakra | shadcn |
| --- | --- |
| `Modal` + `ModalOverlay/Content/Header/Body/Footer/CloseButton` | `dialog` (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`) |
| `Drawer` + `DrawerContent` | `sheet` (`Sheet`, `SheetContent`, ...) |
| `Menu` + `MenuButton/List/Item/Divider` | `dropdown-menu` (`DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`) |
| `Popover` | `popover` |
| `Tooltip` | `tooltip` (provider mounted in `main.tsx`) |
| `Collapse` | `collapsible` |
| `Accordion` + `AccordionItem/Button/Panel` | `accordion` |

## Feedback & data display → shadcn/ui

| Chakra | shadcn |
| --- | --- |
| `useToast()` | `import { toast } from "sonner"` → `toast.success/error(...)`. `<Toaster/>` in `main.tsx` |
| `Alert` | `alert` |
| `Spinner` | lucide `Loader2` with `animate-spin` (or `skeleton`) |
| `Skeleton` | `skeleton` |
| `Table` + `Thead/Tbody/Tr/Th/Td/TableContainer` | `table` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) |
| `Badge` | `badge` |
| `Avatar` | `avatar` (`Avatar`, `AvatarImage`, `AvatarFallback`) |
| `Card` | `card` |
| `Stat` (`@chakra-ui/stat`) | compose `card` + Tailwind text |

## Hooks / theme

| Chakra | Replacement |
| --- | --- |
| `useDisclosure()` | `@/hooks/use-disclosure` (same `isOpen/onOpen/onClose/onToggle`) |
| `useColorMode()` / `useColorModeValue()` | `next-themes` `useTheme()` + Tailwind `dark:` variants |
| `ChakraProvider` | `ThemeProvider` (class strategy) — removed from `main.tsx` once migration completes |

## Icons

| `@chakra-ui/icons` | lucide-react |
| --- | --- |
| `HamburgerIcon` | `Menu` |
| `CloseIcon` | `X` |
| `ChevronDownIcon` | `ChevronDown` |
