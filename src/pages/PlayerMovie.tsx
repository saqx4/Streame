import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { tmdbService, getStreamingUrl } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import { usePlayerEvents } from '../hooks/usePlayerEvents';
import { useWakeLock } from '../hooks/useWakeLock';
import type { MovieDetails } from '../types';
import './PlayerPage.css';

type ServerKey =
  | 'server1'
  | 'server2'
  | 'server3'
  | 'server4'
  | 'server5'
  | 'server6'
  | 'server7'
  | 'server8'
  | 'server9'
  | 'server10'
  | 'server11'
  | 'server12'
  | 'server13'
  | 'server14'
  | 'server15'
  | 'server16'
  | 'server17'
  | 'server18'
  | 'server21'
  | 'server26'
  | 'server27'
  | 'server28';

const serverOptions: { key: ServerKey; label: string }[] = [
  // Servers with postMessage support (resumable) - RECOMMENDED
  { key: 'server7', label: '⭐ VidLink (JW) - Resumable' },
  { key: 'server8', label: '⭐ VidLink - Resumable' },
  { key: 'server27', label: '⭐ Vidlink.pro - Resumable' },
  // Other servers
  { key: 'server6', label: '⭐ Vidking - Resumable' },
  { key: 'server16', label: 'Vidsrc.cc v3' },
  { key: 'server15', label: 'Vidsrc.cc v2' },
  { key: 'server1', label: 'Vidsrc.xyz' },
  { key: 'server2', label: 'Vidsrc.to' },
  { key: 'server17', label: 'Vidsrc.icu' },
  { key: 'server21', label: 'Vidsrc.me' },
  { key: 'server3', label: 'Vidsrc-embed.ru' },
  { key: 'server10', label: 'Multiembed' },
  { key: 'server13', label: 'AutoEmbed' },
  { key: 'server14', label: 'Player.Autoembed' },
  { key: 'server9', label: 'Embed.su' },
  { key: 'server11', label: 'Filmku' },
  { key: 'server12', label: 'Nontongo' },
  { key: 'server18', label: 'MoviesAPI' },
  { key: 'server4', label: '2Embed.cc' },
  { key: 'server5', label: 'Videasy' },
  { key: 'server26', label: 'Smashystream' },
  { key: 'server28', label: 'Embedsoap' },
];

const PlayerMovie = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const movieId = Number(id);
  const navigate = useNavigate();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<ServerKey>('server7'); // VidLink (JW) - has postMessage support
  const [isTransitioning, setIsTransitioning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuth();

  const startAtParam = searchParams.get('startAt');
  const startAt = startAtParam ? Number(startAtParam) : undefined;

  useWakeLock(true);

  // Use the player events hook to track real playback position
  usePlayerEvents({
    tmdbId: movieId,
    type: 'movie',
    title: movie?.title || '',
    posterPath: movie?.poster_path || null,
    runtime: movie?.runtime,
  });

  useEffect(() => {
    if (!movieId) return;
    // Restore last server used for this movie (per user)
    if (user) {
      const key = `lastServer:${user.id}:movie:${movieId}`;
      const saved = localStorage.getItem(key) as ServerKey | null;
      if (saved) setSelectedServer(saved);
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await tmdbService.getMovieDetails(movieId);
        setMovie(data);
      } catch (err) {
        console.error('Failed to load movie player data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [movieId]);

  // Note: Watch history tracking is now handled by usePlayerEvents hook

  if (loading || !movie) {
    return (
      <div className="player-page">
        <p className="player-loading">Loading player...</p>
      </div>
    );
  }

  return (
    <div className="player-page">
      <div className="player-header">
        <div>
          <h2 className="player-title">Now Playing: {movie.title}</h2>
          <p className="player-note">If video doesn't load, try switching servers below</p>
          <div className="player-meta">
            <span>{movie.release_date?.slice(0, 4) || 'N/A'}</span>
            {movie.runtime ? <span>• {movie.runtime}m</span> : null}
          </div>
        </div>
        <a
          className="download-pill"
          href={`https://dl.vidsrc.vip/movie/${movie.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={16} />
          Download
        </a>
      </div>

      <div className="player-frame">
        <iframe
          ref={iframeRef}
          className={isTransitioning ? 'transitioning' : ''}
          src={getStreamingUrl(movie.id, 'movie', selectedServer, undefined, undefined, startAt)}
          title={movie.title}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      <div className="player-controls" style={{ justifyContent: 'flex-start' }}>
        <button className="player-cta" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>

      <div className="server-panel">
        <div className="server-panel-header">
          <h3 className="selector-title">Choose Server</h3>
          <span className="status-text">Available</span>
        </div>
        <div className="server-grid">
          {serverOptions.map((option, idx) => (
            <button
              key={option.key}
              className={`server-pill ${selectedServer === option.key ? 'active' : ''}`}
              onClick={() => {
                if (selectedServer !== option.key) {
                  if (user) {
                    localStorage.setItem(`lastServer:${user.id}:movie:${movieId}`, option.key);
                  }
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setSelectedServer(option.key);
                    setTimeout(() => setIsTransitioning(false), 50);
                  }, 300);
                }
              }}
            >
              <div>
                <div className="server-label">Server {idx + 1}</div>
                <div className="server-quality">HD</div>
              </div>
              <div className="server-number">{idx + 1}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerMovie;
