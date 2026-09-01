import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { setDefaultResultOrder } from 'node:dns';
import type { Plugin, ViteDevServer } from 'vite';
import { apiRoutes } from './api/_lib/router';

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
// Shared with production via api/_lib/router.ts. Vercel deploys a single
// catch-all function (api/[[...path]].ts); local dev loads the same handlers
// through Vite's ssrLoadModule.
function toDevModulePath(modulePath: string): string {
  return modulePath.replace(/^\.\.\//, '/api/').replace(/\.js$/, '.ts');
}

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
        const route = apiRoutes.find((r) => r.pattern.test(pathname));

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
          const query: Record<string, string> = Object.fromEntries(
            new URL(url, 'http://localhost').searchParams,
          );
          const bodyText =
            method === 'POST' || method === 'PATCH' ? await readRequestBody(req) : '';

          const apiReq = Object.assign(req, {
            query,
            cookies: {},
            body: bodyText,
          });
          const apiRes = attachResponseHelpers(res);

          const mod = await server.ssrLoadModule(toDevModulePath(route.modulePath));
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
