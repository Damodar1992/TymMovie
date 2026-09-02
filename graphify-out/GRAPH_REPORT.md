# Graph Report - TymMovies  (2026-09-02)

## Corpus Check
- 109 files · ~141,451 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 550 nodes · 1175 edges · 29 communities (24 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b99cb733`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- TymMovies — Shared Movie & TV Tracker
- backfill-trailers.mjs
- dependencies
- compilerOptions
- MobileFiltersScreen.tsx
- google.ts
- compilerOptions
- Movie
- router.ts
- AuthContext.tsx
- compilerOptions
- SortRadioCard.tsx
- tsconfig.json
- tmdb.ts
- vercel.json
- check-vercel-function-count.mjs
- dev-api-plugin.ts
- Деплой TymMovies на Vercel
- React + TypeScript + Vite
- migrate.mjs
- backfill-lists.mjs
- MobileMovieForm.tsx
- FiltersHeader.tsx
- debug-trailer.mjs
- lists.ts
- backfill-title-ua.mjs

## God Nodes (most connected - your core abstractions)
1. `describeError()` - 29 edges
2. `requireUser()` - 25 edges
3. `ApiResponse` - 24 edges
4. `useAuth()` - 23 edges
5. `ApiRequest` - 21 edges
6. `compilerOptions` - 20 edges
7. `compilerOptions` - 18 edges
8. `readJsonBody()` - 15 edges
9. `Movie` - 14 edges
10. `compilerOptions` - 14 edges

## Surprising Connections (you probably didn't know these)
- `handler()` --calls--> `buildGoogleAuthUrl()`  [EXTRACTED]
  frontend/api/_routes/auth/google-start.ts → frontend/api/_lib/google.ts
- `handler()` --calls--> `exchangeCodeForProfile()`  [EXTRACTED]
  frontend/api/_routes/auth/google-callback.ts → frontend/api/_lib/google.ts
- `handler()` --calls--> `searchMulti()`  [EXTRACTED]
  frontend/api/_routes/search/index.ts → frontend/api/_lib/tmdb.ts
- `handlePost()` --calls--> `getMovieDetails()`  [EXTRACTED]
  frontend/api/_routes/lists/movies/index.ts → frontend/api/_lib/tmdb.ts
- `handlePost()` --calls--> `getTvDetails()`  [EXTRACTED]
  frontend/api/_routes/lists/movies/index.ts → frontend/api/_lib/tmdb.ts

## Import Cycles
- None detected.

## Communities (29 total, 5 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+19 more)

### Community 1 - "TymMovies — Shared Movie & TV Tracker"
Cohesion: 0.29
Nodes (6): Catalog-first search, How multi-user works, Project layout, Setup, Stack, TymMovies — Shared Movie & TV Tracker

### Community 2 - "backfill-trailers.mjs"
Cohesion: 0.48
Nodes (6): dryRun, fetchTrailerKey(), main(), pickBestTrailerKey(), sleep(), sql

### Community 3 - "dependencies"
Cohesion: 0.06
Nodes (31): axios, framer-motion, dependencies, axios, framer-motion, lucide-react, @neondatabase/serverless, react (+23 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+18 more)

### Community 5 - "MobileFiltersScreen.tsx"
Cohesion: 0.10
Nodes (17): ApplyFiltersCTA(), ApplyFiltersCTAProps, FilterSectionCard(), FilterSectionCardProps, GenreCloud(), GenreCloudProps, IconLabelPill(), IconLabelPillProps (+9 more)

### Community 6 - "google.ts"
Cohesion: 0.52
Nodes (6): buildGoogleAuthUrl(), exchangeCodeForProfile(), getClientId(), getClientSecret(), getRedirectUri(), GoogleProfile

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+14 more)

### Community 8 - "Movie"
Cohesion: 0.12
Nodes (23): Movie, Avatar(), AvatarProps, displayTitle(), formatScore(), MobileMovieTile(), MobileMovieTileProps, TILE_PALETTES (+15 more)

### Community 9 - "router.ts"
Cohesion: 0.06
Nodes (80): handler(), prepareRequest(), clearSessionCookie(), createOAuthState(), createSessionToken(), getAuthSecret(), getSession(), requireUser() (+72 more)

### Community 10 - "AuthContext.tsx"
Cohesion: 0.08
Nodes (34): apiBaseUrl, apiClient, InvitePreview, useAcceptInviteMutation(), useInvitePreviewQuery(), App(), AuthContext, AuthContextValue (+26 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch, noUnusedLocals (+10 more)

### Community 14 - "tmdb.ts"
Cohesion: 0.33
Nodes (10): authFetch(), getApiKey(), getMovieDetails(), getTvDetails(), pickBestTrailerKey(), searchMulti(), TmdbContentType, TmdbDetails (+2 more)

### Community 15 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, installCommand, outputDirectory, rewrites

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

### Community 24 - "MobileMovieForm.tsx"
Cohesion: 0.14
Nodes (27): errorMessage(), MovieStatus, useCreateMovieMutation(), useDeleteMovieMutation(), useListMembersQuery(), useSetRatingMutation(), useUpdateMovieMutation(), search() (+19 more)

### Community 26 - "debug-trailer.mjs"
Cohesion: 0.67
Nodes (3): authFetch(), contentType, main()

### Community 27 - "lists.ts"
Cohesion: 0.05
Nodes (62): AddMoviePayload, fetchMoviesPage(), Invite, LibraryStats, ListMember, ListRole, ListSummary, MOVIES_PAGE_SIZE (+54 more)

### Community 28 - "backfill-title-ua.mjs"
Cohesion: 0.53
Nodes (5): dryRun, fetchTitleUa(), main(), sleep(), sql

## Knowledge Gaps
- **189 isolated node(s):** `UserRow`, `UserDto`, `ListDto`, `ListMemberDto`, `InviteDto` (+184 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `lists.ts` to `MobileMovieForm.tsx`, `AuthContext.tsx`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `UserRow`, `UserDto`, `ListDto` to the rest of the system?**
  _189 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `MobileFiltersScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._