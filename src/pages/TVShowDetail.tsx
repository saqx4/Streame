import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, Calendar, Tv, Play, Bookmark, X, CircleChevronLeft, CircleChevronRight } from 'lucide-react';
import type { TVShowDetails, TVShow } from '../types';
import { tmdbService, getBackdropUrl, getPosterUrl, getImageUrl } from '../services/tmdb';
import CastSection from '../components/CastSection';
import TrailersSection from '../components/TrailersSection';
import MediaRow from '../components/MediaRow';
import './TVShowDetail.css';
import '../components/Hero.css';
import { useAuth } from '../context/AuthContext';
import { userMediaService } from '../services/userMedia';
import { userProgressService } from '../services/userProgress';

const TVShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tvShow, setTVShow] = useState<TVShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'trailers' | 'cast' | 'similar'>('overview');
  const [cast, setCast] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [similarShows, setSimilarShows] = useState<TVShow[]>([]);
  const [lastWatched, setLastWatched] = useState<{ season: number; episode: number } | null>(null);
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [checkingWatchlist, setCheckingWatchlist] = useState(false);
  const [togglingWatchlist, setTogglingWatchlist] = useState(false);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const episodesRailRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [logoPath, setLogoPath] = useState<string | null>(null);

  useEffect(() => {
    const fetchTVShow = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const tvId = parseInt(id);
        
        // Fetch all data in parallel
        const [tvShowData, creditsData, videosData, similarData, imagesData] = await Promise.all([
          tmdbService.getTVShowDetails(tvId),
          tmdbService.getTVShowCredits(tvId),
          tmdbService.getTVShowVideos(tvId),
          tmdbService.getSimilarTVShows(tvId),
          tmdbService.getTVShowImages(tvId),
        ]);
        
        setTVShow(tvShowData);
        setCast(creditsData.cast || []);
        const results = videosData.results || [];
        setVideos(results);
        setSimilarShows(similarData.results || []);

        const logos: any[] = imagesData?.logos || [];
        const bestLogo = logos.find((l) => l?.iso_639_1 === 'en') || logos.find((l) => !l?.iso_639_1) || logos[0];
        setLogoPath(bestLogo?.file_path ?? null);

      } catch (err) {
        console.error('Error fetching TV show details:', err);
        setError('Failed to load TV show details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTVShow();
  }, [id]);

  // Check watchlist status when user or tvShow changes
  useEffect(() => {
    if (user && tvShow) {
      checkWatchlistStatus();
    } else {
      setInWatchlist(false);
      setLastWatched(null);
    }
  }, [user, tvShow]);

  // Load last watched episode for logged-in user (persisted in Supabase, fallback to local storage)
  useEffect(() => {
    const loadLastWatched = async () => {
      if (!user || !tvShow) {
        setLastWatched(null);
        return;
      }
      const key = `lastWatched:${user.id}:tv:${tvShow.id}`;
      try {
        // Try remote first
        const remote = await userProgressService.get(user.id, tvShow.id);
        if (remote) {
          setLastWatched(remote);
          localStorage.setItem(key, JSON.stringify(remote));
          return;
        }
      } catch (err) {
        console.warn('Failed to load remote last watched episode', err);
      }

      // Fallback to local cache
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            typeof parsed?.season === 'number' &&
            typeof parsed?.episode === 'number'
          ) {
            setLastWatched({ season: parsed.season, episode: parsed.episode });
          }
        } else {
          setLastWatched(null);
        }
      } catch (err) {
        console.warn('Failed to load last watched episode', err);
        setLastWatched(null);
      }
    };

    loadLastWatched();
  }, [user, tvShow]);

  const persistLastWatched = (episode: number) => {
    if (!user || !tvShow) return;
    const data = { season: selectedSeason, episode };
    setLastWatched(data);
    try {
      const key = `lastWatched:${user.id}:tv:${tvShow.id}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save last watched episode', err);
    }
    // Fire-and-forget remote persistence
    userProgressService.set(user.id, tvShow.id, data).catch((err: unknown) => {
      console.warn('Failed to persist last watched remotely', err);
    });
  };

  const handlePlayEpisode = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    if (tvShow) {
      persistLastWatched(1);
    }
    navigate(`/watch/tv/${tvShow?.id}/season/1/episode/1`);
  };

  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(1); // Reset to first episode when changing season
  };

  const handleEpisodeChange = (episode: number) => {
    setSelectedEpisode(episode);
    persistLastWatched(episode);
    if (tvShow) {
      navigate(`/watch/tv/${tvShow.id}/season/${selectedSeason}/episode/${episode}`);
    }
  };

  const formatAirDate = (date?: string) => {
    if (!date) return 'TBA';
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? 'TBA' : parsed.toLocaleDateString();
  };

  const checkEpisodeScrollButtons = () => {
    if (episodesRailRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = episodesRailRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const scrollEpisodes = (direction: 'left' | 'right') => {
    if (!episodesRailRef.current) return;
    const scrollAmount = episodesRailRef.current.clientWidth * 0.8;
    const next =
      direction === 'left'
        ? episodesRailRef.current.scrollLeft - scrollAmount
        : episodesRailRef.current.scrollLeft + scrollAmount;
    episodesRailRef.current.scrollTo({ left: next, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!tvShow) return;
    const fetchSeasonEpisodes = async () => {
      try {
        setEpisodesLoading(true);
        const seasonDetails = await tmdbService.getSeasonDetails(tvShow.id, selectedSeason);
        const seasonEpisodes = seasonDetails.episodes || [];
        setEpisodes(seasonEpisodes);
        if (seasonEpisodes.length > 0 && selectedEpisode > seasonEpisodes.length) {
          setSelectedEpisode(1);
        }
      } catch (err) {
        console.error('Failed to load season episodes', err);
        setEpisodes([]);
      } finally {
        setEpisodesLoading(false);
        setTimeout(checkEpisodeScrollButtons, 100);
      }
    };
    fetchSeasonEpisodes();
  }, [tvShow, selectedSeason]);

  useEffect(() => {
    const timer = setTimeout(checkEpisodeScrollButtons, 150);
    return () => clearTimeout(timer);
  }, [episodes]);

  const checkWatchlistStatus = async () => {
    if (!user || !tvShow) return;
    try {
      setCheckingWatchlist(true);
      const items = await userMediaService.list(user.id, 'watchlist');
      const isInList = items.some((item: { tmdb_id: number }) => item.tmdb_id === tvShow.id);
      console.log('Watchlist check:', { userId: user.id, tvShowId: tvShow.id, isInList, totalItems: items.length });
      setInWatchlist(isInList);
    } catch (err: unknown) {
      console.error('Failed to check watchlist:', err);
    } finally {
      setCheckingWatchlist(false);
    }
  };

  const toggleWatchlist = async () => {
    if (!user || !tvShow) {
      window.location.href = '/login';
      return;
    }
    try {
      setTogglingWatchlist(true);
      if (inWatchlist) {
        await userMediaService.remove(user.id, tvShow.id, 'watchlist');
        setInWatchlist(false);
      } else {
        await userMediaService.add(user.id, {
          tmdb_id: tvShow.id,
          type: 'tv',
          title: tvShow.name,
          poster_path: tvShow.poster_path,
        }, 'watchlist');
        setInWatchlist(true);
      }
    } catch (err: unknown) {
      console.error('Failed to toggle watchlist:', err);
      alert('Failed to update watchlist. Please check console for details.');
    } finally {
      setTogglingWatchlist(false);
    }
  };

  if (loading) {
    return (
      <div className="tv-show-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading TV show details...</p>
      </div>
    );
  }

  if (error || !tvShow) {
    return (
      <div className="tv-show-detail-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error || 'TV show not found.'}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  const firstAirYear = tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'N/A';
  const rating = tvShow.vote_average.toFixed(1);
  const availableSeasons = tvShow.seasons.filter(season => season.season_number > 0);

  return (
    <div className="tv-show-detail">
      {/* Hero Section */}
      <div className="tv-show-hero"> 
        <div className="tv-show-hero-background">
          <img
            src={getBackdropUrl(tvShow.backdrop_path, 'original')}
            alt={tvShow.name}
            className="tv-show-hero-image"
          />
          <div className="tv-show-hero-overlay"></div>
        </div>

        <div className="tv-show-hero-content">
          <div className="tv-show-info"> 
            {logoPath ? (
              <img
                className="detail-logo"
                src={getImageUrl(logoPath, 'w500')}
                alt={tvShow.name}
                loading="lazy"
              />
            ) : (
              <h1 className="tv-show-title">{tvShow.name}</h1>
            )}
            
            <div className="tv-show-meta">
              <span className="tv-show-rating">
                <Star size={16} fill="currentColor" />
                {rating}
              </span>
              <span className="tv-show-year">
                <Calendar size={16} />
                {firstAirYear}
              </span>
              <span className="tv-show-seasons">
                <Tv size={16} />
                {tvShow.number_of_seasons} Season{tvShow.number_of_seasons !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="tv-show-genres">
              {tvShow.genres.map((genre) => (
                <span key={genre.id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="tv-show-overview">{tvShow.overview}</p>

            <div className="tv-show-actions">
              <button 
                type="button" 
                className="hero-button hero-button-primary" 
                onClick={handlePlayEpisode}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
              >
                <Play size={20} fill="currentColor" />
                Play First Episode
              </button>
              <button
                type="button"
                className={inWatchlist ? "list-action remove" : "list-action"}
                onClick={toggleWatchlist}
                disabled={togglingWatchlist || checkingWatchlist}
                style={{ marginLeft: 8 }}
              >
                {inWatchlist ? (
                  <><X size={18} style={{ marginRight: 6 }} /> Remove from Watchlist</>
                ) : (
                  <><Bookmark size={18} style={{ marginRight: 6 }} /> Add to Watchlist</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Episode selector (opens dedicated player page) */}
      <div className="video-player-section">
        <div className="season-episode-selector">
          <div className="selector-header">
            <div>
              <p className="selector-eyebrow">Episodes</p>
              <h3 className="selector-title">{tvShow.name}</h3>
            </div>
            <div className="episode-info">
              <span className="current-episode">S{selectedSeason}E{selectedEpisode}</span>
              <span className="episode-count-pill">
                {episodes.length > 0 ? `${episodes.length} eps` : 'Loading'}
              </span>
            </div>
          </div>

          <div className="season-chip-row">
            {availableSeasons.map((season) => (
              <button
                key={season.id}
                className={`season-chip ${selectedSeason === season.season_number ? 'active' : ''}`}
                onClick={() => handleSeasonChange(season.season_number)}
              >
                SEASON {season.season_number}
              </button>
            ))}
          </div>

          <div className="episodes-rail">
            <div
              className="episodes-rail-track"
              ref={episodesRailRef}
              onScroll={checkEpisodeScrollButtons}
              tabIndex={0}
              role="region"
              aria-label="Episodes carousel"
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  scrollEpisodes('left');
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  scrollEpisodes('right');
                }
              }}
            >
              {episodesLoading && (
                <div className="episode-skeleton-row">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="episode-card skeleton">
                      <div className="episode-still skeleton-block"></div>
                      <div className="episode-meta">
                        <div className="skeleton-line short"></div>
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line long"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!episodesLoading && episodes.map((episode) => (
                <div
                  key={episode.id}
                  className={`episode-card ${selectedEpisode === episode.episode_number ? 'active' : ''} ${
                    user && lastWatched?.season === selectedSeason && lastWatched?.episode === episode.episode_number ? 'last-watched' : ''
                  }`}
                  onClick={() => handleEpisodeChange(episode.episode_number)}
                >
                  {user && lastWatched?.season === selectedSeason && lastWatched?.episode === episode.episode_number && (
                    <span className="last-watched-badge" aria-label="Last watched episode">
                      <span className="last-watched-dot" aria-hidden="true"></span>
                      Last watched
                    </span>
                  )}
                  <div className="episode-still">
                    <span className="episode-pill left">S{selectedSeason}</span>
                    <span className="episode-pill right">E{episode.episode_number}</span>
                    <img
                      src={episode.still_path ? getImageUrl(episode.still_path, 'w500') : getPosterUrl(tvShow.poster_path, 'w500')}
                      alt={episode.name}
                      loading="lazy"
                    />
                    <div className="episode-still-overlay">
                      <button className="episode-play-chip" aria-label="Play episode">
                        ▶
                      </button>
                    </div>
                  </div>
                  <div className="episode-meta">
                    <div className="episode-meta-top">
                      <span className="episode-number">S{selectedSeason} • E{episode.episode_number}</span>
                      <span className="episode-rating">
                        <Star size={14} fill="currentColor" />
                        {episode.vote_average ? episode.vote_average.toFixed(1) : '–'}
                      </span>
                    </div>
                    <div className="episode-title">{episode.name}</div>
                    <p className="episode-overview">
                      {episode.overview || 'No synopsis available for this episode yet.'}
                    </p>
                    <div className="episode-actions">
                      <span className="episode-runtime">
                        {episode.runtime ? `${episode.runtime}m` : 'Runtime n/a'}
                      </span>
                      <span className="episode-airdate">
                        {formatAirDate(episode.air_date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="episodes-rail-nav">
              <button
                className="rail-nav"
                onClick={() => scrollEpisodes('left')}
                aria-label="Scroll left"
                disabled={!canScrollLeft}
              >
                <CircleChevronLeft size={20} />
              </button>
              <button
                className="rail-nav"
                onClick={() => scrollEpisodes('right')}
                aria-label="Scroll right"
                disabled={!canScrollRight}
              >
                <CircleChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="detail-tabs">
        <div className="tabs-header">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'trailers' ? 'active' : ''}`}
            onClick={() => setActiveTab('trailers')}
          >
            Trailers & More
          </button>
          <button 
            className={`tab-button ${activeTab === 'cast' ? 'active' : ''}`}
            onClick={() => setActiveTab('cast')}
          >
            Cast & Crew
          </button>
          <button 
            className={`tab-button ${activeTab === 'similar' ? 'active' : ''}`}
            onClick={() => setActiveTab('similar')}
          >
            More Like This
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'overview' && (
            <div className="tab-panel">
              <h3>Story</h3>
              <p>{tvShow.overview}</p>
              {tvShow.tagline && (
                <div className="tagline">
                  <h4>Tagline</h4>
                  <p>"{tvShow.tagline}"</p>
                </div>
              )}
              <div className="show-info-grid">
                <div className="info-item">
                  <h4>Status</h4>
                  <p>{tvShow.status}</p>
                </div>
                <div className="info-item">
                  <h4>Number of Seasons</h4>
                  <p>{tvShow.number_of_seasons}</p>
                </div>
                <div className="info-item">
                  <h4>Number of Episodes</h4>
                  <p>{tvShow.number_of_episodes}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trailers' && (
            <div className="tab-panel">
              <TrailersSection videos={videos} />
            </div>
          )}

          {activeTab === 'cast' && (
            <div className="tab-panel">
              <CastSection cast={cast} />
            </div>
          )}

          {activeTab === 'similar' && (
            <div className="tab-panel">
              <MediaRow 
                items={similarShows} 
                type="tv" 
                title="Similar TV Shows" 
                loading={false}
              />
            </div>
          )}
        </div>
      </div>
      {/* Additional Info */}
      <div className="tv-show-additional-info">
        <div className="info-section">
          <h3>Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value">{tvShow.status}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Original Language:</span>
              <span className="info-value">{tvShow.original_language.toUpperCase()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Episodes:</span>
              <span className="info-value">{tvShow.number_of_episodes}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Air Date:</span>
              <span className="info-value">
                {tvShow.last_air_date ? new Date(tvShow.last_air_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVShowDetail;
