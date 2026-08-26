import type { ApiRequest, ApiResponse } from '../_lib/types';
import { getSession } from '../_lib/auth';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const session = getSession(req);
  res.status(200).json({ mode: session?.role ?? null });
}
