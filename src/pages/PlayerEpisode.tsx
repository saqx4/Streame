import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { tmdbService, getStreamingUrl } from '../services/tmdb';
import type { TVShowDetails } from '../types';
import './PlayerPage.css';
import { useAuth } from '../context/AuthContext';
import { userProgressService } from '../services/userProgress';

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
  | 'server18';

const serverOptions: { key: ServerKey; label: string }[] = [
  { key: 'server1', label: 'Vidsrc.xyz' },
  { key: 'server2', label: 'Vidsrc.to' },
  { key: 'server3', label: 'Vidsrc-embed.ru' },
  { key: 'server4', label: '2Embed.cc' },
  { key: 'server5', label: 'Videasy' },
  { key: 'server6', label: 'Vidking' },
  { key: 'server7', label: 'VidLink (JW)' },
  { key: 'server8', label: 'VidLink' },
  { key: 'server9', label: 'Embed.su' },
  { key: 'server10', label: 'Multiembed' },
  { key: 'server11', label: 'Filmku' },
  { key: 'server12', label: 'Nontongo' },
  { key: 'server13', label: 'AutoEmbed' },
  { key: 'server14', label: 'Player.Autoembed' },
  { key: 'server15', label: 'Vidsrc.cc v2' },
  { key: 'server16', label: 'Vidsrc.cc v3' },
  { key: 'server17', label: 'Vidsrc.icu' },
  { key: 'server18', label: 'MoviesAPI' },
];

const PlayerEpisode: React.FC = () => {
  const { tvId, seasonNumber, episodeNumber } = useParams<{
    tvId: string;
    seasonNumber: string;
    episodeNumber: string;
  }>();

  const navigate = useNavigate();
  const [tvShow, setTvShow] = useState<TVShowDetails | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<ServerKey>('server1');
  const { user } = useAuth();

  const seasonNum = Number(seasonNumber || 1);
  const episodeNum = Number(episodeNumber || 1);
  const tvNumericId = Number(tvId);

  useEffect(() => {
    const fetchData = async () => {
      if (!tvNumericId) return;
      setLoading(true);
      try {
        const [details, season] = await Promise.all([
          tmdbService.getTVShowDetails(tvNumericId),
          tmdbService.getSeasonDetails(tvNumericId, seasonNum),
        ]);
        setTvShow(details);
        setEpisodes(season.episodes || []);
      } catch (err) {
        console.error('Failed to load episode player data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [tvNumericId, seasonNum]);

  const currentEpisode = useMemo(
    () => episodes.find((e) => e.episode_number === episodeNum),
    [episodes, episodeNum]
  );

  const { hasPrev, hasNext, prevEpisode, nextEpisode } = useMemo(() => {
    if (!episodes.length) return { hasPrev: false, hasNext: false, prevEpisode: null, nextEpisode: null };
    const idx = episodes.findIndex((e) => e.episode_number === episodeNum);
    return {
      hasPrev: idx > 0,
      hasNext: idx < episodes.length - 1,
      prevEpisode: idx > 0 ? episodes[idx - 1] : null,
      nextEpisode: idx < episodes.length - 1 ? episodes[idx + 1] : null,
    };
  }, [episodes, episodeNum]);

  const goToEpisode = (epNum: number) => {
    navigate(`/watch/tv/${tvNumericId}/season/${seasonNum}/episode/${epNum}`, { replace: true });
  };

  // Persist progress when user is logged in (cross-device) and also cache locally
  useEffect(() => {
    if (!user || !tvShow) return;
    const data = { season: seasonNum, episode: episodeNum };
    const key = `lastWatched:${user.id}:tv:${tvNumericId}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore localStorage errors
    }
    userProgressService.set(user.id, tvNumericId, data).catch((err: unknown) => {
      console.warn('Failed to persist progress from player page', err);
    });
  }, [user, tvShow, seasonNum, episodeNum, tvNumericId]);

  if (loading || !tvShow) {
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
          <h2 className="player-title">
            Now Playing: {tvShow.name} - Season {seasonNum}, Episode {episodeNum}
          </h2>
          <p className="player-note">If video doesn't load, try switching servers below</p>
          {currentEpisode?.name && (
            <div className="player-meta">
              <span>{currentEpisode.name}</span>
              {currentEpisode.runtime ? <span>• {currentEpisode.runtime}m</span> : null}
            </div>
          )}
        </div>
        <a
          className="download-pill"
          href={`https://dl.vidsrc.vip/tv/${tvShow.id}/${seasonNum}/${episodeNum}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={16} />
          Download
        </a>
      </div>

      <div className="player-frame">
        <iframe
          src={getStreamingUrl(tvShow.id, 'tv', selectedServer, seasonNum, episodeNum)}
          title={`${tvShow.name} S${seasonNum}E${episodeNum}`}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      <div className="player-controls">
        <div className="episode-nav">
          <button onClick={() => prevEpisode && goToEpisode(prevEpisode.episode_number)} disabled={!hasPrev}>
            <ChevronLeft size={16} /> Prev
          </button>
          <button onClick={() => nextEpisode && goToEpisode(nextEpisode.episode_number)} disabled={!hasNext}>
            Next <ChevronRight size={16} />
          </button>
        </div>
        <div className="player-meta">
          <span>Season {seasonNum}</span>
          <span>•</span>
          <span>{episodes.length} episodes</span>
        </div>
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
              onClick={() => setSelectedServer(option.key)}
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

export default PlayerEpisode;
