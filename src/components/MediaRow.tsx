import { memo, useRef, useState, useEffect } from 'react';
import { CircleChevronLeft, CircleChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Movie, TVShow } from '../types';
import MediaCard from './MediaCard';
import MediaCardSkeleton from './MediaCardSkeleton';
import LazyRender from './LazyRender';
import './MediaRow.css';

interface MediaRowProps {
  items: (Movie | TVShow)[];
  type: 'movie' | 'tv';
  title: string;
  loading?: boolean;
  showNumbers?: boolean;
  category?: string;
}

const MediaRow = ({ items, type, title, loading = false, showNumbers = false, category }: MediaRowProps) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const canScrollLeftRef = useRef(false);
  const canScrollRightRef = useRef(true);
  const rafRef = useRef<number | null>(null);

  const handleViewAll = () => {
    if (category) {
      navigate(`/view-all/${type}/${category}`, { state: { title } });
    }
  };

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const nextLeft = scrollLeft > 5;
      const nextRight = scrollLeft < scrollWidth - clientWidth - 5;

      if (nextLeft !== canScrollLeftRef.current) {
        canScrollLeftRef.current = nextLeft;
        setCanScrollLeft(nextLeft);
      }
      if (nextRight !== canScrollRightRef.current) {
        canScrollRightRef.current = nextRight;
        setCanScrollRight(nextRight);
      }
    }
  };

  const scheduleCheckScrollButtons = () => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      checkScrollButtons();
    });
  };

  useEffect(() => {
    // Check scroll buttons when items load or change
    const timer = setTimeout(() => {
      scheduleCheckScrollButtons();
    }, 100);
    return () => clearTimeout(timer);
  }, [items]);

  useEffect(() => {
    // Add resize observer to handle window resizing
    const handleResize = () => {
      scheduleCheckScrollButtons();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
              <div key={index} className="media-row-item">
                <MediaCardSkeleton />
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
    <LazyRender minHeight={320} rootMargin="200px">
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
              <CircleChevronLeft size={24} />
            </button>
          )}
          
          <div 
            className="media-row-content"
            ref={scrollContainerRef}
            onScroll={scheduleCheckScrollButtons}
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
              <CircleChevronRight size={24} />
            </button>
          )}
        </div>
      </div>
    </LazyRender>
  );
};

export default memo(MediaRow);