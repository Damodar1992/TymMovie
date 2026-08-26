import type { ApiRequest, ApiResponse } from '../_lib/types';
import { describeError } from '../_lib/types';
import { clearSessionCookie } from '../_lib/auth';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    clearSessionCookie(res);
    res.status(200).json({ mode: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
