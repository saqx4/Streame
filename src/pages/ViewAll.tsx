import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Movie, TVShow } from '../types';
import { tmdbService } from '../services/tmdb';
import MediaCard from '../components/MediaCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './ViewAll.css';

const ViewAll = () => {
  const { type, category } = useParams<{ type: 'movie' | 'tv'; category: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const title = location.state?.title || category;
  
  const [items, setItems] = useState<(Movie | TVShow)[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async (pageNum: number) => {
    if (!type || !category || loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      // Map categories to API calls with proper pagination
      switch (category) {
        case 'trending':
          // Note: Trending API doesn't support pagination, so we'll use popular with page
          response = type === 'movie' 
            ? await tmdbService.getPopularMovies(pageNum)
            : await tmdbService.getPopularTVShows(pageNum);
          break;
        case 'popular':
          response = type === 'movie'
            ? await tmdbService.getPopularMovies(pageNum)
            : await tmdbService.getPopularTVShows(pageNum);
          break;
        case 'top-rated':
          response = type === 'movie'
            ? await tmdbService.getTopRatedMovies(pageNum)
            : await tmdbService.getTopRatedTVShows(pageNum);
          break;
        case 'now-playing':
          response = await tmdbService.getNowPlayingMovies(pageNum);
          break;
        case 'upcoming':
          response = await tmdbService.getUpcomingMovies(pageNum);
          break;
        case 'on-the-air':
          response = await tmdbService.getOnTheAirTVShows(pageNum);
          break;
        case 'airing-today':
          response = await tmdbService.getAiringTodayTVShows(pageNum);
          break;
        case 'arabic':
          response = type === 'movie'
            ? await tmdbService.getArabicMovies(pageNum)
            : await tmdbService.getArabicTVShows(pageNum);
          break;
        default:
          // For genre-based categories, use popular movies with pagination
          response = type === 'movie'
            ? await tmdbService.getPopularMovies(pageNum)
            : await tmdbService.getPopularTVShows(pageNum);
      }
      
      if (response && response.results) {
        setItems(prev => pageNum === 1 ? response.results : [...prev, ...response.results]);
        setHasMore(response.page < response.total_pages && pageNum < 20); // Limit to 20 pages
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [type, category]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    fetchData(1);
  }, [type, category]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading]);

  useEffect(() => {
    if (page > 1) {
      fetchData(page);
    }
  }, [page]);

  const handleBack = () => {
    navigate(-1);
  };

  if (error && items.length === 0) {
    return (
      <div className="view-all-error">
        <div className="error-content">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => fetchData(1)} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-all">
      <div className="view-all-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft />
          <span>Back</span>
        </button>
        <h1 className="view-all-title">{title}</h1>
      </div>

      <div className="view-all-grid">
        {items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="view-all-item">
            <MediaCard media={item} type={type || 'movie'} />
          </div>
        ))}
      </div>

      {loading && (
        <div className="view-all-loading">
          <LoadingSpinner />
        </div>
      )}

      {!loading && hasMore && (
        <div ref={observerTarget} className="load-more-trigger" />
      )}

      {!hasMore && items.length > 0 && (
        <div className="view-all-end">
          <p>You've reached the end!</p>
        </div>
      )}
    </div>
  );
};

export default ViewAll;
