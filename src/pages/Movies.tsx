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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        const [popular, topRated, nowPlaying, upcoming] = await Promise.all([
          tmdbService.getPopularMovies(),
          tmdbService.getTopRatedMovies(),
          tmdbService.getNowPlayingMovies(),
          tmdbService.getUpcomingMovies(),
        ]);

        setPopularMovies(popular.results);
        setTopRatedMovies(topRated.results);
        setNowPlayingMovies(nowPlaying.results);
        setUpcomingMovies(upcoming.results);
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
        />

        <MediaRow
          items={topRatedMovies}
          type="movie"
          title="Top Rated Movies"
          loading={loading}
        />

        <MediaRow
          items={nowPlayingMovies}
          type="movie"
          title="Now Playing"
          loading={loading}
        />

        <MediaRow
          items={upcomingMovies}
          type="movie"
          title="Upcoming Movies"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Movies;
