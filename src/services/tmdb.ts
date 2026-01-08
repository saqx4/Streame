import axios from 'axios';
import type {
  Movie,
  TVShow,
  MovieDetails,
  TVShowDetails,
  TMDBResponse,
  SearchResponse,
} from '../types';
import type { PlayerServerKey } from './playerServers';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '3308647fabe47a844ab269e6eab19132';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

import { cachedFetch } from '../lib/cache';

// Create axios instance with default config
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export const tmdbService = {
  // Movies
  getPopularMovies: async (page = 1): Promise<TMDBResponse<Movie>> => {
    return cachedFetch(`movie_popular_${page}`, async () => {
      const response = await tmdbApi.get('/movie/popular', { params: { page } });
      return response.data;
    });
  },

  getTopRatedMovies: async (page = 1): Promise<TMDBResponse<Movie>> => {
    return cachedFetch(`movie_top_rated_${page}`, async () => {
      const response = await tmdbApi.get('/movie/top_rated', { params: { page } });
      return response.data;
    });
  },

  getNowPlayingMovies: async (page = 1): Promise<TMDBResponse<Movie>> => {
    const response = await tmdbApi.get('/movie/now_playing', { params: { page } });
    return response.data;
  },

  getUpcomingMovies: async (page = 1): Promise<TMDBResponse<Movie>> => {
    const response = await tmdbApi.get('/movie/upcoming', { params: { page } });
    return response.data;
  },

  getMovieDetails: async (movieId: number): Promise<MovieDetails> => {
    return cachedFetch(`movie_details_${movieId}`, async () => {
      const response = await tmdbApi.get(`/movie/${movieId}`);
      return response.data;
    });
  },

  // TV Shows
  getPopularTVShows: async (page = 1): Promise<TMDBResponse<TVShow>> => {
    return cachedFetch(`tv_popular_${page}`, async () => {
      const response = await tmdbApi.get('/tv/popular', { params: { page } });
      return response.data;
    });
  },

  getTopRatedTVShows: async (page = 1): Promise<TMDBResponse<TVShow>> => {
    const response = await tmdbApi.get('/tv/top_rated', { params: { page } });
    return response.data;
  },

  getOnTheAirTVShows: async (page = 1): Promise<TMDBResponse<TVShow>> => {
    const response = await tmdbApi.get('/tv/on_the_air', { params: { page } });
    return response.data;
  },

  getAiringTodayTVShows: async (page = 1): Promise<TMDBResponse<TVShow>> => {
    const response = await tmdbApi.get('/tv/airing_today', { params: { page } });
    return response.data;
  },

  getTVShowDetails: async (tvId: number): Promise<TVShowDetails> => {
    return cachedFetch(`tv_details_${tvId}`, async () => {
      const response = await tmdbApi.get(`/tv/${tvId}`);
      return response.data;
    });
  },

  getSeasonDetails: async (tvId: number, seasonNumber: number) => {
    const response = await tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}`);
    return response.data;
  },

  // Search
  searchMulti: async (query: string, page = 1): Promise<SearchResponse> => {
    const response = await tmdbApi.get('/search/multi', {
      params: { query, page },
    });
    return response.data;
  },

  searchMovies: async (query: string, page = 1): Promise<TMDBResponse<Movie>> => {
    const response = await tmdbApi.get('/search/movie', {
      params: { query, page },
    });
    return response.data;
  },

  searchTVShows: async (query: string, page = 1): Promise<TMDBResponse<TVShow>> => {
    const response = await tmdbApi.get('/search/tv', {
      params: { query, page },
    });
    return response.data;
  },

  // Trending
  getTrendingMovies: async (timeWindow: 'day' | 'week' = 'week'): Promise<TMDBResponse<Movie>> => {
    const response = await tmdbApi.get(`/trending/movie/${timeWindow}`);
    return response.data;
  },

  getTrendingTVShows: async (timeWindow: 'day' | 'week' = 'week'): Promise<TMDBResponse<TVShow>> => {
    const response = await tmdbApi.get(`/trending/tv/${timeWindow}`);
    return response.data;
  },

  getTrendingAll: async (timeWindow: 'day' | 'week' = 'week'): Promise<SearchResponse> => {
    return cachedFetch(`trending_all_${timeWindow}`, async () => {
      const response = await tmdbApi.get(`/trending/all/${timeWindow}`);
      return response.data;
    });
  },

  // Credits (Cast & Crew)
  getMovieCredits: async (movieId: number) => {
    const response = await tmdbApi.get(`/movie/${movieId}/credits`);
    return response.data;
  },

  getTVShowCredits: async (tvId: number) => {
    const response = await tmdbApi.get(`/tv/${tvId}/credits`);
    return response.data;
  },

  // Videos (Trailers)
  getMovieVideos: async (movieId: number) => {
    const response = await tmdbApi.get(`/movie/${movieId}/videos`);
    return response.data;
  },

  getTVShowVideos: async (tvId: number) => {
    const response = await tmdbApi.get(`/tv/${tvId}/videos`);
    return response.data;
  },

  // Reviews
  getMovieReviews: async (movieId: number, page = 1) => {
    const response = await tmdbApi.get(`/movie/${movieId}/reviews`, { params: { page } });
    return response.data;
  },

  getTVShowReviews: async (tvId: number, page = 1) => {
    const response = await tmdbApi.get(`/tv/${tvId}/reviews`, { params: { page } });
    return response.data;
  },

  // Images (Logos)
  getMovieImages: async (movieId: number) => {
    const response = await tmdbApi.get(`/movie/${movieId}/images`, {
      params: { include_image_language: 'en,null' },
    });
    return response.data;
  },

  getTVShowImages: async (tvId: number) => {
    const response = await tmdbApi.get(`/tv/${tvId}/images`, {
      params: { include_image_language: 'en,null' },
    });
    return response.data;
  },

  // Similar Content
  getSimilarMovies: async (movieId: number, page = 1): Promise<TMDBResponse<Movie>> => {
    const response = await tmdbApi.get(`/movie/${movieId}/similar`, { params: { page } });
    return response.data;
  },

  getSimilarTVShows: async (tvId: number, page = 1): Promise<TMDBResponse<TVShow>> => {
    const response = await tmdbApi.get(`/tv/${tvId}/similar`, { params: { page } });
    return response.data;
  },

  // Recommendations
  getMovieRecommendations: async (movieId: number, page = 1): Promise<TMDBResponse<Movie>> => {
    const response = await tmdbApi.get(`/movie/${movieId}/recommendations`, { params: { page } });
    return response.data;
  },

  getTVShowRecommendations: async (tvId: number, page = 1): Promise<TMDBResponse<TVShow>> => {
    const response = await tmdbApi.get(`/tv/${tvId}/recommendations`, { params: { page } });
    return response.data;
  },

  // Arabic Content (using discover endpoint with language filter)
  getArabicMovies: async (page = 1): Promise<TMDBResponse<Movie>> => {
    const response = await tmdbApi.get('/discover/movie', {
      params: {
        page,
        with_original_language: 'ar',
        sort_by: 'popularity.desc',
      },
    });
    return response.data;
  },

  getArabicTVShows: async (page = 1): Promise<TMDBResponse<TVShow>> => {
    const response = await tmdbApi.get('/discover/tv', {
      params: {
        page,
        with_original_language: 'ar',
        sort_by: 'popularity.desc',
      },
    });
    return response.data;
  },

  // Discover with filters
  discoverMovies: async (
    page = 1,
    filters?: {
      genre?: number;
      language?: string;
      sortBy?: string;
      year?: number;
    }
  ): Promise<TMDBResponse<Movie>> => {
    const params: Record<string, string | number> = {
      page,
      sort_by: filters?.sortBy || 'popularity.desc',
    };

    if (filters?.genre) params.with_genres = filters.genre;
    if (filters?.language) params.with_original_language = filters.language;
    if (filters?.year) params.primary_release_year = filters.year;

    const response = await tmdbApi.get('/discover/movie', { params });
    return response.data;
  },

  discoverTVShows: async (
    page = 1,
    filters?: {
      genre?: number;
      language?: string;
      sortBy?: string;
      year?: number;
    }
  ): Promise<TMDBResponse<TVShow>> => {
    const params: Record<string, string | number> = {
      page,
      sort_by: filters?.sortBy || 'popularity.desc',
    };

    if (filters?.genre) params.with_genres = filters.genre;
    if (filters?.language) params.with_original_language = filters.language;
    if (filters?.year) params.first_air_date_year = filters.year;

    const response = await tmdbApi.get('/discover/tv', { params });
    return response.data;
  },
};

// Helper functions for image URLs
const svgPlaceholder = (w: number, h: number, text: string, bg: string): string => {
  const safeText = text.replace(/[<>]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" opacity="0.85">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const getImageUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return svgPlaceholder(500, 750, 'No Image', '#333333');
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: string = 'w1280'): string => {
  if (!path) return svgPlaceholder(1280, 720, 'No Backdrop', '#333333');
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getPosterUrl = (path: string | null, size: string = 'w342'): string => {
  if (!path) return svgPlaceholder(342, 513, 'No Poster', '#1a1a1a');
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getProfileUrl = (path: string | null, size: string = 'w185'): string => {
  if (!path) return svgPlaceholder(185, 278, 'No Photo', '#333333');
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Streaming service URLs
export const getStreamingUrl = (
  tmdbId: number,
  type: 'movie' | 'tv',
  server: PlayerServerKey,
  season?: number,
  episode?: number,
  startAt?: number
): string => {
  switch (server) {
    case 'server1':
      if (type === 'movie') {
        return `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`;
      } else {
        return `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      }
    case 'server2':
      if (type === 'movie') {
        return `https://vidsrc.to/embed/movie/${tmdbId}`;
      } else {
        return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
      }
    case 'server3':
      if (type === 'movie') {
        return `https://vidsrc-embed.ru/embed/movie?tmdb=${tmdbId}`;
      } else {
        return `https://vidsrc-embed.ru/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      }
    case 'server4':
      if (type === 'movie') {
        return `https://www.2embed.cc/embed/${tmdbId}`;
      } else {
        return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
      }
    case 'server5':
      if (type === 'movie') {
        return `https://player.videasy.net/movie/${tmdbId}`;
      } else {
        return `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`;
      }
    case 'server6':
      if (type === 'movie') {
        return `https://www.vidking.net/embed/movie/${tmdbId}?color=e50914`;
      } else {
        return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=e50914`;
      }
    case 'server7': {
      // VidLink (JW player) - supports startAt
      const common = `https://vidlink.pro/${type === 'movie' ? 'movie' : 'tv'}/${tmdbId}${type === 'tv' ? `/${season}/${episode}` : ''
        }`;
      const base = `${common}?player=jw&primaryColor=${type === 'movie' ? '006fee' : 'f5a524'
        }&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false`;
      const start = startAt && startAt > 0 ? Math.floor(startAt) : 0;
      return start > 0 ? `${base}&startAt=${start}` : base;
    }
    case 'server8': {
      // VidLink alt - supports startAt
      const common = `https://vidlink.pro/${type === 'movie' ? 'movie' : 'tv'}/${tmdbId}${type === 'tv' ? `/${season}/${episode}` : ''
        }`;
      const base = `${common}?primaryColor=${type === 'movie' ? '006fee' : 'f5a524'}&autoplay=false`;
      const start = startAt && startAt > 0 ? Math.floor(startAt) : 0;
      return start > 0 ? `${base}&startAt=${start}` : base;
    }
    case 'server9':
      return type === 'movie'
        ? `https://embed.su/embed/movie/${tmdbId}`
        : `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
    case 'server10':
      return type === 'movie'
        ? `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
    case 'server11':
      return type === 'movie'
        ? `https://filmku.stream/embed/${tmdbId}`
        : `https://filmku.stream/embed/series?tmdb=${tmdbId}&sea=${season}&epi=${episode}`;
    case 'server12':
      return type === 'movie'
        ? `https://www.nontongo.win/embed/movie/${tmdbId}`
        : `https://www.nontongo.win/embed/tv/${tmdbId}/${season}/${episode}`;
    case 'server13':
      return type === 'movie'
        ? `https://autoembed.co/movie/tmdb/${tmdbId}`
        : `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`;
    case 'server14':
      return type === 'movie'
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
    case 'server17':
      return type === 'movie'
        ? `https://vidsrc.icu/embed/movie/${tmdbId}`
        : `https://vidsrc.icu/embed/tv/${tmdbId}/${season}/${episode}`;
    case 'server18':
      return type === 'movie'
        ? `https://moviesapi.club/movie/${tmdbId}`
        : `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`;
    case 'server26':
      return type === 'movie'
        ? `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`
        : `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
    case 'server27': {
      // VidLink themed - supports startAt
      if (type === 'movie') {
        const base = `https://vidlink.pro/movie/${tmdbId}?primaryColor=1e40af&autoplay=false`;
        const start = startAt && startAt > 0 ? Math.floor(startAt) : 0;
        return start > 0 ? `${base}&startAt=${start}` : base;
      }
      const base = `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=1e40af&autoplay=false`;
      const start = startAt && startAt > 0 ? Math.floor(startAt) : 0;
      return start > 0 ? `${base}&startAt=${start}` : base;
    }
    case 'server28':
      return type === 'movie'
        ? `https://www.embedsoap.com/embed/movie/?id=${tmdbId}`
        : `https://www.embedsoap.com/embed/tv/?id=${tmdbId}&s=${season}&e=${episode}`;
    case 'server29':
      return type === 'movie'
        ? `https://111movies.com/movie/${tmdbId}`
        : `https://111movies.com/tv/${tmdbId}/${season}/${episode}`;
    case 'server30':
      return type === 'movie'
        ? `https://vidfast.pro/movie/${tmdbId}`
        : `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}`;
    default:
      return '';
  }
};
