import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { tmdbService, getStreamingUrl } from '../services/tmdb';
import type { MovieDetails } from '../types';
import './PlayerPage.css';

type ServerKey = 'server1' | 'server2' | 'server3' | 'server4' | 'server5';

const PlayerMovie: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);
  const navigate = useNavigate();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<ServerKey>('server1');

  useEffect(() => {
    if (!movieId) return;
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
          src={getStreamingUrl(movie.id, 'movie', selectedServer)}
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
          {(['server1', 'server2', 'server3', 'server4', 'server5'] as ServerKey[]).map((serverKey, idx) => (
            <button
              key={serverKey}
              className={`server-pill ${selectedServer === serverKey ? 'active' : ''}`}
              onClick={() => setSelectedServer(serverKey)}
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
