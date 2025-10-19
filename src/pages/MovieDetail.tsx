import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Calendar, Clock, Play } from 'lucide-react';
import type { MovieDetails, Movie } from '../types';
import { tmdbService, getBackdropUrl, getPosterUrl, getStreamingUrl } from '../services/tmdb';
import CastSection from '../components/CastSection';
import TrailersSection from '../components/TrailersSection';
import MediaRow from '../components/MediaRow';
import './MovieDetail.css';
import '../components/Hero.css';

const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<'server1' | 'server2' | 'server3' | 'server4'>('server1');
  const [showPlayer, setShowPlayer] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trailers' | 'cast' | 'similar'>('overview');
  const [cast, setCast] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const movieId = parseInt(id);
        
        // Fetch all data in parallel
        const [movieData, creditsData, videosData, similarData] = await Promise.all([
          tmdbService.getMovieDetails(movieId),
          tmdbService.getMovieCredits(movieId),
          tmdbService.getMovieVideos(movieId),
          tmdbService.getSimilarMovies(movieId),
        ]);
        
        setMovie(movieData);
        setCast(creditsData.cast || []);
        setVideos(videosData.results || []);
        setSimilarMovies(similarData.results || []);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handlePlayMovie = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    // Prevent any navigation
    if (e.currentTarget) {
      e.currentTarget.blur();
    }
    
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

  if (loading) {
    return (
      <div className="movie-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="movie-detail-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error || 'Movie not found.'}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A';
  const rating = movie.vote_average.toFixed(1);

  return (
    <div className="movie-detail">
      {/* Hero Section */}
      <div className="movie-hero">
        <div className="movie-hero-background">
          <img
            src={getBackdropUrl(movie.backdrop_path, 'original')}
            alt={movie.title}
            className="movie-hero-image"
          />
          <div className="movie-hero-overlay"></div>
        </div>

        <div className="movie-hero-content">
          <div className="movie-poster">
            <img
              src={getPosterUrl(movie.poster_path, 'w500')}
              alt={movie.title}
              className="poster-image"
            />
          </div>

          <div className="movie-info">
            <h1 className="movie-title">{movie.title}</h1>
            
            <div className="movie-meta">
              <span className="movie-rating">
                <Star size={16} fill="currentColor" />
                {rating}
              </span>
              <span className="movie-year">
                <Calendar size={16} />
                {releaseYear}
              </span>
              <span className="movie-runtime">
                <Clock size={16} />
                {runtime}
              </span>
            </div>

            <div className="movie-genres">
              {movie.genres.map((genre) => (
                <span key={genre.id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="movie-overview">{movie.overview}</p>

            <div className="movie-actions">
              <button 
                type="button" 
                className="hero-button hero-button-primary" 
                onClick={handlePlayMovie}
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
              <p>{movie.overview}</p>
              {movie.tagline && (
                <div className="tagline">
                  <h4>Tagline</h4>
                  <p>"{movie.tagline}"</p>
                </div>
              )}
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
                items={similarMovies} 
                type="movie" 
                title="Similar Movies" 
                loading={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Video Player */}
      {showPlayer && (
        <div className="video-player-section">
          <h2 className="player-title">Now Playing: {movie.title}</h2>
          <p className="player-note">If video doesn't load, try switching servers below</p>
          <div className="video-player-container">
            <iframe
              src={getStreamingUrl(movie.id, 'movie', selectedServer)}
              title={movie.title}
              className="video-player"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="origin"
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
      <div className="movie-additional-info">
        <div className="info-section">
          <h3>Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value">{movie.status}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Original Language:</span>
              <span className="info-value">{movie.original_language.toUpperCase()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Budget:</span>
              <span className="info-value">
                {movie.budget ? `$${movie.budget.toLocaleString()}` : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Revenue:</span>
              <span className="info-value">
                {movie.revenue ? `$${movie.revenue.toLocaleString()}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
