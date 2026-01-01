import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Search, User, Settings, LogIn, Bookmark } from 'lucide-react';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [profileNonce, setProfileNonce] = useState(0);

  useEffect(() => {
    const onProfileUpdated = () => setProfileNonce((n) => n + 1);
    window.addEventListener('streame:profile-updated', onProfileUpdated as EventListener);
    return () => window.removeEventListener('streame:profile-updated', onProfileUpdated as EventListener);
  }, []);

  const { letter, avatarBg } = useMemo(() => {
    const hashHue = (input: string) => {
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
      }
      return hash % 360;
    };

    const displayName = (() => {
      if (user?.id) {
        try {
          const storedName = localStorage.getItem(`streame.username.${user.id}`);
          if (storedName && storedName.trim().length > 0) return storedName.trim();
        } catch {}
      }

      const meta = (user as any)?.user_metadata;
      const fromMeta = typeof meta?.username === 'string' ? meta.username : null;
      if (fromMeta && fromMeta.trim().length > 0) return fromMeta.trim();
      const email = typeof user?.email === 'string' ? user.email : '';
      if (email.includes('@')) return email.split('@')[0];
      return email || 'User';
    })();

    const initial = String(displayName).slice(0, 1).toUpperCase();
    const hue = (() => {
      if (user?.id) {
        try {
          const storedHue = localStorage.getItem(`streame.avatarHue.${user.id}`);
          const parsedHue = storedHue != null ? Number(storedHue) : NaN;
          if (Number.isFinite(parsedHue)) return ((parsedHue % 360) + 360) % 360;
        } catch {}
      }

      const meta = (user as any)?.user_metadata;
      const metaHueRaw = (meta as any)?.avatar_color;
      const metaHue = typeof metaHueRaw === 'number' ? metaHueRaw : Number.isFinite(Number(metaHueRaw)) ? Number(metaHueRaw) : NaN;
      if (Number.isFinite(metaHue)) return ((metaHue % 360) + 360) % 360;

      return hashHue(String(user?.id ?? user?.email ?? displayName));
    })();
    const bg = `linear-gradient(135deg, hsl(${hue} 85% 52%), hsl(${(hue + 42) % 360} 85% 45%))`;

    return { letter: initial, avatarBg: bg };
  }, [profileNonce, user]);

  // Check if current route is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="dock">
      <div className="dock-surface">
        <Link to="/" className={`dock-item ${isActive('/') ? 'active' : ''}`} aria-label="Home">
          <Home size={18} />
          <span className="dock-label">Home</span>
        </Link>

        <Link to="/movies" className={`dock-item ${isActive('/movies') ? 'active' : ''}`} aria-label="Movies">
          <Film size={18} />
          <span className="dock-label">Movies</span>
        </Link>

        <Link to="/tv-shows" className={`dock-item ${isActive('/tv-shows') ? 'active' : ''}`} aria-label="TV Shows">
          <Tv size={18} />
          <span className="dock-label">TV</span>
        </Link>

        <Link
          to={user ? '/watchlist' : '/login'}
          className={`dock-item ${isActive('/watchlist') ? 'active' : ''}`}
          aria-label="Watchlist"
        >
          <Bookmark size={18} />
          <span className="dock-label">Watchlist</span>
        </Link>

        <Link to="/search" className={`dock-item ${isActive('/search') ? 'active' : ''}`} aria-label="Search">
          <Search size={18} />
        </Link>

        <Link to="/settings" className={`dock-item ${isActive('/settings') ? 'active' : ''}`} aria-label="Settings">
          <Settings size={18} />
          <span className="dock-label">Settings</span>
        </Link>

        <Link to={user ? '/profile' : '/login'} className={`dock-item ${isActive(user ? '/profile' : '/login') ? 'active' : ''}`} aria-label={user ? 'Profile' : 'Login'}>
          {user ? (
            <div className="dock-avatar-fallback" style={{ background: avatarBg }} aria-hidden="true">
              {letter || <User size={18} />}
            </div>
          ) : (
            <LogIn size={18} />
          )}
          <span className="dock-label">{user ? 'Profile' : 'Login'}</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;