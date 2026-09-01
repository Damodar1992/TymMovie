import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface InvitePreview {
  valid: boolean;
  listName?: string;
  ownerName?: string;
}

export function useInvitePreviewQuery(token: string | null) {
  return useQuery({
    queryKey: ['invite-preview', token],
    enabled: Boolean(token),
    queryFn: async (): Promise<InvitePreview> => {
      const { data } = await apiClient.get<InvitePreview>('/invites/preview', {
        params: { token },
      });
      return data;
    },
    retry: false,
  });
}

export function useAcceptInviteMutation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post<{ listId: string }>('/invites/accept', { token });
      return data;
    },
  });
}
