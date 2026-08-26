import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

/**
 * Dev-only Vite plugin that serves frontend/api/* the same way Vercel does
 * in production, so `npm run dev` alone is enough for local development —
 * no `vercel dev` / Vercel CLI / Vercel account needed. Never runs during
 * `vite build` (apply: 'serve'), and none of this ships in the production
 * bundle — Vercel builds api/* independently from its own platform code.
 */

// --- .env loading -----------------------------------------------------
// Vite only exposes VITE_-prefixed vars to the client; these server-only
// vars (DATABASE_URL, TMDB_API_KEY, ADMIN_LOGIN, ADMIN_PASSWORD,
// AUTH_SECRET) need to land in process.env for the api/* handlers to read,
// same as Vercel does for a deployed function.
function loadDotEnv(root: string) {
  const envPath = path.join(root, '.env');
  if (!existsSync(envPath)) return;
  const contents = readFileSync(envPath, 'utf8');
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Don't clobber a value already set in the real environment.
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

// --- request/response shims --------------------------------------------
// Vercel's Node runtime hands handlers a request with .query/.cookies/.body
// already parsed, and a response with .status()/.json()/.send(). Vite's dev
// server gives us plain Node req/res, so we adapt them here. See
// api/_lib/types.ts — getCookies() already falls back to parsing the raw
// `cookie` header when req.cookies isn't set, so cookies need no shim.
function attachResponseHelpers(res: import('node:http').ServerResponse) {
  const shimmed = res as typeof res & {
    status(code: number): typeof res;
    json(body: unknown): void;
    send(body: string): void;
  };
  shimmed.status = (code: number) => {
    shimmed.statusCode = code;
    return shimmed;
  };
  shimmed.json = (body: unknown) => {
    shimmed.setHeader('Content-Type', 'application/json; charset=utf-8');
    shimmed.end(JSON.stringify(body));
  };
  shimmed.send = (body: string) => {
    shimmed.end(body);
  };
  return shimmed;
}

function readRequestBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// --- routing -------------------------------------------------------------
// Mirrors Vercel's filesystem-based /api routing for exactly the routes
// this project has. Static paths are listed before the dynamic
// /api/movies/:id pattern, matching Vercel's own static-beats-dynamic
// precedence.
const routes: {
  methods: string[];
  pattern: RegExp;
  modulePath: string;
  params?: (match: RegExpMatchArray) => Record<string, string>;
}[] = [
  { methods: ['GET', 'POST'], pattern: /^\/api\/movies$/, modulePath: '/api/movies/index.ts' },
  { methods: ['GET'], pattern: /^\/api\/movies\/stats$/, modulePath: '/api/movies/stats.ts' },
  { methods: ['GET'], pattern: /^\/api\/movies\/genres$/, modulePath: '/api/movies/genres.ts' },
  {
    methods: ['GET', 'PATCH', 'DELETE'],
    pattern: /^\/api\/movies\/([^/]+)$/,
    modulePath: '/api/movies/[id].ts',
    params: (m) => ({ id: decodeURIComponent(m[1]) }),
  },
  { methods: ['GET'], pattern: /^\/api\/tmdb\/search$/, modulePath: '/api/tmdb/search.ts' },
  { methods: ['GET'], pattern: /^\/api\/tmdb\/details$/, modulePath: '/api/tmdb/details.ts' },
  { methods: ['POST'], pattern: /^\/api\/auth\/login$/, modulePath: '/api/auth/login.ts' },
  { methods: ['POST'], pattern: /^\/api\/auth\/guest$/, modulePath: '/api/auth/guest.ts' },
  { methods: ['POST'], pattern: /^\/api\/auth\/logout$/, modulePath: '/api/auth/logout.ts' },
  { methods: ['GET'], pattern: /^\/api\/auth\/session$/, modulePath: '/api/auth/session.ts' },
];

export function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-plugin',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      loadDotEnv(server.config.root);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/')) return next();

        const pathname = url.split('?')[0];
        const method = (req.method ?? 'GET').toUpperCase();
        const route = routes.find((r) => r.pattern.test(pathname));

        if (!route) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
        }
        if (!route.methods.includes(method)) {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const match = pathname.match(route.pattern);
          const query: Record<string, string> = Object.fromEntries(
            new URL(url, 'http://localhost').searchParams,
          );
          if (match && route.params) Object.assign(query, route.params(match));

          const bodyText =
            method === 'POST' || method === 'PATCH' ? await readRequestBody(req) : '';

          const apiReq = Object.assign(req, {
            query,
            cookies: {},
            body: bodyText,
          });
          const apiRes = attachResponseHelpers(res);

          const mod = await server.ssrLoadModule(route.modulePath);
          const handler = mod.default as (
            req: typeof apiReq,
            res: typeof apiRes,
          ) => Promise<void> | void;
          await handler(apiReq, apiRes);
        } catch (err) {
          console.error(`[dev-api-plugin] ${method} ${pathname} failed:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal dev-server error' }));
          }
        }
      });
    },
  };
}
