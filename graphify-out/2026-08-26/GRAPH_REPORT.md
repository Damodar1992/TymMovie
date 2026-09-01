# Graph Report - TymMovies  (2026-08-26)

## Corpus Check
- 50 files · ~119,436 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 309 nodes · 529 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `38fe1345`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- TymMovie — Shared Movie & TV Tracker
- AuthContext.tsx
- dependencies
- compilerOptions
- MobileFiltersScreen.tsx
- MobileMovieForm.tsx
- compilerOptions
- Movie
- movies.ts
- MobileMoviesScreen.tsx
- MobileShell.tsx
- SortRadioCard.tsx
- tsconfig.json
- client.ts
- vercel.json
- Деплой TymMovie на Vercel
- React + TypeScript + Vite

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 20 edges
2. `compilerOptions` - 20 edges
3. `compilerOptions` - 18 edges
4. `Movie` - 14 edges
5. `MobileMovieForm()` - 14 edges
6. `useUpdateMovieMutation()` - 11 edges
7. `useMoviesFilters()` - 11 edges
8. `searchMulti()` - 10 edges
9. `MovieFormModal()` - 10 edges
10. `getMovieDetails()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `DesktopLoginPage()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/components/LoginPage.tsx → frontend/src/auth/AuthContext.tsx
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/App.tsx → frontend/src/auth/AuthContext.tsx
- `FiltersBarProps` --references--> `MovieStatus`  [EXTRACTED]
  frontend/src/components/FiltersBar.tsx → frontend/src/api/movies.ts
- `FormState` --references--> `MovieStatus`  [EXTRACTED]
  frontend/src/components/mobile/movie-form/MobileMovieForm.tsx → frontend/src/api/movies.ts
- `FormState` --references--> `MovieStatus`  [EXTRACTED]
  frontend/src/components/MovieFormModal.tsx → frontend/src/api/movies.ts

## Import Cycles
- None detected.

## Communities (22 total, 4 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+21 more)

### Community 1 - "TymMovie — Shared Movie & TV Tracker"
Cohesion: 0.40
Nodes (4): Project layout, Setup, Stack, TymMovie — Shared Movie & TV Tracker

### Community 2 - "AuthContext.tsx"
Cohesion: 0.15
Nodes (17): App(), AUTH_STORAGE_KEY, AuthContext, AuthContextValue, AuthMode, AuthProvider(), getStoredMode(), writeSession() (+9 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (26): axios, framer-motion, dependencies, axios, framer-motion, lucide-react, @neondatabase/serverless, react (+18 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+18 more)

### Community 5 - "MobileFiltersScreen.tsx"
Cohesion: 0.10
Nodes (17): ApplyFiltersCTA(), ApplyFiltersCTAProps, FilterSectionCard(), FilterSectionCardProps, FiltersHeader(), FiltersHeaderProps, GenreCloud(), GenreCloudProps (+9 more)

### Community 6 - "MobileMovieForm.tsx"
Cohesion: 0.18
Nodes (23): authFetch(), buildPosterUrl(), getApiKey(), getMovieDetails(), getTvDetails(), loadImageConfig(), searchMulti(), TmdbContentType (+15 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+14 more)

### Community 8 - "Movie"
Cohesion: 0.13
Nodes (18): Movie, displayTitle(), formatScore(), MobileMovieTile(), MobileMovieTileProps, TILE_PALETTES, tilePalette(), TitleLang (+10 more)

### Community 9 - "movies.ts"
Cohesion: 0.13
Nodes (23): computeUserAvgRating(), dateToYYYYMMDD(), db, ensureMoviesSchema(), getSql(), MovieRow, normalizeTitle(), rowToMovie() (+15 more)

### Community 10 - "MobileMoviesScreen.tsx"
Cohesion: 0.13
Nodes (26): fetchMoviesPage(), useMoviesInfiniteQuery(), useMoviesQuery(), useAuth(), EmptyState(), EmptyStateProps, MobileFiltersScreen(), formatScore() (+18 more)

### Community 11 - "MobileShell.tsx"
Cohesion: 0.16
Nodes (13): IOSInstallHint(), shouldShow(), menuItems, MobileShell(), MobileTab, readTab(), tabOrder, IconComponentType (+5 more)

### Community 20 - "Деплой TymMovie на Vercel"
Cohesion: 0.40
Nodes (4): База данных, Деплой TymMovie на Vercel, Локальная разработка, Подключение репозитория к Vercel

### Community 21 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **122 isolated node(s):** `MovieRow`, `TmdbContentType`, `name`, `private`, `version` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `MobileMoviesScreen.tsx` to `AuthContext.tsx`, `MobileShell.tsx`, `MobileMovieForm.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `MovieRow`, `TmdbContentType`, `name` to the rest of the system?**
  _122 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `MobileFiltersScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._