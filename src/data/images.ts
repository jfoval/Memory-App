import { hasSupabase, supabase } from '../lib/supabase';
import { uuid } from '../lib/ids';

// Per-item images. In local mode they are kept as data URLs (no backend needed).
// With Supabase configured they upload to the owner-scoped Storage bucket and we
// store the object path.

export async function uploadItemImage(userId: string, file: File): Promise<string> {
  if (hasSupabase && supabase) {
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${userId}/${uuid()}.${ext}`;
    const { error } = await supabase.storage.from('item-images').upload(path, file);
    if (error) throw error;
    return path;
  }
  return fileToDataUrl(file);
}

export async function resolveImageUrl(imagePath: string): Promise<string> {
  if (imagePath.startsWith('data:')) return imagePath;
  if (hasSupabase && supabase) {
    const { data } = await supabase.storage.from('item-images').createSignedUrl(imagePath, 3600);
    return data?.signedUrl ?? '';
  }
  return imagePath;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
