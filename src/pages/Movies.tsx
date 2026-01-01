import { useState, useEffect } from 'react';
import MediaRow from '../components/MediaRow';
import MediaGrid from '../components/MediaGrid';
import MediaFilter from '../components/MediaFilter';
import type { FilterOptions } from '../components/MediaFilter';
import type { Movie } from '../types';
import { tmdbService } from '../services/tmdb';
import './Movies.css';

const Movies = () => {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [dramaMovies, setDramaMovies] = useState<Movie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<Movie[]>([]);
  const [arabicMovies, setArabicMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        const [popular, topRated, nowPlaying, upcoming, trending, action, comedy, drama, horror, arabic] = await Promise.all([
          tmdbService.getPopularMovies(),
          tmdbService.getTopRatedMovies(),
          tmdbService.getNowPlayingMovies(),
          tmdbService.getUpcomingMovies(),
          tmdbService.getTrendingMovies('week'),
          tmdbService.getPopularMovies(2),
          tmdbService.getPopularMovies(3),
          tmdbService.getTopRatedMovies(2),
          tmdbService.getTopRatedMovies(3),
          tmdbService.getArabicMovies(),
        ]);

        setPopularMovies(popular.results);
        setTopRatedMovies(topRated.results);
        setNowPlayingMovies(nowPlaying.results);
        setUpcomingMovies(upcoming.results);
        setTrendingMovies(trending.results);
        setActionMovies(action.results);
        setComedyMovies(comedy.results);
        setDramaMovies(drama.results);
        setHorrorMovies(horror.results);
        setArabicMovies(arabic.results);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleFilterChange = async (filters: FilterOptions) => {
    try {
      setFilterLoading(true);
      setActiveFilters(filters);
      
      const response = await tmdbService.discoverMovies(1, filters);
      setFilteredMovies(response.results);
    } catch (err) {
      console.error('Error fetching filtered movies:', err);
    } finally {
      setFilterLoading(false);
    }
  };

  if (error) {
    return (
      <div className="movies-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="movies">
      <div className="movies-header">
        <h1 className="movies-title">Movies</h1>
        <MediaFilter onFilterChange={handleFilterChange} type="movie" />
      </div>

      <div className="movies-content">
        {activeFilters && (
          <MediaGrid
            items={filteredMovies}
            type="movie"
            title="Filtered Results"
            loading={filterLoading}
          />
        )}

        {!activeFilters && (
          <>
        <MediaRow
          items={popularMovies}
          type="movie"
          title="Popular Movies"
          loading={loading}
          category="popular"
        />

        <MediaRow
          items={topRatedMovies}
          type="movie"
          title="Top Rated Movies"
          loading={loading}
          category="top-rated"
        />

        <MediaRow
          items={nowPlayingMovies}
          type="movie"
          title="Now Playing"
          loading={loading}
          category="now-playing"
        />

        <MediaRow
          items={upcomingMovies}
          type="movie"
          title="Upcoming Movies"
          loading={loading}
          category="upcoming"
        />

        <MediaRow
          items={trendingMovies}
          type="movie"
          title="Trending Movies"
          loading={loading}
          category="trending"
        />

        <MediaRow
          items={actionMovies}
          type="movie"
          title="Action Movies"
          loading={loading}
          category="action"
        />

        <MediaRow
          items={comedyMovies}
          type="movie"
          title="Comedy Movies"
          loading={loading}
          category="comedy"
        />

        <MediaRow
          items={dramaMovies}
          type="movie"
          title="Drama Movies"
          loading={loading}
          category="drama"
        />

        <MediaRow
          items={horrorMovies}
          type="movie"
          title="Horror Movies"
          loading={loading}
          category="horror"
        />

        <MediaRow
          items={arabicMovies}
          type="movie"
          title="Arabic Movies"
          loading={loading}
          category="arabic"
        />
        </>
        )}
      </div>
    </div>
  );
};

export default Movies;
