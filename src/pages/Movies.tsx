import React, { useState, useEffect } from 'react';
import MediaRow from '../components/MediaRow';
import type { Movie } from '../types';
import { tmdbService } from '../services/tmdb';
import './Movies.css';

const Movies: React.FC = () => {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [dramaMovies, setDramaMovies] = useState<Movie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        const [popular, topRated, nowPlaying, upcoming, trending, action, comedy, drama, horror] = await Promise.all([
          tmdbService.getPopularMovies(),
          tmdbService.getTopRatedMovies(),
          tmdbService.getNowPlayingMovies(),
          tmdbService.getUpcomingMovies(),
          tmdbService.getTrendingMovies('week'),
          tmdbService.getPopularMovies(2),
          tmdbService.getPopularMovies(3),
          tmdbService.getTopRatedMovies(2),
          tmdbService.getTopRatedMovies(3),
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
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

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
      </div>

      <div className="movies-content">
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
      </div>
    </div>
  );
};

export default Movies;
