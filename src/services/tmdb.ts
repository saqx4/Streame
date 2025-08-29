import axios from 'axios';
import type {
  Movie,
  TVShow,
  MovieDetails,
  TVShowDetails,
  TMDBResponse,
  SearchResponse,
} from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '3308647fabe47a844ab269e6eab19132';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

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
    const response = await tmdbApi.get('/movie/popular', { params: { page } });
    return response.data;
  },

  getTopRatedMovies: async (page = 1): Promise<TMDBResponse<Movie>> => {
    const response = await tmdbApi.get('/movie/top_rated', { params: { page } });
    return response.data;
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
    const response = await tmdbApi.get(`/movie/${movieId}`);
    return response.data;
  },

  // TV Shows
  getPopularTVShows: async (page = 1): Promise<TMDBResponse<TVShow>> => {
    const response = await tmdbApi.get('/tv/popular', { params: { page } });
    return response.data;
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
    const response = await tmdbApi.get(`/tv/${tvId}`);
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
    const response = await tmdbApi.get(`/trending/all/${timeWindow}`);
    return response.data;
  },
};

// Helper functions for image URLs
export const getImageUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return 'https://via.placeholder.com/500x750/333333/ffffff?text=No+Image';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: string = 'w1280'): string => {
  if (!path) return 'https://via.placeholder.com/1280x720/333333/ffffff?text=No+Backdrop';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getPosterUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return 'https://via.placeholder.com/500x750/333333/ffffff?text=No+Poster';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Streaming service URLs
export const getStreamingUrl = (
  tmdbId: number,
  type: 'movie' | 'tv',
  server: 'multiembed' | 'vidsrc' | 'vidfast' | 'vidzee' | 'embed_su' | 'vidsrc_cc' | 'autoembed',
  season?: number,
  episode?: number
): string => {
  switch (server) {
    case 'multiembed':
      if (type === 'movie') {
        return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
      } else {
        return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
      }
    case 'vidsrc':
      if (type === 'movie') {
        return `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`;
      } else {
        return `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      }
    case 'vidfast':
      if (type === 'movie') {
        return `https://vidfast.pro/movie/${tmdbId}?autoPlay=true`;
      } else {
        return `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoPlay=true`;
      }
    case 'vidzee':
      if (type === 'movie') {
        return `https://player.vidzee.wtf/embed/movie/${tmdbId}`;
      } else {
        return `https://player.vidzee.wtf/embed/tv/${tmdbId}/${season}/${episode}`;
      }
    case 'embed_su':
      if (type === 'movie') {
        return `https://embed.su/embed/movie/${tmdbId}`;
      } else {
        return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
      }
    case 'vidsrc_cc':
      if (type === 'movie') {
        return `https://vidsrc.cc/v2/embed/movie/${tmdbId}?autoPlay=false`;
      } else {
        return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=false`;
      }
    case 'autoembed':
      if (type === 'movie') {
        return `https://player.autoembed.cc/embed/movie/${tmdbId}`;
      } else {
        return `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
      }
    default:
      return '';
  }
};
