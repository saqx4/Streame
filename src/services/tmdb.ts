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

import type { PlayerServer } from '../stores/servers';

// Streaming service URLs
export const getStreamingUrl = (
  tmdbId: number,
  type: 'movie' | 'tv',
  serverKey: string,
  serversList: PlayerServer[],
  season?: number,
  episode?: number,
  startAt?: number
): string => {
  const server = serversList.find(s => s.id === serverKey);
  if (!server) return '';

  let url = type === 'movie' ? server.movie_url_pattern : server.tv_url_pattern;
  if (!url) return '';

  url = url.replace('{tmdbId}', tmdbId.toString());
  if (type === 'tv') {
    url = url.replace('{season}', season?.toString() || '1');
    url = url.replace('{episode}', episode?.toString() || '1');
  }

  const start = startAt && startAt > 0 ? Math.floor(startAt) : 0;
  if (url.includes('{startAtParam}')) {
    url = url.replace('{startAtParam}', start > 0 ? `&startAt=${start}` : '');
  } else if (start > 0) {
    // If it's just meant to append &startAt
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}startAt=${start}`;
  }

  return url;
};
