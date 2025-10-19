import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie, TVShow } from '../types';
import MediaCard from './MediaCard';
import './MediaRow.css';

interface MediaRowProps {
  items: (Movie | TVShow)[];
  type: 'movie' | 'tv';
  title: string;
  loading?: boolean;
  showNumbers?: boolean;
}

const MediaRow: React.FC<MediaRowProps> = ({ items, type, title, loading = false, showNumbers = false }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    // Check scroll buttons when items load or change
    checkScrollButtons();
  }, [items]);

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

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left
      scroll('right');
    }
    if (touchStart - touchEnd < -75) {
      // Swiped right
      scroll('left');
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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