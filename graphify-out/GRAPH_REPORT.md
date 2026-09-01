# Graph Report - TymMovies  (2026-09-01)

## Corpus Check
- 98 files · ~138,184 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 507 nodes · 1063 edges · 25 communities (21 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e760b35a`
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
- dev-api-plugin.ts
- Деплой TymMovies на Vercel
- React + TypeScript + Vite
- migrate.mjs
- backfill-lists.mjs
- FormattedDatePicker.tsx

## God Nodes (most connected - your core abstractions)
1. `describeError()` - 29 edges
2. `requireUser()` - 27 edges
3. `useAuth()` - 23 edges
4. `ApiResponse` - 21 edges
5. `compilerOptions` - 20 edges
6. `ApiRequest` - 18 edges
7. `compilerOptions` - 18 edges
8. `readJsonBody()` - 15 edges
9. `Movie` - 14 edges
10. `compilerOptions` - 14 edges

## Surprising Connections (you probably didn't know these)
- `handler()` --calls--> `exchangeCodeForProfile()`  [EXTRACTED]
  frontend/api/auth/google-callback.ts → frontend/api/_lib/google.ts
- `handler()` --calls--> `searchMulti()`  [EXTRACTED]
  frontend/api/search/index.ts → frontend/api/_lib/tmdb.ts
- `handlePost()` --calls--> `getMovieDetails()`  [EXTRACTED]
  frontend/api/lists/movies/index.ts → frontend/api/_lib/tmdb.ts
- `handlePost()` --calls--> `getTvDetails()`  [EXTRACTED]
  frontend/api/lists/movies/index.ts → frontend/api/_lib/tmdb.ts
- `handler()` --calls--> `describeError()`  [EXTRACTED]
  frontend/api/auth/google-start.ts → frontend/api/_lib/types.ts

## Import Cycles
- None detected.

## Communities (25 total, 4 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+21 more)

### Community 1 - "TymMovies — Shared Movie & TV Tracker"
Cohesion: 0.29
Nodes (6): Catalog-first search, How multi-user works, Project layout, Setup, Stack, TymMovies — Shared Movie & TV Tracker

### Community 2 - "lists.ts"
Cohesion: 0.06
Nodes (52): AddMoviePayload, fetchMoviesPage(), Invite, LibraryStats, ListMember, ListRole, ListSummary, MOVIES_PAGE_SIZE (+44 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (29): axios, framer-motion, dependencies, axios, framer-motion, lucide-react, @neondatabase/serverless, react (+21 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+18 more)

### Community 5 - "MobileFiltersScreen.tsx"
Cohesion: 0.07
Nodes (27): MovieStatus, FiltersBar(), FiltersBarProps, ApplyFiltersCTA(), ApplyFiltersCTAProps, FilterSectionCard(), FilterSectionCardProps, FiltersHeader() (+19 more)

### Community 6 - "google-start.ts"
Cohesion: 0.35
Nodes (9): firstQueryValue(), handler(), createOAuthState(), buildGoogleAuthUrl(), exchangeCodeForProfile(), getClientId(), getClientSecret(), getRedirectUri() (+1 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+14 more)

### Community 8 - "MobileMoviesScreen.tsx"
Cohesion: 0.09
Nodes (48): errorMessage(), Movie, useCreateMovieMutation(), useDeleteMovieMutation(), useListMembersQuery(), useSetRatingMutation(), useUpdateMovieMutation(), search() (+40 more)

### Community 9 - "db.ts"
Cohesion: 0.07
Nodes (72): firstQueryValue(), handler(), handler(), handler(), AcceptInviteBody, handler(), firstQueryValue(), handler() (+64 more)

### Community 10 - "AuthContext.tsx"
Cohesion: 0.09
Nodes (28): apiBaseUrl, apiClient, InvitePreview, useAcceptInviteMutation(), useInvitePreviewQuery(), App(), AuthContext, AuthContextValue (+20 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch, noUnusedLocals (+10 more)

### Community 14 - "_lib/tmdb.ts"
Cohesion: 0.39
Nodes (8): authFetch(), getApiKey(), getMovieDetails(), getTvDetails(), searchMulti(), TmdbContentType, TmdbDetails, TmdbSearchResult

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

### Community 24 - "FormattedDatePicker.tsx"
Cohesion: 0.60
Nodes (3): FormattedDatePicker(), FormattedDatePickerProps, isoToDmy()

## Knowledge Gaps
- **175 isolated node(s):** `UserRow`, `UserDto`, `ListDto`, `ListMemberDto`, `InviteDto` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `MobileMoviesScreen.tsx` to `AuthContext.tsx`, `lists.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `UserRow`, `UserDto`, `ListDto` to the rest of the system?**
  _175 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `lists.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06151062867480778 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._