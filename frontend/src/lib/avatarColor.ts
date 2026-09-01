/** Deterministic small color palette for per-user avatars/initials —
 *  replaces the old hardcoded "Inna"/"Bohdan" tone classes now that a
 *  list can have any number of members. */
const PALETTE = [
  '#c8a8ff',
  '#7fd8c0',
  '#ffb26b',
  '#8fb8ff',
  '#ff9bb0',
  '#c9e26b',
  '#ffd66b',
  '#9a8cff',
] as const;

export function avatarColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function initialFor(name: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || '?';
  return source.slice(0, 1).toUpperCase();
}
