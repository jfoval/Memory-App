import type { SupabaseClient } from '@supabase/supabase-js';
import type { CardResult, ContentSet, Item, Profile, Review } from '../types';
import type { DataBackend, NewContentSet, NewItem } from './backend';
import { nowIso, uuid } from '../lib/ids';

// Supabase (Postgres + RLS) backend. Column names are snake_case in the DB and
// mapped to/from the camelCase domain types here. RLS guarantees a user can
// only ever touch their own rows, so user_id filters are defence in depth.

/* eslint-disable @typescript-eslint/no-explicit-any */
function toContentSet(r: any): ContentSet {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    kind: r.kind,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
function toItem(r: any): Item {
  return {
    id: r.id,
    userId: r.user_id,
    contentSetId: r.content_set_id,
    locusIndex: r.locus_index,
    content: r.content,
    contentType: r.content_type,
    association: r.association,
    imagePath: r.image_path,
    embedding: r.embedding,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
function toReview(r: any): Review {
  return {
    id: r.id,
    userId: r.user_id,
    itemId: r.item_id,
    repetitions: r.repetitions,
    intervalDays: r.interval_days,
    easeFactor: r.ease_factor,
    scheduledFor: r.scheduled_for,
    lastReviewed: r.last_reviewed,
    lastScore: r.last_score,
    updatedAt: r.updated_at,
  };
}
function toCardResult(r: any): CardResult {
  return {
    id: r.id,
    userId: r.user_id,
    deckSeed: r.deck_seed,
    deckOrder: r.deck_order,
    recalled: r.recalled,
    score: r.score,
    timeMs: r.time_ms,
    createdAt: r.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export class SupabaseBackend implements DataBackend {
  readonly mode = 'supabase' as const;
  constructor(private db: SupabaseClient) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const { data } = await this.db.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      createdAt: data.created_at,
    };
  }

  async ensureProfile(userId: string, email: string): Promise<Profile> {
    const existing = await this.getProfile(userId);
    if (existing) return existing;
    const profile = {
      id: userId,
      email,
      display_name: email.split('@')[0],
      created_at: nowIso(),
    };
    await this.db.from('profiles').upsert(profile);
    return {
      id: userId,
      email,
      displayName: profile.display_name,
      createdAt: profile.created_at,
    };
  }

  async listContentSets(userId: string): Promise<ContentSet[]> {
    const { data, error } = await this.db
      .from('content_sets')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toContentSet);
  }

  async createContentSet(userId: string, input: NewContentSet): Promise<ContentSet> {
    const row = {
      id: uuid(),
      user_id: userId,
      name: input.name,
      kind: input.kind,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    const { data, error } = await this.db.from('content_sets').insert(row).select().single();
    if (error) throw error;
    return toContentSet(data);
  }

  async renameContentSet(_userId: string, id: string, name: string): Promise<void> {
    await this.db.from('content_sets').update({ name, updated_at: nowIso() }).eq('id', id);
  }

  async deleteContentSet(_userId: string, id: string): Promise<void> {
    await this.db.from('content_sets').delete().eq('id', id);
  }

  async listItems(userId: string, contentSetId: string): Promise<Item[]> {
    const { data, error } = await this.db
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .eq('content_set_id', contentSetId)
      .order('locus_index');
    if (error) throw error;
    return (data ?? []).map(toItem);
  }

  async listAllItems(userId: string): Promise<Item[]> {
    const { data, error } = await this.db.from('items').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map(toItem);
  }

  async upsertItems(userId: string, items: NewItem[]): Promise<Item[]> {
    const rows = items.map((n) => ({
      id: uuid(),
      user_id: userId,
      content_set_id: n.contentSetId,
      locus_index: n.locusIndex,
      content: n.content,
      content_type: n.contentType,
      association: n.association ?? null,
      image_path: n.imagePath ?? null,
      embedding: n.embedding ?? null,
      created_at: nowIso(),
      updated_at: nowIso(),
    }));
    const { data, error } = await this.db
      .from('items')
      .upsert(rows, { onConflict: 'content_set_id,locus_index' })
      .select();
    if (error) throw error;
    return (data ?? []).map(toItem);
  }

  async updateItem(_userId: string, id: string, patch: Partial<NewItem>): Promise<void> {
    const row: Record<string, unknown> = { updated_at: nowIso() };
    if (patch.content !== undefined) row.content = patch.content;
    if (patch.association !== undefined) row.association = patch.association;
    if (patch.imagePath !== undefined) row.image_path = patch.imagePath;
    if (patch.embedding !== undefined) row.embedding = patch.embedding;
    if (patch.contentType !== undefined) row.content_type = patch.contentType;
    await this.db.from('items').update(row).eq('id', id);
  }

  async deleteItem(_userId: string, id: string): Promise<void> {
    await this.db.from('items').delete().eq('id', id);
  }

  async listReviews(userId: string): Promise<Review[]> {
    const { data, error } = await this.db.from('reviews').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map(toReview);
  }

  async saveReview(userId: string, review: Review): Promise<void> {
    const row = {
      id: review.id,
      user_id: userId,
      item_id: review.itemId,
      repetitions: review.repetitions,
      interval_days: review.intervalDays,
      ease_factor: review.easeFactor,
      scheduled_for: review.scheduledFor,
      last_reviewed: review.lastReviewed,
      last_score: review.lastScore,
      updated_at: review.updatedAt,
    };
    await this.db.from('reviews').upsert(row, { onConflict: 'item_id' });
  }

  async listCardResults(userId: string): Promise<CardResult[]> {
    const { data, error } = await this.db
      .from('card_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toCardResult);
  }

  async saveCardResult(userId: string, result: CardResult): Promise<void> {
    const row = {
      id: result.id,
      user_id: userId,
      deck_seed: result.deckSeed,
      deck_order: result.deckOrder,
      recalled: result.recalled,
      score: result.score,
      time_ms: result.timeMs,
      created_at: result.createdAt,
    };
    await this.db.from('card_results').insert(row);
  }
}
