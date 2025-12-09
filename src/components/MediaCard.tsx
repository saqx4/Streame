import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar } from 'lucide-react';
import type { Movie, TVShow } from '../types';
import { getPosterUrl } from '../services/tmdb';
import './MediaCard.css';

interface MediaCardProps {
  media: Movie | TVShow;
  type: 'movie' | 'tv';
}

const MediaCard: React.FC<MediaCardProps> = ({ media, type }) => {
  const title = type === 'movie' ? (media as Movie).title : (media as TVShow).name;
  const releaseDate = type === 'movie' ? (media as Movie).release_date : (media as TVShow).first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const rating = media.vote_average.toFixed(1);

  return (
    <Link to={`/${type}/${media.id}`} className="media-card">
      <div className="media-card-image">
        <img
          src={getPosterUrl(media.poster_path)}
          alt={title}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/500x750/333333/ffffff?text=No+Image';
          }}
        />
        <div className="media-card-overlay">
          <div className="media-card-rating">
            <Star size={14} fill="currentColor" />
            <span>{rating}</span>
          </div>
          <div className="media-card-year">
            <Calendar size={14} />
            <span>{year}</span>
          </div>
        </div>
      </div>
      <div className="media-card-content">
        <h3 className="media-card-title">{title}</h3>
        <p className="media-card-overview">
          {media.overview.length > 100
            ? `${media.overview.substring(0, 100)}...`
            : media.overview || 'No description available.'}
        </p>
      </div>
    </Link>
  );
};

MediaCard.displayName = 'MediaCard';

export default memo(MediaCard);
