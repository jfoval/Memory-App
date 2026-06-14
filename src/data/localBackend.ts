import type { CardResult, ContentSet, Item, Profile, Review } from '../types';
import type { DataBackend, NewContentSet, NewItem } from './backend';
import { nowIso, uuid } from '../lib/ids';

// localStorage-backed implementation. Used as the default when no Supabase keys
// are present, and as the offline cache shape. Data is namespaced per user.

const KEY = 'mp:data:v1';

interface Db {
  profiles: Record<string, Profile>;
  contentSets: ContentSet[];
  items: Item[];
  reviews: Review[];
  cardResults: CardResult[];
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* ignore corrupt cache */
  }
  return { profiles: {}, contentSets: [], items: [], reviews: [], cardResults: [] };
}

function save(db: Db): void {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export class LocalBackend implements DataBackend {
  readonly mode = 'local' as const;

  async getProfile(userId: string): Promise<Profile | null> {
    return load().profiles[userId] ?? null;
  }

  async ensureProfile(userId: string, email: string): Promise<Profile> {
    const db = load();
    if (!db.profiles[userId]) {
      db.profiles[userId] = {
        id: userId,
        email,
        displayName: email.split('@')[0],
        createdAt: nowIso(),
      };
      save(db);
    }
    return db.profiles[userId];
  }

  async listContentSets(userId: string): Promise<ContentSet[]> {
    return load()
      .contentSets.filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createContentSet(userId: string, input: NewContentSet): Promise<ContentSet> {
    const db = load();
    const set: ContentSet = {
      id: uuid(),
      userId,
      name: input.name,
      kind: input.kind,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.contentSets.push(set);
    save(db);
    return set;
  }

  async renameContentSet(userId: string, id: string, name: string): Promise<void> {
    const db = load();
    const set = db.contentSets.find((c) => c.id === id && c.userId === userId);
    if (set) {
      set.name = name;
      set.updatedAt = nowIso();
      save(db);
    }
  }

  async deleteContentSet(userId: string, id: string): Promise<void> {
    const db = load();
    db.contentSets = db.contentSets.filter((c) => !(c.id === id && c.userId === userId));
    const itemIds = new Set(db.items.filter((i) => i.contentSetId === id).map((i) => i.id));
    db.items = db.items.filter((i) => i.contentSetId !== id);
    db.reviews = db.reviews.filter((r) => !itemIds.has(r.itemId));
    save(db);
  }

  async listItems(userId: string, contentSetId: string): Promise<Item[]> {
    return load()
      .items.filter((i) => i.userId === userId && i.contentSetId === contentSetId)
      .sort((a, b) => a.locusIndex - b.locusIndex);
  }

  async listAllItems(userId: string): Promise<Item[]> {
    return load().items.filter((i) => i.userId === userId);
  }

  async upsertItems(userId: string, items: NewItem[]): Promise<Item[]> {
    const db = load();
    const created: Item[] = items.map((n) => ({
      id: uuid(),
      userId,
      contentSetId: n.contentSetId,
      locusIndex: n.locusIndex,
      content: n.content,
      contentType: n.contentType,
      association: n.association ?? null,
      imagePath: n.imagePath ?? null,
      embedding: n.embedding ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }));
    // Replace any existing items for the same set+locus (re-placement).
    const touched = new Set(created.map((c) => `${c.contentSetId}:${c.locusIndex}`));
    db.items = db.items.filter(
      (i) => i.userId !== userId || !touched.has(`${i.contentSetId}:${i.locusIndex}`),
    );
    db.items.push(...created);
    const set = db.contentSets.find((c) => c.id === items[0]?.contentSetId);
    if (set) set.updatedAt = nowIso();
    save(db);
    return created;
  }

  async updateItem(userId: string, id: string, patch: Partial<NewItem>): Promise<void> {
    const db = load();
    const item = db.items.find((i) => i.id === id && i.userId === userId);
    if (item) {
      Object.assign(item, patch);
      item.updatedAt = nowIso();
      save(db);
    }
  }

  async deleteItem(userId: string, id: string): Promise<void> {
    const db = load();
    db.items = db.items.filter((i) => !(i.id === id && i.userId === userId));
    db.reviews = db.reviews.filter((r) => r.itemId !== id);
    save(db);
  }

  async listReviews(userId: string): Promise<Review[]> {
    return load().reviews.filter((r) => r.userId === userId);
  }

  async saveReview(userId: string, review: Review): Promise<void> {
    const db = load();
    const idx = db.reviews.findIndex((r) => r.itemId === review.itemId && r.userId === userId);
    if (idx >= 0) db.reviews[idx] = review;
    else db.reviews.push(review);
    save(db);
  }

  async listCardResults(userId: string): Promise<CardResult[]> {
    return load()
      .cardResults.filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveCardResult(_userId: string, result: CardResult): Promise<void> {
    const db = load();
    db.cardResults.push(result);
    save(db);
  }
}
