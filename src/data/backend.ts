import type { ContentSet, Item, Review, CardResult, Profile } from '../types';

// The data backend abstraction. Two implementations exist: a local backend
// (localStorage, used when no Supabase keys are configured) and a Supabase
// backend (Postgres + RLS). The rest of the app only sees this interface.

export interface NewContentSet {
  name: string;
  kind: ContentSet['kind'];
}

export interface NewItem {
  contentSetId: string;
  locusIndex: number;
  content: string;
  contentType: Item['contentType'];
  association?: string | null;
  imagePath?: string | null;
  embedding?: number[] | null;
}

export interface DataBackend {
  readonly mode: 'local' | 'supabase';

  getProfile(userId: string): Promise<Profile | null>;
  ensureProfile(userId: string, email: string): Promise<Profile>;

  listContentSets(userId: string): Promise<ContentSet[]>;
  createContentSet(userId: string, input: NewContentSet): Promise<ContentSet>;
  renameContentSet(userId: string, id: string, name: string): Promise<void>;
  deleteContentSet(userId: string, id: string): Promise<void>;

  listItems(userId: string, contentSetId: string): Promise<Item[]>;
  listAllItems(userId: string): Promise<Item[]>;
  upsertItems(userId: string, items: NewItem[]): Promise<Item[]>;
  updateItem(userId: string, id: string, patch: Partial<NewItem>): Promise<void>;
  deleteItem(userId: string, id: string): Promise<void>;

  listReviews(userId: string): Promise<Review[]>;
  saveReview(userId: string, review: Review): Promise<void>;

  listCardResults(userId: string): Promise<CardResult[]>;
  saveCardResult(userId: string, result: CardResult): Promise<void>;
}
