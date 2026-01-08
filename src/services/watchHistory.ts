import { supabase } from '../lib/supabaseClient';

export interface WatchHistoryItem {
  id?: string;
  user_id: string;
  tmdb_id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  progress: number;
  duration?: number;
  last_position?: number; // Playback position in seconds
  season_number?: number;
  episode_number?: number;
  last_watched: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'watchHistory_offline_queue';
const LOCAL_CACHE_KEY = 'watchHistory_cache';

const getLocalQueue = (): WatchHistoryItem[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const addToLocalQueue = (userId: string, item: Omit<WatchHistoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  try {
    const queue = getLocalQueue();
    const fullItem: WatchHistoryItem = {
      user_id: userId,
      ...item,
      updated_at: new Date().toISOString(),
    };

    const existingIndex = queue.findIndex(
      q => q.user_id === userId &&
           q.tmdb_id === item.tmdb_id &&
           q.type === item.type &&
           q.season_number === item.season_number &&
           q.episode_number === item.episode_number
    );

    if (existingIndex >= 0) {
      queue[existingIndex] = fullItem;
    } else {
      queue.push(fullItem);
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save to local queue:', err);
  }
};

const updateLocalCache = (userId: string, item: Omit<WatchHistoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  try {
    const cacheKey = `${LOCAL_CACHE_KEY}:${userId}`;
    const cached = localStorage.getItem(cacheKey);
    const items: WatchHistoryItem[] = cached ? JSON.parse(cached) : [];

    const fullItem: WatchHistoryItem = {
      user_id: userId,
      ...item,
      updated_at: new Date().toISOString(),
    };

    const existingIndex = items.findIndex(
      i => i.tmdb_id === item.tmdb_id &&
           i.type === item.type &&
           i.season_number === item.season_number &&
           i.episode_number === item.episode_number
    );

    if (existingIndex >= 0) {
      items[existingIndex] = fullItem;
    } else {
      items.unshift(fullItem);
    }

    items.sort((a, b) => new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime());
    localStorage.setItem(cacheKey, JSON.stringify(items.slice(0, 50)));
  } catch (err) {
    console.error('Failed to update local cache:', err);
  }
};

const syncOfflineQueue = async (): Promise<void> => {
  const queue = getLocalQueue();
  if (queue.length === 0) return;

  const synced: number[] = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      const safeDuration = typeof item.duration === 'number' && item.duration > 0
        ? Math.round(item.duration)
        : null;
      const safeLastPosition = typeof item.last_position === 'number' && item.last_position >= 0
        ? Math.round(item.last_position)
        : null;

      const { error } = await supabase
        .from('watch_history')
        .upsert({
          user_id: item.user_id,
          tmdb_id: item.tmdb_id,
          type: item.type,
          title: item.title,
          poster_path: item.poster_path,
          progress: item.progress,
          duration: safeDuration,
          last_position: safeLastPosition,
          season_number: item.season_number,
          episode_number: item.episode_number,
          last_watched: item.last_watched,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,tmdb_id,type,season_number,episode_number',
        });

      if (!error) {
        synced.push(i);
      }
    } catch (err) {
      console.error('Failed to sync item:', err);
    }
  }

  if (synced.length > 0) {
    const remaining = queue.filter((_, idx) => !synced.includes(idx));
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remaining));
    } catch (err) {
      console.error('Failed to update queue after sync:', err);
    }
  }
};

export const watchHistoryService = {
  async add(userId: string, item: Omit<WatchHistoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    updateLocalCache(userId, item);

    try {
      await syncOfflineQueue();

      const { error } = await supabase
        .from('watch_history')
        .upsert({
          user_id: userId,
          tmdb_id: item.tmdb_id,
          type: item.type,
          title: item.title,
          poster_path: item.poster_path,
          progress: item.progress,
          duration: item.duration,
          last_position: item.last_position,
          season_number: item.season_number,
          episode_number: item.episode_number,
          last_watched: item.last_watched,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,tmdb_id,type,season_number,episode_number',
        });

      if (error) throw error;
    } catch (err) {
      addToLocalQueue(userId, item);
      console.warn('Saved to local storage (offline):', err);
    }
  },

  async list(userId: string, limit = 20): Promise<WatchHistoryItem[]> {
    try {
      await syncOfflineQueue();

      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', userId)
        .order('last_watched', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (data) {
        try {
          const cacheKey = `${LOCAL_CACHE_KEY}:${userId}`;
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
      }

      return data || [];
    } catch (err) {
      console.warn('Loading from local cache (offline):', err);
      try {
        const cacheKey = `${LOCAL_CACHE_KEY}:${userId}`;
        const cached = localStorage.getItem(cacheKey);
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
  },

  async get(userId: string, tmdbId: number, type: 'movie' | 'tv', seasonNumber?: number, episodeNumber?: number): Promise<WatchHistoryItem | null> {
    let query = supabase
      .from('watch_history')
      .select('*')
      .eq('user_id', userId)
      .eq('tmdb_id', tmdbId)
      .eq('type', type);

    if (type === 'tv' && seasonNumber !== undefined && episodeNumber !== undefined) {
      query = query.eq('season_number', seasonNumber).eq('episode_number', episodeNumber);
    }

    const { data, error } = await query.single();

    if (error && (error as any).code !== 'PGRST116') throw error;
    return data || null;
  },

  async remove(userId: string, tmdbId: number, type: 'movie' | 'tv', seasonNumber?: number, episodeNumber?: number): Promise<void> {
    // Mark optional parameters as used to satisfy TypeScript noUnusedParameters
    void seasonNumber;
    void episodeNumber;

    // Remove from local cache first
    try {
      const cacheKey = `${LOCAL_CACHE_KEY}:${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const items: WatchHistoryItem[] = JSON.parse(cached);
        const filtered = items.filter(item => {
          // For Continue Watching, when user removes a title we want to
          // remove *all* history entries for that movie/show, not just
          // a single episode. So we match only on tmdb_id + type.
          return !(item.tmdb_id === tmdbId && item.type === type);
        });
        localStorage.setItem(cacheKey, JSON.stringify(filtered));
      }
    } catch (err) {
      console.error('Failed to remove from local cache:', err);
    }

    // Remove from offline queue
    try {
      const queue = getLocalQueue();
      const filtered = queue.filter(item => {
        // Same rule as cache: drop any queued entry for this title
        // regardless of season/episode.
        return !(item.tmdb_id === tmdbId && item.type === type);
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.error('Failed to remove from offline queue:', err);
    }

    // Remove from database
    try {
      let query = supabase
        .from('watch_history')
        .delete()
        .eq('user_id', userId)
        .eq('tmdb_id', tmdbId)
        .eq('type', type);

      const { error } = await query;
      if (error) throw error;
    } catch (err) {
      console.warn('Failed to remove from database (may be offline):', err);
    }
  },

  async clear(userId: string): Promise<void> {
    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    try {
      const cacheKey = `${LOCAL_CACHE_KEY}:${userId}`;
      localStorage.removeItem(cacheKey);
    } catch {}
  },

  syncOfflineData: syncOfflineQueue,
};
