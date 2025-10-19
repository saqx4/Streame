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
  const [trendingTVShows, setTrendingTVShows] = useState<TVShow[]>([]);
  const [dramaTVShows, setDramaTVShows] = useState<TVShow[]>([]);
  const [comedyTVShows, setComedyTVShows] = useState<TVShow[]>([]);
  const [actionTVShows, setActionTVShows] = useState<TVShow[]>([]);
  const [sciFiTVShows, setSciFiTVShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchTVShows = async () => {
      try {
        setLoading(true);
        setError(null);

        const [popular, topRated, onTheAir, airingToday, trending, drama, comedy, action, sciFi] = await Promise.all([
          tmdbService.getPopularTVShows(),
          tmdbService.getTopRatedTVShows(),
          tmdbService.getOnTheAirTVShows(),
          tmdbService.getAiringTodayTVShows(),
          tmdbService.getTrendingTVShows('week'),
          tmdbService.getPopularTVShows(2),
          tmdbService.getPopularTVShows(3),
          tmdbService.getTopRatedTVShows(2),
          tmdbService.getTopRatedTVShows(3),
        ]);

        setPopularTVShows(popular.results);
        setTopRatedTVShows(topRated.results);
        setOnTheAirTVShows(onTheAir.results);
        setAiringTodayTVShows(airingToday.results);
        setTrendingTVShows(trending.results);
        setDramaTVShows(drama.results);
        setComedyTVShows(comedy.results);
        setActionTVShows(action.results);
        setSciFiTVShows(sciFi.results);
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
          category="popular"
        />

        <MediaRow
          items={topRatedTVShows}
          type="tv"
          title="Top Rated TV Shows"
          loading={loading}
          category="top-rated"
        />

        <MediaRow
          items={onTheAirTVShows}
          type="tv"
          title="On The Air"
          loading={loading}
          category="on-the-air"
        />

        <MediaRow
          items={airingTodayTVShows}
          type="tv"
          title="Airing Today"
          loading={loading}
          category="airing-today"
        />

        <MediaRow
          items={trendingTVShows}
          type="tv"
          title="Trending TV Shows"
          loading={loading}
          category="trending"
        />

        <MediaRow
          items={dramaTVShows}
          type="tv"
          title="Drama TV Shows"
          loading={loading}
          category="drama"
        />

        <MediaRow
          items={comedyTVShows}
          type="tv"
          title="Comedy TV Shows"
          loading={loading}
          category="comedy"
        />

        <MediaRow
          items={actionTVShows}
          type="tv"
          title="Action TV Shows"
          loading={loading}
          category="action"
        />

        <MediaRow
          items={sciFiTVShows}
          type="tv"
          title="Sci-Fi TV Shows"
          loading={loading}
          category="sci-fi"
        />
      </div>
    </div>
  );
};

export default TVShows;
