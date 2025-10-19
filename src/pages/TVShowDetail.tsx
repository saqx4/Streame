import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Calendar, Tv, Play } from 'lucide-react';
import type { TVShowDetails, TVShow } from '../types';
import { tmdbService, getBackdropUrl, getPosterUrl, getStreamingUrl } from '../services/tmdb';
import CastSection from '../components/CastSection';
import TrailersSection from '../components/TrailersSection';
import MediaRow from '../components/MediaRow';
import './TVShowDetail.css';
import '../components/Hero.css';

const TVShowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tvShow, setTVShow] = useState<TVShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<'server1' | 'server2' | 'server3' | 'server4'>('server1');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [showPlayer, setShowPlayer] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trailers' | 'cast' | 'similar'>('overview');
  const [cast, setCast] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [similarShows, setSimilarShows] = useState<TVShow[]>([]);

  useEffect(() => {
    const fetchTVShow = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const tvId = parseInt(id);
        
        // Fetch all data in parallel
        const [tvShowData, creditsData, videosData, similarData] = await Promise.all([
          tmdbService.getTVShowDetails(tvId),
          tmdbService.getTVShowCredits(tvId),
          tmdbService.getTVShowVideos(tvId),
          tmdbService.getSimilarTVShows(tvId),
        ]);
        
        setTVShow(tvShowData);
        setCast(creditsData.cast || []);
        setVideos(videosData.results || []);
        setSimilarShows(similarData.results || []);
      } catch (err) {
        console.error('Error fetching TV show details:', err);
        setError('Failed to load TV show details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTVShow();
  }, [id]);

  const handlePlayEpisode = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    // Prevent any navigation
    if (e.currentTarget) {
      e.currentTarget.blur();
    }
    
    // Auto-play first season and first episode
    setSelectedSeason(1);
    setSelectedEpisode(1);
    setShowPlayer(true);
    // Scroll to player section after a brief delay
    setTimeout(() => {
      const playerSection = document.querySelector('.video-player-section');
      if (playerSection) {
        playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleServerChange = (server: 'server1' | 'server2' | 'server3' | 'server4') => {
    setSelectedServer(server);
  };

  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(1); // Reset to first episode when changing season
  };

  const handleEpisodeChange = (episode: number) => {
    setSelectedEpisode(episode);
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
          <div className="tv-show-poster">
            <img
              src={getPosterUrl(tvShow.poster_path, 'w500')}
              alt={tvShow.name}
              className="poster-image"
            />
          </div>

          <div className="tv-show-info">
            <h1 className="tv-show-title">{tvShow.name}</h1>
            
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
                Watch Now
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

      {/* Video Player */}
      {showPlayer && (
        <div className="video-player-section">
          {/* Episode Selection Above Player */}
          <div className="season-episode-selector">
            <div className="selector-header">
              <h3 className="selector-title">Select Episode</h3>
              <div className="episode-info">
                <span className="current-episode">S{selectedSeason}E{selectedEpisode}</span>
              </div>
            </div>
            
            <div className="selector-grid">
              <div className="season-selector">
                <label className="selector-label">Season</label>
                <div className="season-buttons">
                  {availableSeasons.map((season) => (
                    <button
                      key={season.id}
                      className={`season-button ${selectedSeason === season.season_number ? 'active' : ''}`}
                      onClick={() => handleSeasonChange(season.season_number)}
                    >
                      {season.season_number}
                    </button>
                  ))}
                </div>
              </div>

              <div className="episode-selector">
                <label className="selector-label">Episode</label>
                <div className="episode-buttons">
                  {Array.from({ length: availableSeasons.find(s => s.season_number === selectedSeason)?.episode_count || 1 }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`episode-button ${selectedEpisode === i + 1 ? 'active' : ''}`}
                      onClick={() => handleEpisodeChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <h2 className="player-title">
            Now Playing: {tvShow.name} - Season {selectedSeason}, Episode {selectedEpisode}
          </h2>
          <div className="video-player-container">
            <iframe
              src={getStreamingUrl(tvShow.id, 'tv', selectedServer, selectedSeason, selectedEpisode)}
              title={`${tvShow.name} S${selectedSeason}E${selectedEpisode}`}
              className="video-player"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          {/* Server Selection Below Player */}
          <div className="server-selection-below">
            <div className="server-selector-header">
              <h3 className="server-title">Choose Server</h3>
              <div className="server-status">
                <span className="status-indicator active"></span>
                <span className="status-text">Available</span>
              </div>
            </div>
            <div className="server-grid">
              <button
                className={`server-card ${selectedServer === 'server1' ? 'active' : ''}`}
                onClick={() => handleServerChange('server1')}
              >
                <div className="server-icon">
                  <div className="server-number">1</div>
                </div>
                <div className="server-info">
                  <span className="server-name">Server 1</span>
                  <span className="server-quality">HD</span>
                </div>
              </button>
              <button
                className={`server-card ${selectedServer === 'server2' ? 'active' : ''}`}
                onClick={() => handleServerChange('server2')}
              >
                <div className="server-icon">
                  <div className="server-number">2</div>
                </div>
                <div className="server-info">
                  <span className="server-name">Server 2</span>
                  <span className="server-quality">HD</span>
                </div>
              </button>
              <button
                className={`server-card ${selectedServer === 'server3' ? 'active' : ''}`}
                onClick={() => handleServerChange('server3')}
              >
                <div className="server-icon">
                  <div className="server-number">3</div>
                </div>
                <div className="server-info">
                  <span className="server-name">Server 3</span>
                  <span className="server-quality">HD</span>
                </div>
              </button>
              <button
                className={`server-card ${selectedServer === 'server4' ? 'active' : ''}`}
                onClick={() => handleServerChange('server4')}
              >
                <div className="server-icon">
                  <div className="server-number">4</div>
                </div>
                <div className="server-info">
                  <span className="server-name">Server 4</span>
                  <span className="server-quality">HD</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

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
