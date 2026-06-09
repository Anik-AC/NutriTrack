# `features/` — feature-first frontend structure

Each feature is a self-contained folder co-locating its UI, data, and types:

```
features/<feature>/
├── api/          # functions that call the backend (use @/lib/api/client `v1`)
├── hooks/        # React Query hooks wrapping api/ (useXxx)
├── types/        # feature-specific TypeScript types
├── components/   # feature-specific components
└── index.ts      # public barrel — import the feature via "@/features/<feature>"
```

**Reference implementation:** [`system/`](./system) wires the full stack end-to-end —
`useHealth()` (React Query) → `getHealth()` (`v1` client) → `{ success, data }` unwrap → typed `HealthStatus`.
Copy that shape when building a new feature.

## Shared building blocks
- `@/lib/api/client` — `apiClient` (axios w/ auth + auto token-refresh) and `v1.get/post/...` (unwraps the envelope).
- `@/lib/query-client` — the app `QueryClient` (mounted in `main.tsx`).
- `@/types/api` — `ApiResponse<T>`, `ApiSuccess<T>`, `ApiError`, `unwrap()`, shared domain types.

## Migration map (existing code → target feature)

These folders are **established** now; existing code is migrated into them incrementally as
features are rebuilt under `/api/v1` (Phase 1+). Current locations:

| Feature | Current code (to migrate) |
| --- | --- |
| `auth` | `Components/Sections/Authentication/*`, `Pages/{Login,ResetPassword}`, `Pages/CustomerPages/{OtpVerification,Verify}` |
| `nutrition` | `Pages/CustomerPages/{TrackPage,TrackSearch,TrackFoodItem}`, `Services/nutritionixAPI` |
| `meals` | `Pages/CustomerPages/{MealConsumedPage,CreateCustomFoodPage,TrackCustomFoodPage}` |
| `recipes` | `Pages/CustomerPages/RecipePage`, `Services/recipeAPI` |
| `dashboard` | `Pages/CustomerPages/{Dashboard,DailyDashboardPage}`, `Components/Sections/CustomerSections/DailyPieChart` |
| `history` | `Pages/CustomerPages/HistoricalViewPage`, `Components/Sections/CustomerSections/{HistoricalLineGraph,HistoricalFilterForm}`, `Services/historicalViewServices` |
| `booking` | `Pages/CustomerPages/{BookCoach,Appointments}` |
| `coach` | `Pages/CoachPages/*`, `Components/Sections/CoachSections/CoachNav` |
| `admin` | `Pages/AdminPages/*`, `Components/Sections/AdminSections/Sidebar` |
| `profile` | `Pages/CustomerPages/ProfileSetup` |
| `system` | health/status (reference implementation — already here) |
