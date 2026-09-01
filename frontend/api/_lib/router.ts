import type { ApiRequest, ApiResponse } from './types.js';

import authGoogleCallback from '../_routes/auth/google-callback.js';
import authGoogleStart from '../_routes/auth/google-start.js';
import authLogout from '../_routes/auth/logout.js';
import authSession from '../_routes/auth/session.js';
import invitesAccept from '../_routes/invites/accept.js';
import invitesPreview from '../_routes/invites/preview.js';
import listsIndex from '../_routes/lists/index.js';
import listsInvites from '../_routes/lists/invites.js';
import listsItem from '../_routes/lists/item.js';
import listsMembers from '../_routes/lists/members.js';
import listsMoviesGenres from '../_routes/lists/movies/genres.js';
import listsMoviesIndex from '../_routes/lists/movies/index.js';
import listsMoviesItem from '../_routes/lists/movies/item.js';
import listsMoviesRating from '../_routes/lists/movies/rating.js';
import listsMoviesStats from '../_routes/lists/movies/stats.js';
import searchIndex from '../_routes/search/index.js';

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

export type ApiRoute = {
  methods: string[];
  pattern: RegExp;
  handler: ApiHandler;
};

export const apiRoutes: ApiRoute[] = [
  { methods: ['GET', 'POST'], pattern: /^\/api\/lists$/, handler: listsIndex },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^\/api\/lists\/item$/, handler: listsItem },
  { methods: ['GET', 'DELETE'], pattern: /^\/api\/lists\/members$/, handler: listsMembers },
  { methods: ['GET', 'POST', 'DELETE'], pattern: /^\/api\/lists\/invites$/, handler: listsInvites },
  { methods: ['GET'], pattern: /^\/api\/invites\/preview$/, handler: invitesPreview },
  { methods: ['POST'], pattern: /^\/api\/invites\/accept$/, handler: invitesAccept },
  { methods: ['GET', 'POST'], pattern: /^\/api\/lists\/movies$/, handler: listsMoviesIndex },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^\/api\/lists\/movies\/item$/, handler: listsMoviesItem },
  { methods: ['PATCH', 'PUT'], pattern: /^\/api\/lists\/movies\/rating$/, handler: listsMoviesRating },
  { methods: ['GET'], pattern: /^\/api\/lists\/movies\/genres$/, handler: listsMoviesGenres },
  { methods: ['GET'], pattern: /^\/api\/lists\/movies\/stats$/, handler: listsMoviesStats },
  { methods: ['GET'], pattern: /^\/api\/search$/, handler: searchIndex },
  { methods: ['GET'], pattern: /^\/api\/auth\/google-start$/, handler: authGoogleStart },
  { methods: ['GET'], pattern: /^\/api\/auth\/google-callback$/, handler: authGoogleCallback },
  { methods: ['POST'], pattern: /^\/api\/auth\/logout$/, handler: authLogout },
  { methods: ['GET'], pattern: /^\/api\/auth\/session$/, handler: authSession },
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

  await route.handler(req, res);
}
