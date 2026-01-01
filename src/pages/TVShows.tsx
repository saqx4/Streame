import { useState, useEffect } from 'react';
import MediaRow from '../components/MediaRow';
import MediaGrid from '../components/MediaGrid';
import MediaFilter from '../components/MediaFilter';
import type { FilterOptions } from '../components/MediaFilter';
import type { TVShow } from '../types';
import { tmdbService } from '../services/tmdb';
import './TVShows.css';

const TVShows = () => {
  const [popularTVShows, setPopularTVShows] = useState<TVShow[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<TVShow[]>([]);
  const [onTheAirTVShows, setOnTheAirTVShows] = useState<TVShow[]>([]);
  const [airingTodayTVShows, setAiringTodayTVShows] = useState<TVShow[]>([]);
  const [trendingTVShows, setTrendingTVShows] = useState<TVShow[]>([]);
  const [dramaTVShows, setDramaTVShows] = useState<TVShow[]>([]);
  const [comedyTVShows, setComedyTVShows] = useState<TVShow[]>([]);
  const [actionTVShows, setActionTVShows] = useState<TVShow[]>([]);
  const [sciFiTVShows, setSciFiTVShows] = useState<TVShow[]>([]);
  const [arabicTVShows, setArabicTVShows] = useState<TVShow[]>([]);
  const [filteredTVShows, setFilteredTVShows] = useState<TVShow[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchTVShows = async () => {
      try {
        setLoading(true);
        setError(null);

        const [popular, topRated, onTheAir, airingToday, trending, drama, comedy, action, sciFi, arabic] = await Promise.all([
          tmdbService.getPopularTVShows(),
          tmdbService.getTopRatedTVShows(),
          tmdbService.getOnTheAirTVShows(),
          tmdbService.getAiringTodayTVShows(),
          tmdbService.getTrendingTVShows('week'),
          tmdbService.getPopularTVShows(2),
          tmdbService.getPopularTVShows(3),
          tmdbService.getTopRatedTVShows(2),
          tmdbService.getTopRatedTVShows(3),
          tmdbService.getArabicTVShows(),
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
        setArabicTVShows(arabic.results);
      } catch (err) {
        console.error('Error fetching TV shows:', err);
        setError('Failed to load TV shows. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTVShows();
  }, []);

  const handleFilterChange = async (filters: FilterOptions) => {
    try {
      setFilterLoading(true);
      setActiveFilters(filters);
      
      const response = await tmdbService.discoverTVShows(1, filters);
      setFilteredTVShows(response.results);
    } catch (err) {
      console.error('Error fetching filtered TV shows:', err);
    } finally {
      setFilterLoading(false);
    }
  };

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
        <MediaFilter onFilterChange={handleFilterChange} type="tv" />
      </div>

      <div className="tv-shows-content">
        {activeFilters && (
          <MediaGrid
            items={filteredTVShows}
            type="tv"
            title="Filtered Results"
            loading={filterLoading}
          />
        )}

        {!activeFilters && (
          <>
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

        <MediaRow
          items={arabicTVShows}
          type="tv"
          title="Arabic TV Shows"
          loading={loading}
          category="arabic"
        />
        </>
        )}
      </div>
    </div>
  );
};

export default TVShows;
