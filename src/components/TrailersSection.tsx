import React, { useState, useRef, useEffect } from 'react';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './TrailersSection.css';

interface Video {
  id: string;
  key: string;
  name: string;
  type: string;
  site: string;
  size: number;
  official: boolean;
}

interface TrailersSectionProps {
  videos: Video[];
}

const TrailersSection: React.FC<TrailersSectionProps> = ({ videos }) => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
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

  useEffect(() => {
    checkScrollButtons();
  }, [videos]);

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

  // Filter for trailers and teasers from YouTube
  const trailers = videos.filter(
    (video) =>
      video.site === 'YouTube' &&
      (video.type === 'Trailer' || video.type === 'Teaser')
  ).slice(0, 6);

  if (trailers.length === 0) {
    return (
      <div className="trailers-section-empty">
        <p>No trailers available.</p>
      </div>
    );
  }

  const getThumbnailUrl = (key: string) => {
    return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
  };

  return (
    <div className="trailers-section">
      <h2 className="trailers-section-title">Trailers & Videos</h2>
      <div className="trailers-row-container">
        {canScrollLeft && (
          <button 
            className="trailers-arrow trailers-arrow-left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        <div 
          className="trailers-grid"
          ref={scrollContainerRef}
          onScroll={checkScrollButtons}
        >
        {trailers.map((video) => (
          <div
            key={video.id}
            className="trailer-card"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="trailer-thumbnail">
              <img
                src={getThumbnailUrl(video.key)}
                alt={video.name}
                loading="lazy"
              />
              <div className="trailer-overlay">
                <div className="play-button">
                  <Play size={40} fill="white" />
                </div>
              </div>
            </div>
            <div className="trailer-info">
              <h3 className="trailer-name">{video.name}</h3>
              <span className="trailer-type">{video.type}</span>
            </div>
          </div>
        ))}
        </div>
        
        {canScrollRight && (
          <button 
            className="trailers-arrow trailers-arrow-right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="video-modal" onClick={() => setSelectedVideo(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="video-modal-close"
              onClick={() => setSelectedVideo(null)}
            >
              <X size={24} />
            </button>
            <div className="video-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.key}?autoplay=1`}
                title={selectedVideo.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailersSection;
