import { useMemo, useState } from 'react';
import { PALACE, getLocus } from '../../palace/palaceData';
import { useContentSets, useItems, useUpsertItems, useUpdateItem } from '../../data/hooks';
import { ChunkImportPanel } from './ChunkImportPanel';
import { ItemRow } from './ItemRow';
import { StudyMode } from '../study/StudyMode';
import { TestMode } from '../study/TestMode';
import { embed, isEmbeddingEnabled } from '../../embeddings/embeddingService';
import type { NewItem } from '../../data/backend';

interface Props {
  setId: string;
  onBack: () => void;
}

type View = 'edit' | 'study' | 'test';

export function SetEditor({ setId, onBack }: Props) {
  const { data: sets = [] } = useContentSets();
  const { data: items = [] } = useItems(setId);
  const upsert = useUpsertItems();
  const updateItem = useUpdateItem();
  const [view, setView] = useState<View>('edit');
  const [showImport, setShowImport] = useState(false);

  const set = sets.find((s) => s.id === setId);
  const byLocus = useMemo(() => {
    const map = new Map<number, (typeof items)[number]>();
    for (const it of items) map.set(it.locusIndex, it);
    return map;
  }, [items]);

  const place = async (texts: string[], startLocus: number) => {
    const newItems: NewItem[] = await Promise.all(
      texts.map(async (content, i) => ({
        contentSetId: setId,
        locusIndex: startLocus + i,
        content,
        contentType: set?.kind === 'numbers' ? 'number' : set?.kind === 'list' ? 'list-item' : 'fact',
        embedding: isEmbeddingEnabled() ? await embed(content) : null,
      })),
    );
    await upsert.mutateAsync(newItems);
    setShowImport(false);
  };

  if (!set) return <div className="p-6 text-slate-400">Set not found.</div>;
  if (view === 'study') return <StudyMode setId={setId} onExit={() => setView('edit')} />;
  if (view === 'test') return <TestMode setId={setId} onExit={() => setView('edit')} />;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <button className="btn-ghost px-2 py-1 text-sm" onClick={onBack}>
            ‹ All sets
          </button>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm" onClick={() => setView('study')}>
              Study
            </button>
            <button
              className="btn-primary text-sm"
              onClick={() => setView('test')}
              disabled={items.length === 0}
            >
              Test
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold">{set.name}</h2>
          <p className="text-sm text-slate-500">
            {items.length} / 52 placed · {set.kind}
          </p>
        </div>

        <div className="card">
          <button
            className="flex w-full items-center justify-between font-semibold"
            onClick={() => setShowImport((v) => !v)}
          >
            <span>Add content from text or URL</span>
            <span>{showImport ? '−' : '+'}</span>
          </button>
          {showImport && (
            <div className="mt-3">
              <ChunkImportPanel
                startLocus={items.length === 0 ? 1 : Math.min(52, items.length + 1)}
                onPlace={place}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          {PALACE.map((locus) => {
            const item = byLocus.get(locus.index);
            return (
              <ItemRow
                key={locus.index}
                locusName={`${locus.index}. ${getLocus(locus.index)!.name}`}
                item={item}
                onSave={async (patch) => {
                  if (item) {
                    await updateItem.mutateAsync({ id: item.id, patch });
                  } else if (patch.content) {
                    await upsert.mutateAsync([
                      {
                        contentSetId: setId,
                        locusIndex: locus.index,
                        content: patch.content,
                        contentType: 'fact',
                        association: patch.association ?? null,
                        imagePath: patch.imagePath ?? null,
                        embedding: isEmbeddingEnabled() ? await embed(patch.content) : null,
                      },
                    ]);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
