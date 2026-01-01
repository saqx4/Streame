import type { Movie, TVShow } from '../types';
import MediaCard from './MediaCard';
import './MediaGrid.css';

interface MediaGridProps {
  items: (Movie | TVShow)[];
  type?: 'movie' | 'tv';
  title?: string;
  loading?: boolean;
}

const MediaGrid = ({ items, type, title, loading = false }: MediaGridProps) => {
  if (loading) {
    return (
      <div className="media-grid-container">
        {title && <h2 className="media-grid-title">{title}</h2>}
        <div className="media-grid">
          {Array.from({ length: 20 }).map((_, index) => (
            <div key={index} className="media-card-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="media-grid-container">
        {title && <h2 className="media-grid-title">{title}</h2>}
        <div className="empty-state">
          <p>No {type === 'movie' ? 'movies' : 'TV shows'} found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="media-grid-container">
      {title && <h2 className="media-grid-title">{title}</h2>}
        <div className="media-grid">
          {items.map((item) => {
            const itemType = type || ('title' in item ? 'movie' : 'tv');
            return (
              <MediaCard key={item.id} media={item} type={itemType} />
            );
          })}
        </div>
    </div>
  );
};

export default MediaGrid;
