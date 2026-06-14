import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repository } from './repository';
import type { NewContentSet, NewItem } from './backend';
import type { CardResult, Review } from '../types';
import { useAuth } from '../auth/authStore';

// Thin TanStack Query wrappers over the repository. The repository is the source
// of truth (cloud when configured, local otherwise) with an offline cache.

export function useContentSets() {
  const uid = useAuth((s) => s.user?.id);
  return useQuery({
    queryKey: ['contentSets', uid],
    enabled: !!uid,
    queryFn: () => repository.listContentSets(uid!),
  });
}

export function useItems(contentSetId: string | null) {
  const uid = useAuth((s) => s.user?.id);
  return useQuery({
    queryKey: ['items', uid, contentSetId],
    enabled: !!uid && !!contentSetId,
    queryFn: () => repository.listItems(uid!, contentSetId!),
  });
}

export function useAllItems() {
  const uid = useAuth((s) => s.user?.id);
  return useQuery({
    queryKey: ['items', uid, 'all'],
    enabled: !!uid,
    queryFn: () => repository.listAllItems(uid!),
  });
}

export function useReviews() {
  const uid = useAuth((s) => s.user?.id);
  return useQuery({
    queryKey: ['reviews', uid],
    enabled: !!uid,
    queryFn: () => repository.listReviews(uid!),
  });
}

export function useCardResults() {
  const uid = useAuth((s) => s.user?.id);
  return useQuery({
    queryKey: ['cardResults', uid],
    enabled: !!uid,
    queryFn: () => repository.listCardResults(uid!),
  });
}

export function useCreateSet() {
  const uid = useAuth((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewContentSet) => repository.createContentSet(uid!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contentSets', uid] }),
  });
}

export function useDeleteSet() {
  const uid = useAuth((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.deleteContentSet(uid!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contentSets', uid] });
      qc.invalidateQueries({ queryKey: ['items', uid] });
    },
  });
}

export function useRenameSet() {
  const uid = useAuth((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      repository.renameContentSet(uid!, id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contentSets', uid] }),
  });
}

export function useUpsertItems() {
  const uid = useAuth((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: NewItem[]) => repository.upsertItems(uid!, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', uid] }),
  });
}

export function useUpdateItem() {
  const uid = useAuth((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewItem> }) =>
      repository.updateItem(uid!, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', uid] }),
  });
}

export function useSaveReview() {
  const uid = useAuth((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (review: Review) => repository.saveReview(uid!, review),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', uid] }),
  });
}

export function useSaveCardResult() {
  const uid = useAuth((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (result: CardResult) => repository.saveCardResult(uid!, result),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cardResults', uid] }),
  });
}
