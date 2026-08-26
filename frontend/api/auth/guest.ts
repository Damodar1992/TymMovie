import type { ApiRequest, ApiResponse } from '../_lib/types';
import { setSessionCookie } from '../_lib/auth';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  setSessionCookie(res, 'guest');
  res.status(200).json({ mode: 'guest' });
}
