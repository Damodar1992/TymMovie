import { useState, type CSSProperties } from 'react';
import { avatarColorForUser, initialFor } from '../lib/avatarColor';

interface AvatarProps {
  /** Used to pick a deterministic fallback color when there's no photo. */
  userId: string;
  name?: string | null;
  email?: string | null;
  /** Google profile photo URL, if any — usually `users.avatar_url` /
   *  `AuthUser.avatarUrl` / `ListMember.avatarUrl` / `RatingEntry.avatarUrl`. */
  avatarUrl?: string | null;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/** Renders a user's Google profile photo when one is set (and loads
 *  successfully); otherwise falls back to the existing colored-initial
 *  chip. Reuses the caller's className/style so it drops into any of the
 *  existing avatar slots (movie rating chips, member lists, profile
 *  header, ...) without needing per-spot CSS. */
export function Avatar({ userId, name = null, email = null, avatarUrl, className, style, title }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  if (avatarUrl && !failed) {
    return (
      <img
        className={className}
        style={{ objectFit: 'cover', ...style }}
        src={avatarUrl}
        alt=""
        title={title}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={className} style={{ background: avatarColorForUser(userId), ...style }} title={title}>
      {initialFor(name, email)}
    </span>
  );
}
