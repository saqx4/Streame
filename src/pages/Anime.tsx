import React, { useState, useEffect } from 'react';
import MediaRow from '../components/MediaRow';
import type { TVShow } from '../types';
import { tmdbService } from '../services/tmdb';
import './Anime.css';

const Anime: React.FC = () => {
  const [popularAnime, setPopularAnime] = useState<TVShow[]>([]);
  const [topRatedAnime, setTopRatedAnime] = useState<TVShow[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<TVShow[]>([]);
  const [actionAnime, setActionAnime] = useState<TVShow[]>([]);
  const [comedyAnime, setComedyAnime] = useState<TVShow[]>([]);
  const [dramaAnime, setDramaAnime] = useState<TVShow[]>([]);
  const [fantasyAnime, setFantasyAnime] = useState<TVShow[]>([]);
  const [sciFiAnime, setSciFiAnime] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true);
        setError(null);

        // Using TV shows API with different pages to get variety
        const [popular, topRated, trending, action, comedy, drama, fantasy, sciFi] = await Promise.all([
          tmdbService.getPopularTVShows(),
          tmdbService.getTopRatedTVShows(),
          tmdbService.getTrendingTVShows('week'),
          tmdbService.getPopularTVShows(2),
          tmdbService.getPopularTVShows(3),
          tmdbService.getTopRatedTVShows(2),
          tmdbService.getOnTheAirTVShows(),
          tmdbService.getAiringTodayTVShows(),
        ]);

        setPopularAnime(popular.results);
        setTopRatedAnime(topRated.results);
        setTrendingAnime(trending.results);
        setActionAnime(action.results);
        setComedyAnime(comedy.results);
        setDramaAnime(drama.results);
        setFantasyAnime(fantasy.results);
        setSciFiAnime(sciFi.results);
      } catch (err) {
        console.error('Error fetching anime:', err);
        setError('Failed to load anime. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, []);

  if (error) {
    return (
      <div className="anime-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="anime">
      <div className="anime-header">
        <h1 className="anime-title">Anime</h1>
      </div>

      <div className="anime-content">
        <MediaRow
          items={popularAnime}
          type="tv"
          title="Popular Anime"
          loading={loading}
          category="popular"
        />

        <MediaRow
          items={topRatedAnime}
          type="tv"
          title="Top Rated Anime"
          loading={loading}
          category="top-rated"
        />

        <MediaRow
          items={trendingAnime}
          type="tv"
          title="Trending Anime"
          loading={loading}
          category="trending"
        />

        <MediaRow
          items={actionAnime}
          type="tv"
          title="Action Anime"
          loading={loading}
          category="action"
        />

        <MediaRow
          items={comedyAnime}
          type="tv"
          title="Comedy Anime"
          loading={loading}
          category="comedy"
        />

        <MediaRow
          items={dramaAnime}
          type="tv"
          title="Drama Anime"
          loading={loading}
          category="drama"
        />

        <MediaRow
          items={fantasyAnime}
          type="tv"
          title="Fantasy Anime"
          loading={loading}
          category="fantasy"
        />

        <MediaRow
          items={sciFiAnime}
          type="tv"
          title="Sci-Fi Anime"
          loading={loading}
          category="sci-fi"
        />
      </div>
    </div>
  );
};

export default Anime;
