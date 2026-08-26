import type { ApiRequest, ApiResponse } from '../_lib/types';
import { readJsonBody } from '../_lib/types';
import { checkAdminCredentials, setSessionCookie } from '../_lib/auth';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const body = readJsonBody<{ login?: string; password?: string }>(req);
  const login = typeof body.login === 'string' ? body.login : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!login || !password) {
    res.status(400).json({ error: 'Login and password are required.' });
    return;
  }

  let ok: boolean;
  try {
    ok = checkAdminCredentials(login, password);
  } catch {
    res.status(500).json({ error: 'Server auth is not configured.' });
    return;
  }

  if (!ok) {
    res.status(401).json({ error: 'Wrong login or password.' });
    return;
  }

  setSessionCookie(res, 'admin');
  res.status(200).json({ mode: 'admin' });
}
