import { supabase, isSupabaseEnabled } from '../lib/supabaseClient';

export type MediaType = 'movie' | 'tv';
export type ListType = 'watchlist';

export interface MediaItem {
  tmdb_id: number;
  type: MediaType;
  title: string;
  poster_path: string | null;
}

const TABLE = 'user_media';

export const userMediaService = {
  async add(userId: string, item: MediaItem, list_type: ListType) {
    if (!isSupabaseEnabled) return;
    const { error } = await supabase.from(TABLE).upsert({
      user_id: userId,
      tmdb_id: item.tmdb_id,
      type: item.type,
      title: item.title,
      poster_path: item.poster_path,
      list_type,
    }, { onConflict: 'user_id,tmdb_id,list_type' });
    if (error) throw error;
  },
  async remove(userId: string, tmdb_id: number, list_type: ListType) {
    if (!isSupabaseEnabled) return;
    const { error } = await supabase.from(TABLE).delete().eq('user_id', userId).eq('tmdb_id', tmdb_id).eq('list_type', list_type);
    if (error) throw error;
  },
  async list(userId: string, list_type: ListType) {
    if (!isSupabaseEnabled) return [];
    const { data, error } = await supabase.from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('list_type', list_type)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
