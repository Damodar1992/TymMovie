# Graph Report - TymMovies  (2026-08-27)

## Corpus Check
- 70 files · ~125,861 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 398 nodes · 741 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b5c6c7df`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- TymMovie — Shared Movie & TV Tracker
- dependencies
- compilerOptions
- MobileFiltersScreen.tsx
- MobileMovieForm.tsx
- compilerOptions
- movies.ts
- auth.ts
- MobileShell.tsx
- compilerOptions
- SortRadioCard.tsx
- tsconfig.json
- _lib/tmdb.ts
- vercel.json
- dev-api-plugin.ts
- Деплой TymMovie на Vercel
- React + TypeScript + Vite
- migrate.mjs

## God Nodes (most connected - your core abstractions)
1. `describeError()` - 21 edges
2. `useAuth()` - 20 edges
3. `compilerOptions` - 20 edges
4. `compilerOptions` - 18 edges
5. `ApiResponse` - 15 edges
6. `requireSession()` - 15 edges
7. `MobileMovieForm()` - 14 edges
8. `compilerOptions` - 14 edges
9. `Movie` - 13 edges
10. `ApiRequest` - 12 edges

## Surprising Connections (you probably didn't know these)
- `MobileMovieForm()` --calls--> `useUpdateMovieMutation()`  [EXTRACTED]
  frontend/src/components/mobile/movie-form/MobileMovieForm.tsx → frontend/src/api/movies.ts
- `MobileMovieForm()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/components/mobile/movie-form/MobileMovieForm.tsx → frontend/src/auth/AuthContext.tsx
- `FiltersBarProps` --references--> `MovieStatus`  [EXTRACTED]
  frontend/src/components/FiltersBar.tsx → frontend/src/api/movies.ts
- `FormState` --references--> `MovieStatus`  [EXTRACTED]
  frontend/src/components/MovieFormModal.tsx → frontend/src/api/movies.ts
- `MobileMovieTileProps` --references--> `Movie`  [EXTRACTED]
  frontend/src/components/mobile/MobileMovieTile.tsx → frontend/src/api/movies.ts

## Import Cycles
- None detected.

## Communities (22 total, 4 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+21 more)

### Community 1 - "TymMovie — Shared Movie & TV Tracker"
Cohesion: 0.33
Nodes (5): Project layout, Setup, Stack, TymMovie — Shared Movie & TV Tracker, Why a backend now

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (29): axios, framer-motion, dependencies, axios, framer-motion, lucide-react, @neondatabase/serverless, react (+21 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+18 more)

### Community 5 - "MobileFiltersScreen.tsx"
Cohesion: 0.10
Nodes (17): ApplyFiltersCTA(), ApplyFiltersCTAProps, FilterSectionCard(), FilterSectionCardProps, FiltersHeader(), FiltersHeaderProps, GenreCloud(), GenreCloudProps (+9 more)

### Community 6 - "MobileMovieForm.tsx"
Cohesion: 0.18
Nodes (20): apiClient, useCreateMovieMutation(), buildPosterUrl(), getMovieDetails(), getTvDetails(), searchMulti(), TmdbContentType, TmdbDetails (+12 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+14 more)

### Community 8 - "movies.ts"
Cohesion: 0.07
Nodes (48): errorMessage(), LIBRARY_MEMBER_COUNT, LibraryStats, Movie, MOVIES_PAGE_SIZE, MoviesPageResult, MoviesQueryParams, MovieStatus (+40 more)

### Community 9 - "auth.ts"
Cohesion: 0.11
Nodes (41): handler(), handler(), handler(), handler(), checkAdminCredentials(), clearSessionCookie(), createSessionToken(), getAuthSecret() (+33 more)

### Community 10 - "MobileShell.tsx"
Cohesion: 0.08
Nodes (41): fetchMoviesPage(), useMoviesInfiniteQuery(), useMoviesQuery(), App(), AuthContext, AuthContextValue, AuthMode, AuthProvider() (+33 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch, noUnusedLocals (+10 more)

### Community 14 - "_lib/tmdb.ts"
Cohesion: 0.39
Nodes (8): authFetch(), getApiKey(), getMovieDetails(), getTvDetails(), searchMulti(), TmdbContentType, TmdbDetails, TmdbSearchResult

### Community 20 - "Деплой TymMovie на Vercel"
Cohesion: 0.40
Nodes (4): База данных, Деплой TymMovie на Vercel, Локальная разработка, Подключение репозитория к Vercel

### Community 21 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 22 - "migrate.mjs"
Cohesion: 0.47
Nodes (5): __dirname, main(), migrationsDir, splitStatements(), sql

## Knowledge Gaps
- **153 isolated node(s):** `MobileMovieFormProps`, `FormState`, `MetadataPreview`, `AuthContextValue`, `AuthMode` (+148 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `MobileShell.tsx` to `movies.ts`, `MobileMovieForm.tsx`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `MobileMovieFormProps`, `FormState`, `MetadataPreview` to the rest of the system?**
  _153 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `MobileFiltersScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._