import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar } from 'lucide-react';
import type { Movie, TVShow } from '../types';
import { getPosterUrl } from '../services/tmdb';
import LazyImage from './LazyImage';
import './MediaCard.css';

interface MediaCardProps {
  media: Movie | TVShow;
  type: 'movie' | 'tv';
}

const MediaCard = ({ media, type }: MediaCardProps) => {
  const title = type === 'movie' ? (media as Movie).title : (media as TVShow).name;
  const releaseDate = type === 'movie' ? (media as Movie).release_date : (media as TVShow).first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const rating = media.vote_average.toFixed(1);

  return (
    <Link to={`/${type}/${media.id}`} className="media-card">
      <div className="media-card-poster">
        <LazyImage
          src={getPosterUrl(media.poster_path)}
          alt={title}
          className="media-card-img"
          placeholder="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 342 513'%3E%3Crect fill='%231a1a1a' width='342' height='513'/%3E%3C/svg%3E"
        />
        <div className="media-card-hover-meta" aria-hidden="true">
          <div className="media-card-hover-pill">
            <Star size={14} fill="currentColor" />
            <span>{rating}</span>
          </div>
          <div className="media-card-hover-pill">
            <Calendar size={14} />
            <span>{year}</span>
          </div>
        </div>
      </div>
      <div className="media-card-info">
        <h3 className="media-card-title">{title}</h3>
      </div>
    </Link>
  );
};

MediaCard.displayName = 'MediaCard';

export default memo(MediaCard);
