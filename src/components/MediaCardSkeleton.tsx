import Skeleton from './Skeleton';
import './MediaCardSkeleton.css';

const MediaCardSkeleton = () => {
  return (
    <div className="media-card-skeleton">
      <Skeleton variant="card" className="media-card-skeleton-image" />
      <div className="media-card-skeleton-content">
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="90%" height={14} />
        <Skeleton variant="text" width="70%" height={14} />
      </div>
    </div>
  );
};

export default MediaCardSkeleton;
