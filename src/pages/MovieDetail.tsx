import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Calendar, Clock, Play } from 'lucide-react';
import type { MovieDetails } from '../types';
import { tmdbService, getBackdropUrl, getPosterUrl, getStreamingUrl } from '../services/tmdb';
import './MovieDetail.css';

const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<'multiembed' | 'vidsrc' | 'vidfast' | 'vidzee' | 'embed_su' | 'vidsrc_cc' | 'autoembed'>('multiembed');
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const movieData = await tmdbService.getMovieDetails(parseInt(id));
        setMovie(movieData);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handlePlayMovie = () => {
    setShowPlayer(true);
  };

  const handleServerChange = (server: 'multiembed' | 'vidsrc' | 'vidfast' | 'vidzee' | 'embed_su' | 'vidsrc_cc' | 'autoembed') => {
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
              <button className="play-button" onClick={handlePlayMovie}>
                <Play size={20} fill="currentColor" />
                Watch Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      {showPlayer && (
        <div className="video-player-section">
          <h2 className="player-title">Now Playing: {movie.title}</h2>
          <div className="video-player-container">
            <iframe
              src={getStreamingUrl(movie.id, 'movie', selectedServer)}
              title={movie.title}
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
