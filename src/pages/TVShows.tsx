import React, { useState, useEffect } from 'react';
import MediaRow from '../components/MediaRow';
import type { TVShow } from '../types';
import { tmdbService } from '../services/tmdb';
import './TVShows.css';

const TVShows: React.FC = () => {
  const [popularTVShows, setPopularTVShows] = useState<TVShow[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<TVShow[]>([]);
  const [onTheAirTVShows, setOnTheAirTVShows] = useState<TVShow[]>([]);
  const [airingTodayTVShows, setAiringTodayTVShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchTVShows = async () => {
      try {
        setLoading(true);
        setError(null);

        const [popular, topRated, onTheAir, airingToday] = await Promise.all([
          tmdbService.getPopularTVShows(),
          tmdbService.getTopRatedTVShows(),
          tmdbService.getOnTheAirTVShows(),
          tmdbService.getAiringTodayTVShows(),
        ]);

        setPopularTVShows(popular.results);
        setTopRatedTVShows(topRated.results);
        setOnTheAirTVShows(onTheAir.results);
        setAiringTodayTVShows(airingToday.results);
      } catch (err) {
        console.error('Error fetching TV shows:', err);
        setError('Failed to load TV shows. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTVShows();
  }, []);

  if (error) {
    return (
      <div className="tv-shows-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="tv-shows">
      <div className="tv-shows-header">
        <h1 className="tv-shows-title">TV Shows</h1>
      </div>

      <div className="tv-shows-content">
        <MediaRow
          items={popularTVShows}
          type="tv"
          title="Popular TV Shows"
          loading={loading}
        />

        <MediaRow
          items={topRatedTVShows}
          type="tv"
          title="Top Rated TV Shows"
          loading={loading}
        />

        <MediaRow
          items={onTheAirTVShows}
          type="tv"
          title="On The Air"
          loading={loading}
        />

        <MediaRow
          items={airingTodayTVShows}
          type="tv"
          title="Airing Today"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default TVShows;
