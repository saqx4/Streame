import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Calendar, Tv, Play } from 'lucide-react';
import type { TVShowDetails } from '../types';
import { tmdbService, getBackdropUrl, getPosterUrl, getStreamingUrl } from '../services/tmdb';
import './TVShowDetail.css';

const TVShowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tvShow, setTVShow] = useState<TVShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<'multiembed' | 'vidsrc' | 'vidfast' | 'vidzee' | 'embed_su' | 'vidsrc_cc' | 'autoembed'>('multiembed');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    const fetchTVShow = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const tvShowData = await tmdbService.getTVShowDetails(parseInt(id));
        setTVShow(tvShowData);
        
        // Set default season and episode
        if (tvShowData.seasons && tvShowData.seasons.length > 0) {
          const firstSeason = tvShowData.seasons.find(s => s.season_number > 0);
          if (firstSeason) {
            setSelectedSeason(firstSeason.season_number);
          }
        }
      } catch (err) {
        console.error('Error fetching TV show details:', err);
        setError('Failed to load TV show details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTVShow();
  }, [id]);

  const handlePlayEpisode = () => {
    // Auto-play first season and first episode
    setSelectedSeason(1);
    setSelectedEpisode(1);
    setShowPlayer(true);
  };

  const handleServerChange = (server: 'multiembed' | 'vidsrc' | 'vidfast' | 'vidzee' | 'embed_su' | 'vidsrc_cc' | 'autoembed') => {
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
              <button className="play-button" onClick={handlePlayEpisode}>
                <Play size={20} fill="currentColor" />
                Watch Episode
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      {showPlayer && (
        <div className="video-player-section">
          {/* Episode Selection Above Player */}
          <div className="episode-selection-above">
            <div className="season-selection">
              <label className="selection-label">Season:</label>
              <select
                value={selectedSeason}
                onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                className="season-select"
              >
                {availableSeasons.map((season) => (
                  <option key={season.id} value={season.season_number}>
                    Season {season.season_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="episode-selection-container">
              <label className="selection-label">Episode:</label>
              <select
                value={selectedEpisode}
                onChange={(e) => handleEpisodeChange(parseInt(e.target.value))}
                className="episode-select"
              >
                {Array.from({ length: availableSeasons.find(s => s.season_number === selectedSeason)?.episode_count || 1 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Episode {i + 1}
                  </option>
                ))}
              </select>
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
            <span className="server-label">Server:</span>
            <button
              className={`server-button ${selectedServer === 'multiembed' ? 'active' : ''}`}
              onClick={() => handleServerChange('multiembed')}
            >
              Server 1
            </button>
            <button
              className={`server-button ${selectedServer === 'vidsrc' ? 'active' : ''}`}
              onClick={() => handleServerChange('vidsrc')}
            >
              Server 2
            </button>
            <button
              className={`server-button ${selectedServer === 'vidfast' ? 'active' : ''}`}
              onClick={() => handleServerChange('vidfast')}
            >
              Server 3
            </button>
            <button
              className={`server-button ${selectedServer === 'vidzee' ? 'active' : ''}`}
              onClick={() => handleServerChange('vidzee')}
            >
              Server 4
            </button>
            <button
              className={`server-button ${selectedServer === 'embed_su' ? 'active' : ''}`}
              onClick={() => handleServerChange('embed_su')}
            >
              Server 5
            </button>
            <button
              className={`server-button ${selectedServer === 'vidsrc_cc' ? 'active' : ''}`}
              onClick={() => handleServerChange('vidsrc_cc')}
            >
              Server 6
            </button>
            <button
              className={`server-button ${selectedServer === 'autoembed' ? 'active' : ''}`}
              onClick={() => handleServerChange('autoembed')}
            >
              Server 7
            </button>
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
