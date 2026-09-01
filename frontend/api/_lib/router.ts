import type { ApiRequest, ApiResponse } from './types.js';

export type ApiRoute = {
  methods: string[];
  pattern: RegExp;
  modulePath: string;
};

export const apiRoutes: ApiRoute[] = [
  { methods: ['GET', 'POST'], pattern: /^\/api\/lists$/, modulePath: '../_routes/lists/index.js' },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^\/api\/lists\/item$/, modulePath: '../_routes/lists/item.js' },
  { methods: ['GET', 'DELETE'], pattern: /^\/api\/lists\/members$/, modulePath: '../_routes/lists/members.js' },
  { methods: ['GET', 'POST', 'DELETE'], pattern: /^\/api\/lists\/invites$/, modulePath: '../_routes/lists/invites.js' },
  { methods: ['GET'], pattern: /^\/api\/invites\/preview$/, modulePath: '../_routes/invites/preview.js' },
  { methods: ['POST'], pattern: /^\/api\/invites\/accept$/, modulePath: '../_routes/invites/accept.js' },
  { methods: ['GET', 'POST'], pattern: /^\/api\/lists\/movies$/, modulePath: '../_routes/lists/movies/index.js' },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^\/api\/lists\/movies\/item$/, modulePath: '../_routes/lists/movies/item.js' },
  { methods: ['PATCH', 'PUT'], pattern: /^\/api\/lists\/movies\/rating$/, modulePath: '../_routes/lists/movies/rating.js' },
  { methods: ['GET'], pattern: /^\/api\/lists\/movies\/genres$/, modulePath: '../_routes/lists/movies/genres.js' },
  { methods: ['GET'], pattern: /^\/api\/lists\/movies\/stats$/, modulePath: '../_routes/lists/movies/stats.js' },
  { methods: ['GET'], pattern: /^\/api\/search$/, modulePath: '../_routes/search/index.js' },
  { methods: ['GET'], pattern: /^\/api\/auth\/google-start$/, modulePath: '../_routes/auth/google-start.js' },
  { methods: ['GET'], pattern: /^\/api\/auth\/google-callback$/, modulePath: '../_routes/auth/google-callback.js' },
  { methods: ['POST'], pattern: /^\/api\/auth\/logout$/, modulePath: '../_routes/auth/logout.js' },
  { methods: ['GET'], pattern: /^\/api\/auth\/session$/, modulePath: '../_routes/auth/session.js' },
];

export async function dispatchApiRequest(
  req: ApiRequest,
  res: ApiResponse,
  pathname: string,
  method: string,
): Promise<void> {
  const route = apiRoutes.find((entry) => entry.pattern.test(pathname));
  if (!route) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (!route.methods.includes(method)) {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const mod = await import(route.modulePath);
  const handler = mod.default as (request: ApiRequest, response: ApiResponse) => Promise<void> | void;
  await handler(req, res);
}
