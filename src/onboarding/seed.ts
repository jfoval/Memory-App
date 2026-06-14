import { repository } from '../data/repository';

// On first sign-in: ensure the profile exists and seed one short, vivid sample
// content set placed across the first several loci. Idempotent per user.

const SAMPLE = [
  'A giant red apple wedged in the front gate, dripping juice.',
  'The fountain spouts hot coffee instead of water.',
  'Goldfish in the koi pond wearing tiny party hats.',
  'The topiary bear waves and offers you honey.',
  'The sundial’s shadow is a pointing skeleton finger.',
  'Someone is asleep on the garden bench, snoring loudly.',
  'The rose arch is made of red liquorice you can bite.',
];

export async function ensureOnboarding(userId: string, email: string): Promise<void> {
  await repository.ensureProfile(userId, email);

  const flagKey = `mp:onboarded:${userId}`;
  if (localStorage.getItem(flagKey)) return;

  const sets = await repository.listContentSets(userId);
  if (sets.length === 0) {
    const set = await repository.createContentSet(userId, {
      name: 'Sample: A Walk in the Garden',
      kind: 'custom',
    });
    await repository.upsertItems(
      userId,
      SAMPLE.map((content, i) => ({
        contentSetId: set.id,
        locusIndex: i + 1,
        content,
        contentType: 'concept' as const,
      })),
    );
  }
  localStorage.setItem(flagKey, '1');
}

export function hasSeenTutorial(userId: string): boolean {
  return !!localStorage.getItem(`mp:tutorial:${userId}`);
}
export function markTutorialSeen(userId: string): void {
  localStorage.setItem(`mp:tutorial:${userId}`, '1');
}
