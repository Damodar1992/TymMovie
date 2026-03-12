/**
 * Local API server for Vite dev: runs the same handlers as api/* without Vercel.
 * Run: npx tsx server/dev-api.ts (from frontend dir)
 */
import http from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load .env (key=value; value is everything after first = so connection strings with = work)
try {
  const env = readFileSync(join(root, '.env'), 'utf8');
  env.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key) process.env[key] = value;
  });
} catch {}

const PORT = Number(process.env.API_PORT) || 3001;
const base = `http://localhost:${PORT}`;

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }
): Promise<void> {
  const url = new URL(req.url || '/', base);
  const pathname = url.pathname;
  const method = req.method || 'GET';
  // #region agent log
  fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
    body: JSON.stringify({
      sessionId: 'fdb080',
      runId: 'dev-api-request',
      hypothesisId: 'H1',
      location: 'server/dev-api.ts:handleRequest',
      message: 'Request received by API server',
      data: { pathname, method },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await readBody(req);
  }

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v != null) headers.set(k, Array.isArray(v) ? v[0] : v);
  }

  const request = new Request(base + (req.url || ''), {
    method,
    headers,
    body: body !== undefined && body !== '' ? body : undefined,
  });

  let handler: (r: Request) => Promise<Response>;
  if (pathname === '/api/movies' || pathname === '/api/movies/') {
    const mod = await import('../api/movies/index.ts');
    handler = (mod.default ?? (mod as { handler?: typeof mod.default }).handler)!;
  } else if (pathname === '/api/movies/enrich') {
    const mod = await import('../api/movies/enrich.ts');
    handler = mod.default;
  } else if (/^\/api\/movies\/[^/]+$/.test(pathname)) {
    const mod = await import('../api/movies/[id].ts');
    handler = mod.default;
  } else {
    // #region agent log
    fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
      body: JSON.stringify({
        sessionId: 'fdb080',
        runId: 'dev-api-404',
        hypothesisId: 'H1',
        location: 'server/dev-api.ts:no-route',
        message: 'API server returning 404 (path not matched)',
        data: { pathname, method },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not found' }));
    return;
  }

  try {
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(await response.text());
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Internal server error' }));
  }
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`API server http://localhost:${PORT} (for Vite proxy)`);
});
