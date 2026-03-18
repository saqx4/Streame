import { writable, get } from 'svelte/store';
import { supabase, isSupabaseEnabled } from '../lib/supabaseClient';

export interface PlayerServer {
  id: string;
  name: string;
  movie_url_pattern: string;
  tv_url_pattern: string;
  order_index: number;
  is_active: boolean;
}

export type PlayerServerKey = string; // UUID from DB

export const playerServers = writable<PlayerServer[]>([]);
export const serversLoading = writable(true);

// Fallback legacy servers in case DB is failing or empty
export const fallbackServers: PlayerServer[] = [
  { id: 'server7', name: '⭐ VidLink (JW)', movie_url_pattern: 'https://vidlink.pro/movie/{tmdbId}?player=jw&primaryColor=006fee&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false{startAtParam}', tv_url_pattern: 'https://vidlink.pro/tv/{tmdbId}/{season}/{episode}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false{startAtParam}', order_index: 0, is_active: true },
  { id: 'server8', name: '⭐ VidLink', movie_url_pattern: 'https://vidlink.pro/movie/{tmdbId}?primaryColor=006fee&autoplay=false{startAtParam}', tv_url_pattern: 'https://vidlink.pro/tv/{tmdbId}/{season}/{episode}?primaryColor=f5a524&autoplay=false{startAtParam}', order_index: 1, is_active: true },
  { id: 'server1', name: '⭐ Vidsrc.xyz', movie_url_pattern: 'https://vidsrc.me/embed/movie?tmdb={tmdbId}', tv_url_pattern: 'https://vidsrc.me/embed/tv?tmdb={tmdbId}&season={season}&episode={episode}', order_index: 2, is_active: true }
];

export const loadServers = async () => {
  if (!isSupabaseEnabled) {
    playerServers.set(fallbackServers);
    serversLoading.set(false);
    return;
  }
  try {
    const { data, error } = await supabase
      .from('streaming_servers')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (!error && data && data.length > 0) {
      playerServers.set(data.filter(s => s.is_active));
    } else {
      playerServers.set(fallbackServers);
    }
  } catch (err) {
    console.error('Failed to load servers', err);
    playerServers.set(fallbackServers);
  } finally {
    serversLoading.set(false);
  }
};

export const isPlayerServerKey = (key: string): boolean => {
  // Check if it exists in our loaded servers OR is a string
  return typeof key === 'string' && key.length > 0;
};
