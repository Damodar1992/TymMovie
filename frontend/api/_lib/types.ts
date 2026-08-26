import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Minimal shape of what Vercel's Node.js serverless runtime hands to a
 * function handler. We intentionally avoid depending on the `@vercel/node`
 * package (it's only needed for its TypeScript types) and instead describe
 * the handful of fields/methods we actually use. At runtime, Vercel's
 * platform (not this repo) is what parses the JSON body, query string and
 * cookies onto the request object.
 */
export interface ApiRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>;
  cookies: Record<string, string | undefined>;
  body: unknown;
}

export interface ApiResponse extends ServerResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  send(body: string): void;
}

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

export function readJsonBody<T = Record<string, unknown>>(req: ApiRequest): T {
  const body = req.body;
  if (body == null) return {} as T;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T;
    } catch {
      return {} as T;
    }
  }
  return body as T;
}

/** Fallback cookie parser, used only if the platform hasn't already populated req.cookies. */
export function parseCookieHeader(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

export function getCookies(req: ApiRequest): Record<string, string> {
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    return req.cookies as Record<string, string>;
  }
  return parseCookieHeader(req.headers.cookie);
}
