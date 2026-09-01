import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { clearSessionCookie } from '../_lib/auth.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  clearSessionCookie(res);
  res.status(204).end();
}
