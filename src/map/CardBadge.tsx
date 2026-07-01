import { cardFromId } from '../logic/cards';

const SIZES = {
  sm: 'h-9 w-7 text-sm',
  md: 'h-14 w-10 text-xl',
  lg: 'h-20 w-14 text-3xl',
};

// A single playing card rendered as a little face-up card (red for ♥/♦).
export function CardBadge({ cardId, size = 'md' }: { cardId: number; size?: keyof typeof SIZES }) {
  const card = cardFromId(cardId);
  const red = card.suit === 'hearts' || card.suit === 'diamonds';
  return (
    <span
      className={`inline-flex flex-col items-center justify-center rounded-md border-2 bg-white font-bold leading-none shadow ${SIZES[size]} ${
        red ? 'border-red-200 text-red-600' : 'border-slate-300 text-slate-900'
      }`}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <span>{card.rank}</span>
      <span>{card.suitSymbol}</span>
    </span>
  );
}
