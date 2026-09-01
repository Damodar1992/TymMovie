import type { ApiRequest, ApiResponse } from './_lib/types.js';
import { dispatchApiRequest } from './_lib/router.js';

function segmentsFromQuery(path: string | string[] | undefined): string[] {
  if (path == null) return [];
  return Array.isArray(path) ? path : [path];
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const segments = segmentsFromQuery(req.query.path);
  const pathname = segments.length > 0 ? `/api/${segments.join('/')}` : '/api';
  const method = (req.method ?? 'GET').toUpperCase();
  await dispatchApiRequest(req, res, pathname, method);
}
