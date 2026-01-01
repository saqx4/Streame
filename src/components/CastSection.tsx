import { useRef, useState, useEffect } from 'react';
import { CircleChevronLeft, CircleChevronRight } from 'lucide-react';
import { getProfileUrl } from '../services/tmdb';
import './CastSection.css';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface CastSectionProps {
  cast: CastMember[];
}

const CastSection = ({ cast }: CastSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Show top 20 cast members for scrolling
  const displayCast = cast.slice(0, 20);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
  }, [cast]);

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

  if (displayCast.length === 0) {
    return (
      <div className="cast-section-empty">
        <p>No cast information available.</p>
      </div>
    );
  }

  return (
    <div className="cast-section">
      <h2 className="cast-section-title">Cast</h2>
      <div className="cast-row-container">
        {canScrollLeft && (
          <button 
            className="cast-arrow cast-arrow-left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <CircleChevronLeft size={24} />
          </button>
        )}
        
        <div 
          className="cast-grid"
          ref={scrollContainerRef}
          onScroll={checkScrollButtons}
        >
        {displayCast.map((member) => (
          <div key={member.id} className="cast-card">
            <div className="cast-image">
              <img
                src={getProfileUrl(member.profile_path)}
                alt={member.name}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/185x278/333333/ffffff?text=No+Photo';
                }}
              />
            </div>
            <div className="cast-info">
              <h3 className="cast-name">{member.name}</h3>
              <p className="cast-character">{member.character}</p>
            </div>
          </div>
        ))}
        </div>
        
        {canScrollRight && (
          <button 
            className="cast-arrow cast-arrow-right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <CircleChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CastSection;
