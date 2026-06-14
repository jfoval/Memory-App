import { useState } from 'react';
import { useContentSets, useCreateSet, useDeleteSet } from '../../data/hooks';
import { useUi } from '../../store/uiStore';
import { SetEditor } from '../sets/SetEditor';
import type { ContentSetKind } from '../../types';

const KINDS: { id: ContentSetKind; label: string }[] = [
  { id: 'study', label: 'Study notes' },
  { id: 'list', label: 'List' },
  { id: 'verbatim', label: 'Verbatim' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'custom', label: 'Custom' },
];

export function SetsScreen() {
  const { activeSetId, openSet, closeSet } = useUi();
  const { data: sets = [], isLoading } = useContentSets();
  const createSet = useCreateSet();
  const deleteSet = useDeleteSet();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ContentSetKind>('study');

  if (activeSetId) {
    return <SetEditor setId={activeSetId} onBack={closeSet} />;
  }

  const create = async () => {
    if (!name.trim()) return;
    const set = await createSet.mutateAsync({ name: name.trim(), kind });
    setName('');
    openSet(set.id);
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <h2 className="text-xl font-bold">Content sets</h2>
        <p className="text-sm text-slate-500">
          Each set holds up to 52 items mapped onto the shared palace. Split large material across
          several sets.
        </p>

        <div className="card space-y-3">
          <h3 className="font-semibold">New set</h3>
          <input
            className="input"
            placeholder="Set name (e.g. Spanish verbs, Psalm 23)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                className={`rounded-full px-3 py-1 text-xs ${
                  kind === k.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={create} disabled={createSet.isPending}>
            Create set
          </button>
        </div>

        <div className="space-y-2">
          {isLoading && <p className="text-slate-400">Loading…</p>}
          {sets.map((set) => (
            <div key={set.id} className="card flex items-center justify-between">
              <button className="flex-1 text-left" onClick={() => openSet(set.id)}>
                <div className="font-medium">{set.name}</div>
                <div className="text-xs text-slate-400">
                  {set.kind} · updated {new Date(set.updatedAt).toLocaleDateString()}
                </div>
              </button>
              <button
                className="btn-danger px-2 py-1 text-xs"
                onClick={() => {
                  if (confirm(`Delete "${set.name}" and its items?`)) deleteSet.mutate(set.id);
                }}
              >
                Delete
              </button>
            </div>
          ))}
          {!isLoading && sets.length === 0 && (
            <p className="text-slate-400">No sets yet. Create one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
