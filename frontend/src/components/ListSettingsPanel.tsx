import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import QRCode from 'react-qr-code';
import {
  useListMembersQuery,
  useListInvitesQuery,
  useCreateInviteMutation,
  useRevokeInviteMutation,
  useRemoveMemberMutation,
  useRenameListMutation,
  type ListSummary,
} from '../api/lists';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './Avatar';
import { MobileBottomSheet } from './mobile/MobileBottomSheet';

function InviteShareRow({
  url,
  copied,
  onCopy,
  onRevoke,
}: {
  url: string;
  copied: boolean;
  onCopy: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="ls-invite-row">
      <div className="ls-invite-qr-panel">
        <div className="ls-invite-qr-frame" aria-hidden>
          <QRCode value={url} size={168} bgColor="#ffffff" fgColor="#14151a" level="M" />
        </div>
        <p className="ls-invite-qr-hint">Scan to open the invite link</p>
        <button type="button" className="ls-invite-copy ls-invite-copy-qr" onClick={onCopy}>
          {copied ? <Check size={14} strokeWidth={2.4} aria-hidden /> : <Copy size={14} strokeWidth={2.2} aria-hidden />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      <div className="ls-invite-actions">
        <button type="button" className="ls-invite-revoke" onClick={onRevoke}>
          Revoke
        </button>
      </div>
    </div>
  );
}

function ListSettingsContent({
  list,
  variant,
}: {
  list: ListSummary;
  variant: 'drawer' | 'sheet';
}) {
  const { user } = useAuth();
  const isOwner = list.role === 'owner';
  const { data: members = [] } = useListMembersQuery(list.id);
  const { data: invites = [] } = useListInvitesQuery(isOwner ? list.id : null);
  const createInvite = useCreateInviteMutation();
  const revokeInvite = useRevokeInviteMutation();
  const removeMember = useRemoveMemberMutation();
  const renameList = useRenameListMutation();
  const [name, setName] = useState(list.name);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeInvite = invites.find((i) => !i.revokedAt) ?? null;
  const inviteUrl = (token: string) => `${window.location.origin}/invite/${token}`;
  const sectionClass = variant === 'sheet' ? 'mls-section' : 'ls-section';

  const handleCopy = async (token: string, id: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 1500);
    } catch {
      /* clipboard API unavailable — the link is still shown on screen */
    }
  };

  return (
    <>
      <section className={sectionClass}>
        <h3>Name</h3>
        {isOwner ? (
          <form
            className="ls-rename-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim() && name.trim() !== list.name) {
                void renameList.mutateAsync({ id: list.id, name: name.trim() });
              }
            }}
          >
            <input
              className={variant === 'sheet' ? 'mls-input' : 'mfd-input'}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              type="submit"
              className={variant === 'sheet' ? 'mls-btn-primary' : 'mfd-btn-save'}
              disabled={renameList.isPending || !name.trim()}
            >
              Save
            </button>
          </form>
        ) : (
          <p className="ls-static-name">{list.name}</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3>Members</h3>
        <ul className="ls-members">
          {members.map((m) => (
            <li key={m.userId}>
              <Avatar
                userId={m.userId}
                name={m.name}
                email={m.email}
                avatarUrl={m.avatarUrl}
                className="ls-member-avatar"
              />
              <span className="ls-member-name">{m.name ?? m.email}</span>
              <em className="ls-member-role">{m.role === 'owner' ? 'Owner' : 'Member'}</em>
              {isOwner && m.role !== 'owner' ? (
                <button
                  type="button"
                  className="ls-member-remove"
                  onClick={() => void removeMember.mutateAsync({ listId: list.id, userId: m.userId })}
                >
                  Remove
                </button>
              ) : null}
              {!isOwner && m.userId === user?.id ? (
                <button
                  type="button"
                  className="ls-member-remove"
                  onClick={() => void removeMember.mutateAsync({ listId: list.id, userId: m.userId })}
                >
                  Leave
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {isOwner ? (
        <section className={sectionClass}>
          <h3>Invite link</h3>
          {activeInvite ? (
            <InviteShareRow
              url={inviteUrl(activeInvite.token)}
              copied={copiedId === activeInvite.id}
              onCopy={() => void handleCopy(activeInvite.token, activeInvite.id)}
              onRevoke={() => void revokeInvite.mutateAsync({ id: activeInvite.id, listId: list.id })}
            />
          ) : (
            <button
              type="button"
              className={variant === 'sheet' ? 'mls-btn-primary mls-btn-full' : 'mfd-btn-save'}
              onClick={() => void createInvite.mutateAsync(list.id)}
              disabled={createInvite.isPending}
            >
              {createInvite.isPending ? 'Creating…' : 'Create invite link'}
            </button>
          )}
          <p className="ls-invite-hint">
            Anyone with this link can join after signing in with Google. It never expires —
            revoke it any time.
          </p>
        </section>
      ) : null}
    </>
  );
}

export function ListSettingsPanel({
  list,
  onClose,
  variant = 'drawer',
}: {
  list: ListSummary;
  onClose: () => void;
  variant?: 'drawer' | 'sheet';
}) {
  if (variant === 'sheet') {
    return (
      <MobileBottomSheet
        open
        onClose={onClose}
        title="List settings"
        bodyClassName="mobile-list-settings-body"
      >
        <div className="mobile-list-settings">
          <ListSettingsContent list={list} variant="sheet" />
        </div>
      </MobileBottomSheet>
    );
  }

  return (
    <div className="movie-drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="movie-drawer list-settings-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="List settings"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="movie-drawer-top">
          <span>List settings</span>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <ListSettingsContent list={list} variant="drawer" />
      </aside>
    </div>
  );
}
