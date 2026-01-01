import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, CircleChevronLeft, CircleChevronRight } from 'lucide-react';
import type { Movie, TVShow } from '../types';
import { getBackdropUrl, getImageUrl, tmdbService } from '../services/tmdb';
import './Hero.css';

interface HeroProps {
  items: (Movie | TVShow)[];
}

const Hero = ({ items }: HeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [logoPath, setLogoPath] = useState<string | null>(null);

  const currentItem = items[currentIndex];

  useEffect(() => {
    const fetchLogo = async () => {
      setLogoPath(null);
      if (!currentItem) return;
      const isMovie = 'title' in currentItem;
      try {
        const images = isMovie
          ? await tmdbService.getMovieImages(currentItem.id)
          : await tmdbService.getTVShowImages(currentItem.id);
        const logos: any[] = images?.logos || [];
        const bestLogo =
          logos.find((l) => l?.iso_639_1 === 'en') || logos.find((l) => !l?.iso_639_1) || logos[0];
        setLogoPath(bestLogo?.file_path ?? null);
      } catch {
        setLogoPath(null);
      }
    };

    fetchLogo();
  }, [currentItem]);

  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 6000);

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

  const isMovie = 'title' in currentItem;
  const title = isMovie ? (currentItem as Movie).title : (currentItem as TVShow).name;
  const overview = currentItem.overview;
  const rating = currentItem.vote_average.toFixed(1);
  const releaseDate = isMovie 
    ? (currentItem as Movie).release_date?.split('-')[0] 
    : (currentItem as TVShow).first_air_date?.split('-')[0];
  
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
          <div className="hero-badge">
            <span className="badge-text">Featured</span>
            <span className="badge-rating">{rating}</span>
            <span className="badge-year">{releaseDate}</span>
          </div>

          {logoPath ? (
            <img className="hero-logo" src={getImageUrl(logoPath, 'w500')} alt={title} loading="lazy" />
          ) : (
            <h1 className="hero-title">{title}</h1>
          )}
          
          <p className="hero-overview">
            {overview.length > 180 ? `${overview.substring(0, 180)}...` : overview}
          </p>
          
          <div className="hero-actions">
            <Link to={`/${isMovie ? 'movie' : 'tv'}/${currentItem.id}`} className="hero-button hero-button-primary">
              <Play size={20} fill="currentColor" />
              <span>Watch Now</span>
            </Link>
            <Link to={`/${isMovie ? 'movie' : 'tv'}/${currentItem.id}`} className="hero-button hero-button-secondary">
              <Info size={20} />
              <span>More Info</span>
            </Link>
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button className="hero-nav hero-nav-prev" onClick={goToPrevious}>
            <CircleChevronLeft size={32} />
          </button>
          <button className="hero-nav hero-nav-next" onClick={goToNext}>
            <CircleChevronRight size={32} />
          </button>
        </>
      )}
    </div>
  );
};

export default Hero;