import { supabase, isSupabaseEnabled } from '../lib/supabaseClient';

export interface TVProgress {
  season: number;
  episode: number;
}

const TABLE = 'user_progress';

export const userProgressService = {
  async get(userId: string, tmdbId: number): Promise<TVProgress | null> {
    if (!isSupabaseEnabled) return null;
    const { data, error } = await supabase
      .from(TABLE)
      .select('season, episode')
      .eq('user_id', userId)
      .eq('tmdb_id', tmdbId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) return null;
    return { season: (data as any).season, episode: (data as any).episode };
  },

  async set(userId: string, tmdbId: number, progress: TVProgress) {
    if (!isSupabaseEnabled) return;
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        {
          user_id: userId,
          tmdb_id: tmdbId,
          season: progress.season,
          episode: progress.episode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,tmdb_id' },
      );

    if (error) throw error;
  },
};
