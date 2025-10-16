import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import MediaRow from '../components/MediaRow';
import type { Movie, TVShow } from '../types';
import { tmdbService } from '../services/tmdb';
import './Home.css';

const Home: React.FC = () => {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTVShows, setTrendingTVShows] = useState<TVShow[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<TVShow[]>([]);
  const [heroItems, setHeroItems] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch trending content for hero
        const [trendingAllResponse, trendingMoviesResponse, trendingTVResponse, popularMoviesResponse, popularTVResponse] = await Promise.all([
          tmdbService.getTrendingAll('week'),
          tmdbService.getTrendingMovies('week'),
          tmdbService.getTrendingTVShows('week'),
          tmdbService.getPopularMovies(),
          tmdbService.getPopularTVShows(),
        ]);

        // Set hero items (mix of trending movies and TV shows)
        const heroContent = trendingAllResponse.results.slice(0, 5);
        setHeroItems(heroContent);

        setTrendingMovies(trendingMoviesResponse.results.slice(0, 20));
        setTrendingTVShows(trendingTVResponse.results.slice(0, 20));
        setPopularMovies(popularMoviesResponse.results.slice(0, 20));
        setPopularTVShows(popularTVResponse.results.slice(0, 20));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="home-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section */}
      {heroItems.length > 0 && (
        <Hero 
          items={heroItems} 
          type={heroItems[0] && 'title' in heroItems[0] ? 'movie' : 'tv'} 
        />
      )}

      {/* Content Sections */}
      <div className="home-content">
        <MediaRow
          items={trendingMovies}
          type="movie"
          title="Trending Movies"
          loading={loading}
        />

        <MediaRow
          items={trendingTVShows}
          type="tv"
          title="Trending TV Shows"
          loading={loading}
        />

        <MediaRow
          items={popularMovies}
          type="movie"
          title="Popular Movies"
          loading={loading}
        />

        <MediaRow
          items={popularTVShows}
          type="tv"
          title="Popular TV Shows"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Home;
