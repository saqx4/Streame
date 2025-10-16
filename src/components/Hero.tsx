import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie, TVShow } from '../types';
import { getBackdropUrl } from '../services/tmdb';
import './Hero.css';

interface HeroProps {
  items: (Movie | TVShow)[];
  type: 'movie' | 'tv';
}

const Hero: React.FC<HeroProps> = ({ items, type }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying, items.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  if (!currentItem || items.length === 0) {
    return (
      <div className="hero-skeleton">
        <div className="hero-skeleton-content">
          <div className="skeleton-title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-buttons"></div>
        </div>
      </div>
    );
  }

  const title = type === 'movie' ? (currentItem as Movie).title : (currentItem as TVShow).name;
  const overview = currentItem.overview;
  const rating = currentItem.vote_average.toFixed(1);

  return (
    <div className="hero">
      <div className="hero-background">
        <img
          src={getBackdropUrl(currentItem.backdrop_path, 'original')}
          alt={title}
          className="hero-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/1280x720/333333/ffffff?text=No+Backdrop';
          }}
        />
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content">
        <div className="hero-info">
          <h1 className="hero-title">{title}</h1>
          <div className="hero-meta">
            <span className="hero-rating">★ {rating}</span>
            <span className="hero-type">{type === 'movie' ? 'Movie' : 'TV Show'}</span>
          </div>
          <p className="hero-overview">
            {overview.length > 300 ? `${overview.substring(0, 300)}...` : overview}
          </p>
          <div className="hero-buttons">
            <Link to={`/${type}/${currentItem.id}`} className="hero-button hero-button-primary">
              <Play size={20} fill="currentColor" />
              Watch Now
            </Link>
            <Link to={`/${type}/${currentItem.id}`} className="hero-button hero-button-secondary">
              <Info size={20} />
              More Info
            </Link>
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button className="hero-nav hero-nav-prev" onClick={goToPrevious}>
            <ChevronLeft size={24} />
          </button>
          <button className="hero-nav hero-nav-next" onClick={goToNext}>
            <ChevronRight size={24} />
          </button>

          <div className="hero-indicators">
            {items.slice(0, 5).map((_, index) => (
              <button
                key={index}
                className={`hero-indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Hero;
