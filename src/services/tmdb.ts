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
    const response = await tmdbApi.get(`/trending/all/${timeWindow}`);
    return response.data;
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
    const params: any = {
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
    const params: any = {
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

export const getProfileUrl = (path: string | null, size: string = 'w185'): string => {
  if (!path) return 'https://via.placeholder.com/185x278/333333/ffffff?text=No+Photo';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Streaming service URLs
export const getStreamingUrl = (
  tmdbId: number,
  type: 'movie' | 'tv',
  server: 'server1' | 'server2' | 'server3' | 'server4' | 'server5' | 'server6',
  season?: number,
  episode?: number
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
    default:
      return '';
  }
};
