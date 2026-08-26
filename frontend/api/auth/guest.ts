import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { describeError } from '../_lib/types.js';
import { setSessionCookie } from '../_lib/auth.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    setSessionCookie(res, 'guest');
    res.status(200).json({ mode: 'guest' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Server auth is not configured.') });
  }
}
