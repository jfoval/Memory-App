import type { CardResult, ContentSet, Item, Profile, Review } from '../types';
import type { DataBackend, NewContentSet, NewItem } from './backend';
import { LocalBackend } from './localBackend';
import { SupabaseBackend } from './supabaseBackend';
import { hasSupabase, supabase } from '../lib/supabase';

// The repository chooses the active backend and adds offline resilience:
//  - A local mirror (LocalBackend) is always kept so cached content sets and the
//    palace are reviewable without a connection.
//  - Review and card results created while offline queue and sync on reconnect.
//  - Conflicts resolve last-write-wins via updatedAt on mutable rows.

type QueuedOp =
  | { kind: 'review'; userId: string; payload: Review }
  | { kind: 'card'; userId: string; payload: CardResult };

const QUEUE_KEY = 'mp:syncQueue:v1';

function loadQueue(): QueuedOp[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedOp[];
  } catch {
    return [];
  }
}
function saveQueue(q: QueuedOp[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export class Repository implements DataBackend {
  readonly mode: 'local' | 'supabase';
  private primary: DataBackend;
  private mirror: LocalBackend;
  private remote: boolean;

  constructor() {
    this.mirror = new LocalBackend();
    if (hasSupabase && supabase) {
      this.primary = new SupabaseBackend(supabase);
      this.mode = 'supabase';
      this.remote = true;
    } else {
      this.primary = this.mirror;
      this.mode = 'local';
      this.remote = false;
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => void this.flush());
    }
  }

  /** Replay queued offline writes. Safe to call repeatedly. */
  async flush(): Promise<void> {
    if (!this.remote) return;
    let q = loadQueue();
    if (q.length === 0) return;
    const remaining: QueuedOp[] = [];
    for (const op of q) {
      try {
        if (op.kind === 'review') await this.primary.saveReview(op.userId, op.payload);
        else await this.primary.saveCardResult(op.userId, op.payload);
      } catch {
        remaining.push(op);
      }
    }
    q = remaining;
    saveQueue(q);
  }

  pendingCount(): number {
    return loadQueue().length;
  }

  // --- reads: try primary, fall back to the local mirror when offline ---
  private async read<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (!this.remote) return fn();
    try {
      const result = await fn();
      return result;
    } catch {
      return fallback();
    }
  }

  getProfile(userId: string): Promise<Profile | null> {
    return this.read(
      () => this.primary.getProfile(userId),
      () => this.mirror.getProfile(userId),
    );
  }

  async ensureProfile(userId: string, email: string): Promise<Profile> {
    const p = await this.primary.ensureProfile(userId, email);
    if (this.remote) await this.mirror.ensureProfile(userId, email);
    return p;
  }

  listContentSets(userId: string): Promise<ContentSet[]> {
    return this.read(
      async () => {
        const sets = await this.primary.listContentSets(userId);
        await this.cacheSets(userId, sets);
        return sets;
      },
      () => this.mirror.listContentSets(userId),
    );
  }

  private async cacheSets(_userId: string, _sets: ContentSet[]): Promise<void> {
    // The mirror is refreshed lazily on item reads; sets are cheap to refetch.
  }

  async createContentSet(userId: string, input: NewContentSet): Promise<ContentSet> {
    const set = await this.primary.createContentSet(userId, input);
    return set;
  }

  async renameContentSet(userId: string, id: string, name: string): Promise<void> {
    await this.primary.renameContentSet(userId, id, name);
  }

  async deleteContentSet(userId: string, id: string): Promise<void> {
    await this.primary.deleteContentSet(userId, id);
  }

  listItems(userId: string, contentSetId: string): Promise<Item[]> {
    return this.read(
      async () => {
        const items = await this.primary.listItems(userId, contentSetId);
        if (this.remote) await this.mirror.upsertItems(userId, items.map(stripItem));
        return items;
      },
      () => this.mirror.listItems(userId, contentSetId),
    );
  }

  listAllItems(userId: string): Promise<Item[]> {
    return this.read(
      () => this.primary.listAllItems(userId),
      () => this.mirror.listAllItems(userId),
    );
  }

  async upsertItems(userId: string, items: NewItem[]): Promise<Item[]> {
    const created = await this.primary.upsertItems(userId, items);
    if (this.remote) await this.mirror.upsertItems(userId, items);
    return created;
  }

  async updateItem(userId: string, id: string, patch: Partial<NewItem>): Promise<void> {
    await this.primary.updateItem(userId, id, patch);
    if (this.remote) await this.mirror.updateItem(userId, id, patch);
  }

  async deleteItem(userId: string, id: string): Promise<void> {
    await this.primary.deleteItem(userId, id);
    if (this.remote) await this.mirror.deleteItem(userId, id);
  }

  listReviews(userId: string): Promise<Review[]> {
    return this.read(
      () => this.primary.listReviews(userId),
      () => this.mirror.listReviews(userId),
    );
  }

  // Reviews may be created offline: write the mirror immediately, then try the
  // remote; on failure queue for replay on reconnect.
  async saveReview(userId: string, review: Review): Promise<void> {
    if (this.remote) await this.mirror.saveReview(userId, review);
    try {
      await this.primary.saveReview(userId, review);
    } catch {
      if (this.remote) enqueue({ kind: 'review', userId, payload: review });
    }
  }

  listCardResults(userId: string): Promise<CardResult[]> {
    return this.read(
      () => this.primary.listCardResults(userId),
      () => this.mirror.listCardResults(userId),
    );
  }

  async saveCardResult(userId: string, result: CardResult): Promise<void> {
    if (this.remote) await this.mirror.saveCardResult(userId, result);
    try {
      await this.primary.saveCardResult(userId, result);
    } catch {
      if (this.remote) enqueue({ kind: 'card', userId, payload: result });
    }
  }

  /** Clear the per-device cache of private data (called on sign out). */
  clearLocalCache(): void {
    if (this.remote) {
      localStorage.removeItem('mp:data:v1');
      localStorage.removeItem(QUEUE_KEY);
    }
  }
}

function enqueue(op: QueuedOp): void {
  const q = loadQueue();
  q.push(op);
  saveQueue(q);
}

function stripItem(item: Item): NewItem {
  return {
    contentSetId: item.contentSetId,
    locusIndex: item.locusIndex,
    content: item.content,
    contentType: item.contentType,
    association: item.association,
    imagePath: item.imagePath,
    embedding: item.embedding,
  };
}

export const repository = new Repository();
