# Graph Report - TymMovies  (2026-09-01)

## Corpus Check
- 102 files · ~138,704 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 527 nodes · 1092 edges · 25 communities (21 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b1eca3fe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- TymMovies — Shared Movie & TV Tracker
- lists.ts
- dependencies
- compilerOptions
- MobileFiltersScreen.tsx
- google-start.ts
- compilerOptions
- MobileMoviesScreen.tsx
- db.ts
- AuthContext.tsx
- compilerOptions
- SortRadioCard.tsx
- tsconfig.json
- _lib/tmdb.ts
- vercel.json
- check-vercel-function-count.mjs
- dev-api-plugin.ts
- Деплой TymMovies на Vercel
- React + TypeScript + Vite
- migrate.mjs
- backfill-lists.mjs
- FiltersHeader.tsx

## God Nodes (most connected - your core abstractions)
1. `describeError()` - 29 edges
2. `requireUser()` - 25 edges
3. `ApiResponse` - 23 edges
4. `useAuth()` - 23 edges
5. `ApiRequest` - 20 edges
6. `compilerOptions` - 20 edges
7. `compilerOptions` - 18 edges
8. `readJsonBody()` - 15 edges
9. `Movie` - 14 edges
10. `compilerOptions` - 14 edges

## Surprising Connections (you probably didn't know these)
- `handler()` --calls--> `exchangeCodeForProfile()`  [EXTRACTED]
  frontend/api/_routes/auth/google-callback.ts → frontend/api/_lib/google.ts
- `handler()` --calls--> `describeError()`  [EXTRACTED]
  frontend/api/_routes/auth/google-start.ts → frontend/api/_lib/types.ts
- `handlePost()` --calls--> `getMovieDetails()`  [EXTRACTED]
  frontend/api/_routes/lists/movies/index.ts → frontend/api/_lib/tmdb.ts
- `handlePost()` --calls--> `getTvDetails()`  [EXTRACTED]
  frontend/api/_routes/lists/movies/index.ts → frontend/api/_lib/tmdb.ts
- `handler()` --calls--> `searchMulti()`  [EXTRACTED]
  frontend/api/_routes/search/index.ts → frontend/api/_lib/tmdb.ts

## Import Cycles
- None detected.

## Communities (25 total, 4 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+19 more)

### Community 1 - "TymMovies — Shared Movie & TV Tracker"
Cohesion: 0.29
Nodes (6): Catalog-first search, How multi-user works, Project layout, Setup, Stack, TymMovies — Shared Movie & TV Tracker

### Community 2 - "lists.ts"
Cohesion: 0.05
Nodes (62): AddMoviePayload, fetchMoviesPage(), Invite, LibraryStats, ListMember, ListRole, ListSummary, MOVIES_PAGE_SIZE (+54 more)

### Community 3 - "dependencies"
Cohesion: 0.06
Nodes (31): axios, framer-motion, dependencies, axios, framer-motion, lucide-react, @neondatabase/serverless, react (+23 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+18 more)

### Community 5 - "MobileFiltersScreen.tsx"
Cohesion: 0.11
Nodes (15): ApplyFiltersCTA(), ApplyFiltersCTAProps, FilterSectionCard(), FilterSectionCardProps, GenreCloud(), GenreCloudProps, IconLabelPill(), IconLabelPillProps (+7 more)

### Community 6 - "google-start.ts"
Cohesion: 0.35
Nodes (9): createOAuthState(), buildGoogleAuthUrl(), exchangeCodeForProfile(), getClientId(), getClientSecret(), getRedirectUri(), GoogleProfile, firstQueryValue() (+1 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+14 more)

### Community 8 - "MobileMoviesScreen.tsx"
Cohesion: 0.07
Nodes (55): errorMessage(), Movie, useCreateMovieMutation(), useDeleteMovieMutation(), useListMembersQuery(), useSetRatingMutation(), useUpdateMovieMutation(), search() (+47 more)

### Community 9 - "db.ts"
Cohesion: 0.07
Nodes (72): clearSessionCookie(), createSessionToken(), getAuthSecret(), getSession(), requireUser(), safeEqual(), setSessionCookie(), sign() (+64 more)

### Community 10 - "AuthContext.tsx"
Cohesion: 0.09
Nodes (29): apiBaseUrl, apiClient, InvitePreview, useAcceptInviteMutation(), useInvitePreviewQuery(), App(), AuthContext, AuthContextValue (+21 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch, noUnusedLocals (+10 more)

### Community 14 - "_lib/tmdb.ts"
Cohesion: 0.39
Nodes (8): authFetch(), getApiKey(), getMovieDetails(), getTvDetails(), searchMulti(), TmdbContentType, TmdbDetails, TmdbSearchResult

### Community 15 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, installCommand, outputDirectory, rewrites

### Community 19 - "dev-api-plugin.ts"
Cohesion: 0.18
Nodes (6): ApiRoute, apiRoutes, dispatchApiRequest(), handler(), segmentsFromQuery(), devApiPlugin()

### Community 20 - "Деплой TymMovies на Vercel"
Cohesion: 0.29
Nodes (6): Google OAuth клиент, База данных, Деплой TymMovies на Vercel, Локальная разработка, Перенос старых данных (Bohdan / Inna), Подключение репозитория к Vercel

### Community 21 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 22 - "migrate.mjs"
Cohesion: 0.47
Nodes (5): __dirname, main(), migrationsDir, splitStatements(), sql

### Community 23 - "backfill-lists.mjs"
Cohesion: 0.44
Nodes (8): args, ensureList(), ensureMember(), main(), sql, upsertListMovie(), upsertRating(), upsertUser()

## Knowledge Gaps
- **184 isolated node(s):** `ApiRoute`, `AcceptInviteBody`, `CreateListBody`, `CreateInviteBody`, `UpdateListBody` (+179 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `MobileMoviesScreen.tsx` to `AuthContext.tsx`, `lists.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `ApiResponse` connect `db.ts` to `dev-api-plugin.ts`, `google-start.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `ApiRoute`, `AcceptInviteBody`, `CreateListBody` to the rest of the system?**
  _184 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `lists.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05094905094905095 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._