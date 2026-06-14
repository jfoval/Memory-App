import { useState } from 'react';
import type { Item } from '../../types';
import type { NewItem } from '../../data/backend';
import { uploadItemImage, resolveImageUrl } from '../../data/images';
import { useAuth } from '../../auth/authStore';

interface Props {
  locusName: string;
  item?: Item;
  onSave: (patch: Partial<NewItem>) => Promise<void>;
}

// One locus slot: shows placed content, expands to edit content, a self-written
// association note, and an optional image. Associations are user-authored — the
// app never generates them.
export function ItemRow({ locusName, item, onSave }: Props) {
  const uid = useAuth((s) => s.user?.id);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(item?.content ?? '');
  const [association, setAssociation] = useState(item?.association ?? '');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const loadImage = async () => {
    if (item?.imagePath && !imageUrl) setImageUrl(await resolveImageUrl(item.imagePath));
  };

  const save = async () => {
    setSaving(true);
    await onSave({ content, association });
    setSaving(false);
    setOpen(false);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    const path = await uploadItemImage(uid, file);
    await onSave({ imagePath: path });
    setImageUrl(await resolveImageUrl(path));
  };

  return (
    <div className="card !p-3">
      <button
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => {
          setOpen((v) => !v);
          void loadImage();
        }}
      >
        <span className="text-sm">
          <span className="text-slate-400">{locusName}</span>
          {item && <span className="ml-2">{item.content}</span>}
          {!item && <span className="ml-2 italic text-slate-400">empty</span>}
        </span>
        <span className="text-slate-400">{open ? '−' : '✎'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <textarea
            className="input text-sm"
            placeholder="What to remember at this location"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <input
            className="input text-sm"
            placeholder="Your vivid association (optional)"
            value={association ?? ''}
            onChange={(e) => setAssociation(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="btn-ghost cursor-pointer text-xs">
              {item?.imagePath ? 'Replace image' : 'Add image'}
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
            {imageUrl && <img src={imageUrl} alt="" className="h-12 w-12 rounded object-cover" />}
            <button className="btn-primary ml-auto text-xs" onClick={save} disabled={saving}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
