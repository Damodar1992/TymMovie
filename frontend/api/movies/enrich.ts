import { enrichByTitle } from '../../lib/tmdb';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const url = new URL(request.url);
  const title = url.searchParams.get('title')?.trim();
  if (!title) {
    return new Response(
      JSON.stringify({ message: 'Query parameter "title" is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  try {
    const metadata = await enrichByTitle(title);
    return new Response(JSON.stringify(metadata ?? null), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: 'Enrich failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
