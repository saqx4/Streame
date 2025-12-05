import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Movie, TVShow } from '../types';
import MediaCard from './MediaCard';
import './MediaRow.css';

interface MediaRowProps {
  items: (Movie | TVShow)[];
  type: 'movie' | 'tv';
  title: string;
  loading?: boolean;
  showNumbers?: boolean;
  category?: string;
}

const MediaRow: React.FC<MediaRowProps> = ({ items, type, title, loading = false, showNumbers = false, category }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleViewAll = () => {
    if (category) {
      navigate(`/view-all/${type}/${category}`, { state: { title } });
    }
  };

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    // Check scroll buttons when items load or change
    const timer = setTimeout(() => {
      checkScrollButtons();
    }, 100);
    return () => clearTimeout(timer);
  }, [items]);

  useEffect(() => {
    // Add resize observer to handle window resizing
    const handleResize = () => {
      checkScrollButtons();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scroll('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scroll('right');
    }
  };

  if (loading) {
    return (
      <div className="media-row">
        {title && <h2 className="media-row-title">{title}</h2>}
        <div className="media-row-container">
          <div className="media-row-content">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="media-card-skeleton">
                <div className="skeleton-image"></div>
                <div className="skeleton-title"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="media-row">
        {title && <h2 className="media-row-title">{title}</h2>}
        <div className="media-row-empty">
          <p>No {type === 'movie' ? 'movies' : 'TV shows'} found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="media-row">
      {title && (
        <div className="media-row-header">
          <h2 className="media-row-title">{title}</h2>
          {category && (
            <button className="view-all-btn" onClick={handleViewAll}>
              View All
              <ArrowRight />
            </button>
          )}
        </div>
      )}
      
      <div className="media-row-container">
        {canScrollLeft && (
          <button 
            className="media-row-arrow media-row-arrow-left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        <div 
          className="media-row-content"
          ref={scrollContainerRef}
          onScroll={checkScrollButtons}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label={title || 'Media carousel'}
        >
          {items.map((item, index) => (
            <div key={item.id} className="media-row-item">
              {showNumbers && (
                <div className="media-number">
                  {index + 1}
                </div>
              )}
              <MediaCard media={item} type={type} />
            </div>
          ))}
        </div>
        
        {canScrollRight && (
          <button 
            className="media-row-arrow media-row-arrow-right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MediaRow;