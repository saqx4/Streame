import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, Calendar, Clock, Play, Bookmark, X } from 'lucide-react';
import type { MovieDetails, Movie } from '../types';
import { tmdbService, getBackdropUrl, getImageUrl } from '../services/tmdb';
import CastSection from '../components/CastSection';
import TrailersSection from '../components/TrailersSection';
import MediaRow from '../components/MediaRow';
import './MovieDetail.css';
import '../components/Hero.css';
import { useAuth } from '../context/AuthContext';
import { userMediaService } from '../services/userMedia';
import { useToast } from '../context/ToastContext';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trailers' | 'cast' | 'similar'>('overview');
  const [cast, setCast] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [checkingWatchlist, setCheckingWatchlist] = useState(false);
  const [togglingWatchlist, setTogglingWatchlist] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const movieId = parseInt(id);
        
        // Fetch all data in parallel
        const [movieData, creditsData, videosData, similarData, imagesData] = await Promise.all([
          tmdbService.getMovieDetails(movieId),
          tmdbService.getMovieCredits(movieId),
          tmdbService.getMovieVideos(movieId),
          tmdbService.getSimilarMovies(movieId),
          tmdbService.getMovieImages(movieId),
        ]);
        
        setMovie(movieData);
        setCast(creditsData.cast || []);
        const results = videosData.results || [];
        setVideos(results);
        setSimilarMovies(similarData.results || []);

        const logos: any[] = imagesData?.logos || [];
        const bestLogo = logos.find((l) => l?.iso_639_1 === 'en') || logos.find((l) => !l?.iso_639_1) || logos[0];
        setLogoPath(bestLogo?.file_path ?? null);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Check watchlist status when user or movie changes
  useEffect(() => {
    if (user && movie) {
      checkWatchlistStatus();
    } else {
      setInWatchlist(false);
    }
  }, [user, movie]);

  const handlePlayMovie = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    navigate(`/watch/movie/${movie?.id}`);
  };

  const checkWatchlistStatus = async () => {
    if (!user || !movie) return;
    try {
      setCheckingWatchlist(true);
      const items = await userMediaService.list(user.id, 'watchlist');
      const isInList = items.some(item => item.tmdb_id === movie.id);
      setInWatchlist(isInList);
    } catch (err) {
      console.error('Failed to check watchlist:', err);
    } finally {
      setCheckingWatchlist(false);
    }
  };

  const toggleWatchlist = async () => {
    if (!user || !movie) {
      window.location.href = '/login';
      return;
    }
    try {
      setTogglingWatchlist(true);
      if (inWatchlist) {
        await userMediaService.remove(user.id, movie.id, 'watchlist');
        setInWatchlist(false);
        toast.success('Removed from watchlist');
      } else {
        await userMediaService.add(user.id, {
          tmdb_id: movie.id,
          type: 'movie',
          title: movie.title,
          poster_path: movie.poster_path,
        }, 'watchlist');
        setInWatchlist(true);
        toast.success('Added to watchlist');
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
      toast.error('Failed to update watchlist');
    } finally {
      setTogglingWatchlist(false);
    }
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

          <div className="movie-info"> 
            {logoPath ? (
              <img
                className="detail-logo"
                src={getImageUrl(logoPath, 'w500')}
                alt={movie.title}
                loading="lazy"
              />
            ) : (
              <h1 className="movie-title">{movie.title}</h1>
            )}
            
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
