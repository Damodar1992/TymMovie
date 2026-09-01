import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { setDefaultResultOrder } from 'node:dns';
import type { Plugin, ViteDevServer } from 'vite';

// Some Windows/home-router setups advertise IPv6 without it actually being
// routable, which makes Node's fetch (used by both our TMDb proxy and the
// Neon driver) hang/fail while other tools that fall back to IPv4 work
// fine. Prefer IPv4 for DNS resolution in this dev process only.
setDefaultResultOrder('ipv4first');

// Opt-in escape hatch for corporate/antivirus setups that intercept TLS
// with a locally-installed root CA Node doesn't trust (symptom:
// UNABLE_TO_VERIFY_LEAF_SIGNATURE / "unable to verify the first
// certificate"). The clean fix is `--use-system-ca` / NODE_USE_SYSTEM_CA=1
// (Node 23.8+ / 24.6+), but that's version-gated and not everyone can
// find/export the intercepting CA. Setting DEV_TLS_INSECURE=1 disables
// certificate verification for this dev process ONLY — it has no effect
// on the production build, since this plugin never runs there.
if (process.env.DEV_TLS_INSECURE === '1') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn(
    '[dev-api-plugin] DEV_TLS_INSECURE=1: TLS certificate verification is ' +
      'DISABLED for this dev server. Local development only — never set ' +
      'this in production.',
  );
}

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
  { methods: ['GET', 'POST'], pattern: /^\/api\/lists$/, modulePath: '/api/lists/index.ts' },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^\/api\/lists\/item$/, modulePath: '/api/lists/item.ts' },
  { methods: ['GET', 'DELETE'], pattern: /^\/api\/lists\/members$/, modulePath: '/api/lists/members.ts' },
  { methods: ['GET', 'POST', 'DELETE'], pattern: /^\/api\/lists\/invites$/, modulePath: '/api/lists/invites.ts' },
  { methods: ['GET'], pattern: /^\/api\/invites\/preview$/, modulePath: '/api/invites/preview.ts' },
  { methods: ['POST'], pattern: /^\/api\/invites\/accept$/, modulePath: '/api/invites/accept.ts' },
  { methods: ['GET', 'POST'], pattern: /^\/api\/lists\/movies$/, modulePath: '/api/lists/movies/index.ts' },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^\/api\/lists\/movies\/item$/, modulePath: '/api/lists/movies/item.ts' },
  { methods: ['PATCH', 'PUT'], pattern: /^\/api\/lists\/movies\/rating$/, modulePath: '/api/lists/movies/rating.ts' },
  { methods: ['GET'], pattern: /^\/api\/lists\/movies\/genres$/, modulePath: '/api/lists/movies/genres.ts' },
  { methods: ['GET'], pattern: /^\/api\/lists\/movies\/stats$/, modulePath: '/api/lists/movies/stats.ts' },
  { methods: ['GET'], pattern: /^\/api\/search$/, modulePath: '/api/search/index.ts' },
  { methods: ['GET'], pattern: /^\/api\/auth\/google-start$/, modulePath: '/api/auth/google-start.ts' },
  { methods: ['GET'], pattern: /^\/api\/auth\/google-callback$/, modulePath: '/api/auth/google-callback.ts' },
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
