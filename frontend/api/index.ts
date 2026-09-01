import type { ApiRequest, ApiResponse } from './_lib/types.js';
import { dispatchApiRequest } from './_lib/router.js';

function prepareRequest(req: ApiRequest): string {
  const rawUrl = req.url ?? '/';
  const url = new URL(rawUrl, 'http://localhost');

  for (const [key, value] of url.searchParams.entries()) {
    if (req.query[key] === undefined) {
      req.query[key] = value;
    }
  }

  return url.pathname;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const pathname = prepareRequest(req);
  const method = (req.method ?? 'GET').toUpperCase();
  await dispatchApiRequest(req, res, pathname, method);
}
