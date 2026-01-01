import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, AlertCircle, X, CircleChevronLeft, CircleChevronRight, Trash2, SlidersHorizontal, Check } from 'lucide-react';
import { watchHistoryService, type WatchHistoryItem } from '../services/watchHistory';
import { getPosterUrl } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import { formatDuration } from '../utils/formatDuration';
import './ContinueWatching.css';

type SortOption = 'recent' | 'progress' | 'title';
type FilterOption = 'all' | 'movies' | 'tv';

const ContinueWatching = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showOptions, setShowOptions] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const history = await watchHistoryService.list(user.id, 20);
      // Keep anything that has been started but not fully completed
      const filtered = history.filter(item => item.progress > 0 && item.progress < 100);

      // Deduplicate: for TV, keep latest episode per show; for movies, keep latest entry
      const latestMap = new Map<string, WatchHistoryItem>();
      filtered.forEach(item => {
        const key = `${item.type}-${item.tmdb_id}`;
        const existing = latestMap.get(key);
        if (!existing) {
          latestMap.set(key, item);
          return;
        }
        if (new Date(item.last_watched).getTime() > new Date(existing.last_watched).getTime()) {
          latestMap.set(key, item);
        }
      });

      const deduped = Array.from(latestMap.values()).sort(
        (a, b) => new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime()
      );

      setItems(deduped.slice(0, 10));
    } catch (err) {
      console.error('Failed to load watch history:', err);
      setError('Failed to load your watch history. Please try again later.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: WatchHistoryItem) => {
    const startAt = item.last_position && item.last_position > 0
      ? `?startAt=${Math.floor(item.last_position)}`
      : '';

    if (item.type === 'movie') {
      navigate(`/watch/movie/${item.tmdb_id}${startAt}`);
    } else {
      navigate(`/watch/tv/${item.tmdb_id}/season/${item.season_number}/episode/${item.episode_number}${startAt}`);
    }
  };

  const handleDelete = async (item: WatchHistoryItem) => {
    if (!user) return;
    try {
      await watchHistoryService.remove(
        user.id,
        item.tmdb_id,
        item.type,
        item.season_number,
        item.episode_number
      );
      setItems(prev => prev.filter(i =>
        !(
          i.tmdb_id === item.tmdb_id &&
          i.type === item.type &&
          i.season_number === item.season_number &&
          i.episode_number === item.episode_number
        )
      ));
    } catch (err) {
      console.error('Failed to delete watch history item', err);
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleClearAll = async () => {
    if (!user || !window.confirm('Are you sure you want to clear all watch history?')) return;
    try {
      await watchHistoryService.clear(user.id);
      setItems([]);
    } catch (err) {
      console.error('Failed to clear watch history:', err);
      setError('Failed to clear history. Please try again.');
    }
  };

  const getSortedAndFilteredItems = () => {
    let filtered = [...items];
    
    if (filterBy === 'movies') {
      filtered = filtered.filter(item => item.type === 'movie');
    } else if (filterBy === 'tv') {
      filtered = filtered.filter(item => item.type === 'tv');
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progress - a.progress;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime();
      }
    });
    
    return filtered;
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="continue-watching">
        <div className="continue-watching-header">
          <h2>Continue Watching</h2>
          <Clock size={20} />
        </div>
        <div className="continue-watching-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="continue-watching-skeleton">
              <div className="skeleton-poster" />
              <div className="skeleton-info">
                <div className="skeleton-title" />
                <div className="skeleton-meta" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="continue-watching">
        <div className="continue-watching-header">
          <h2>Continue Watching</h2>
          <Clock size={20} />
        </div>
        <div className="continue-watching-error">
          <AlertCircle size={32} />
          <p>{error}</p>
          <button onClick={loadHistory} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const scrollRow = (direction: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;
    const cardWidth = 176; // card width (160px) + gap (16px)
    const amount = cardWidth * 3;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const displayItems = getSortedAndFilteredItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="continue-watching">
      <div className="continue-watching-header">
        <div className="cw-header-left">
          <h2>Continue Watching</h2>
          <Clock size={20} />
          <span className="cw-count">{displayItems.length} {displayItems.length === 1 ? 'item' : 'items'}</span>
        </div>
        <div className="cw-header-actions">
          <button 
            className="cw-options-btn"
            onClick={() => setShowOptions(!showOptions)}
            aria-label="Filter and sort options"
          >
            <SlidersHorizontal size={18} />
          </button>
          {items.length > 0 && (
            <button 
              className="cw-clear-btn"
              onClick={handleClearAll}
              aria-label="Clear all"
            >
              <Trash2 size={18} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>
      {showOptions && (
        <div className="cw-options-panel">
          <div className="cw-option-group">
            <label>Filter:</label>
            <div className="cw-option-buttons">
              <button 
                className={filterBy === 'all' ? 'active' : ''}
                onClick={() => setFilterBy('all')}
              >
                {filterBy === 'all' && <Check size={14} />}
                All
              </button>
              <button 
                className={filterBy === 'movies' ? 'active' : ''}
                onClick={() => setFilterBy('movies')}
              >
                {filterBy === 'movies' && <Check size={14} />}
                Movies
              </button>
              <button 
                className={filterBy === 'tv' ? 'active' : ''}
                onClick={() => setFilterBy('tv')}
              >
                {filterBy === 'tv' && <Check size={14} />}
                TV Shows
              </button>
            </div>
          </div>
          <div className="cw-option-group">
            <label>Sort by:</label>
            <div className="cw-option-buttons">
              <button 
                className={sortBy === 'recent' ? 'active' : ''}
                onClick={() => setSortBy('recent')}
              >
                {sortBy === 'recent' && <Check size={14} />}
                Recently Watched
              </button>
              <button 
                className={sortBy === 'progress' ? 'active' : ''}
                onClick={() => setSortBy('progress')}
              >
                {sortBy === 'progress' && <Check size={14} />}
                Progress
              </button>
              <button 
                className={sortBy === 'title' ? 'active' : ''}
                onClick={() => setSortBy('title')}
              >
                {sortBy === 'title' && <Check size={14} />}
                Title
              </button>
            </div>
          </div>
        </div>
      )}
      {displayItems.length === 0 ? (
        <div className="continue-watching-empty">
          <AlertCircle size={48} />
          <p>No items match your current filters.</p>
          <button 
            onClick={() => {
              setFilterBy('all');
              setSortBy('recent');
            }}
            className="reset-filters-btn"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="continue-watching-row">
          <button className="cw-arrow left" aria-label="Scroll left" onClick={() => scrollRow('left')}>
            <CircleChevronLeft size={20} />
          </button>
          <div className="continue-watching-track" ref={rowRef}>
            {displayItems.map((item) => (
            <div
              key={`${item.tmdb_id}-${item.type}-${item.season_number}-${item.episode_number}`}
              className="continue-watching-card"
              onClick={() => handleItemClick(item)}
            >
              <button
                className="cw-delete"
                aria-label="Remove from Continue Watching"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
              >
                <X size={16} />
              </button>
              <div className="continue-watching-poster">
                <img 
                  src={getPosterUrl(item.poster_path)} 
                  alt={item.title}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image';
                  }}
                />
                <div className="continue-watching-overlay">
                  <Play size={48} fill="currentColor" />
                </div>
                <div className="continue-watching-progress">
                  <div
                    className="continue-watching-progress-bar"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
              <div className="continue-watching-info">
                <h3>{item.title}</h3>
                {item.type === 'tv' && (
                  <p className="continue-watching-episode">
                    S{item.season_number} E{item.episode_number}
                  </p>
                )}
                {item.last_position && item.last_position > 0 && (
                  <p className="continue-watching-timestamp">
                    ⏱️ {formatDuration(item.last_position)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <button className="cw-arrow right" aria-label="Scroll right" onClick={() => scrollRow('right')}>
          <CircleChevronRight size={20} />
        </button>
      </div>
      )}
    </div>
  );
};

export default ContinueWatching;
