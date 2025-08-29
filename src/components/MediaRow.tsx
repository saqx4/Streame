import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie, TVShow } from '../types';
import MediaCard from './MediaCard';
import './MediaRow.css';

interface MediaRowProps {
  items: (Movie | TVShow)[];
  type: 'movie' | 'tv';
  title: string;
  loading?: boolean;
}

const MediaRow: React.FC<MediaRowProps> = ({ items, type, title, loading = false }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

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

  if (loading) {
    return (
      <div className="media-row">
        <h2 className="media-row-title">{title}</h2>
        <div className="media-row-container">
          <div className="media-row-content">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="media-card-skeleton-row">
                <div className="skeleton-image-row"></div>
                <div className="skeleton-title-row"></div>
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
        <h2 className="media-row-title">{title}</h2>
        <div className="media-row-empty">
          <p>No {type === 'movie' ? 'movies' : 'TV shows'} found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="media-row">
      <div className="media-row-header">
        <h2 className="media-row-title">{title}</h2>
        <span className="media-row-count">{items.length} items</span>
      </div>
      
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
        >
          {items.map((item) => (
            <div key={item.id} className="media-row-item">
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
