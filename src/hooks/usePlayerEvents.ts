import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { watchHistoryService } from '../services/watchHistory';

export type PlayerEventType = 'play' | 'pause' | 'seeked' | 'ended' | 'timeupdate';

export interface PlayerEventData {
  event: PlayerEventType;
  currentTime: number;
  duration: number;
  mediaId?: string | number;
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export interface UsePlayerEventsOptions {
  tmdbId: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  season?: number;
  episode?: number;
  runtime?: number;
}

export function usePlayerEvents(options: UsePlayerEventsOptions) {
  const { user } = useAuth();
  const { tmdbId, type, title, posterPath, season, episode, runtime } = options;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(runtime || 0);
  const lastSavedTimeRef = useRef(0);
  const eventDataRef = useRef<PlayerEventData | null>(null);

  const saveToHistory = async (currentTime: number, duration: number) => {
    if (!user) {
      console.warn('⚠️ Cannot save watch history: User not logged in');
      return;
    }
    
    // Only save if more than 5 seconds have passed since last save
    if (Math.abs(currentTime - lastSavedTimeRef.current) < 5) return;
    
    const safeDuration = duration > 0 ? Math.round(duration) : 0;
    const progress = safeDuration > 0 ? Math.min((currentTime / safeDuration) * 100, 95) : 50;
    
    try {
      console.log('💾 Saving watch history:', {
        title,
        currentTime: Math.floor(currentTime),
        duration: safeDuration,
        progress: Math.round(progress),
      });
      
      await watchHistoryService.add(user.id, {
        tmdb_id: tmdbId,
        type,
        title,
        poster_path: posterPath,
        progress,
        duration: safeDuration,
        last_position: Math.floor(currentTime),
        season_number: season,
        episode_number: episode,
        last_watched: new Date().toISOString(),
      });
      
      lastSavedTimeRef.current = currentTime;
      console.log('✅ Watch history saved successfully');
    } catch (err) {
      console.error('❌ Failed to save watch history:', err);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from common streaming server domains
      const allowedOrigins = [
        'https://vidlink.pro',
        'https://www.vidking.net',
        'https://vidsrc.xyz',
        'https://vidsrc.to',
        'https://vidsrc.me',
        'https://vidsrc.cc',
        'https://vidsrc.icu',
      ];
      
      if (!allowedOrigins.some(origin => event.origin.includes(origin.replace('https://', '')))) {
        return;
      }

      let data: any;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      // Handle different message formats
      if (data.type === 'PLAYER_EVENT' && data.data) {
        data = data.data;
      }

      if (!data.event || typeof data.currentTime !== 'number') {
        return;
      }

      const playerData: PlayerEventData = {
        event: data.event,
        currentTime: data.currentTime,
        duration: data.duration || duration,
      };

      console.log('🎬 Player event received:', {
        event: playerData.event,
        currentTime: Math.floor(playerData.currentTime),
        duration: playerData.duration,
        origin: event.origin,
      });

      eventDataRef.current = playerData;
      setCurrentTime(playerData.currentTime);
      
      if (playerData.duration > 0) {
        setDuration(playerData.duration);
      }

      switch (playerData.event) {
        case 'play':
          setIsPlaying(true);
          break;
        case 'pause':
          setIsPlaying(false);
          saveToHistory(playerData.currentTime, playerData.duration);
          break;
        case 'ended':
          setIsPlaying(false);
          saveToHistory(playerData.currentTime, playerData.duration);
          break;
        case 'timeupdate':
          // Save periodically during playback
          if (Math.abs(playerData.currentTime - lastSavedTimeRef.current) >= 30) {
            saveToHistory(playerData.currentTime, playerData.duration);
          }
          break;
        case 'seeked':
          setCurrentTime(playerData.currentTime);
          break;
      }
    };

    const handleBeforeUnload = () => {
      if (!user || !eventDataRef.current) return;
      
      // Save on page unload using sendBeacon for reliability
      const payload = {
        tmdb_id: tmdbId,
        type,
        title,
        poster_path: posterPath,
        progress: duration > 0 ? Math.min((eventDataRef.current.currentTime / duration) * 100, 95) : 50,
        duration,
        last_position: Math.floor(eventDataRef.current.currentTime),
        season_number: season,
        episode_number: episode,
        last_watched: new Date().toISOString(),
      };
      
      // Note: sendBeacon has limitations, but it's the best we can do for beforeunload
      navigator.sendBeacon('/api/save-history', JSON.stringify(payload));
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Save on unmount
      if (eventDataRef.current && user) {
        saveToHistory(eventDataRef.current.currentTime, eventDataRef.current.duration);
      }
    };
  }, [user, tmdbId, type, title, posterPath, season, episode, duration]);

  return { isPlaying, currentTime, duration };
}
