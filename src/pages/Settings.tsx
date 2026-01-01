import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Check, LogOut } from 'lucide-react';
import { useTheme, type ThemeId } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const { theme, setTheme, blur, setBlur } = useTheme();
  const { user, signOut } = useAuth();

  const themes = useMemo(
    () =>
      [
        { id: 'glassy-light' as ThemeId, label: 'Glassy Light' },
        { id: 'midnight' as ThemeId, label: 'Midnight' },
        { id: 'deep-forest' as ThemeId, label: 'Deep Forest' },
        { id: 'aura' as ThemeId, label: 'Aura' },
        { id: 'netflix' as ThemeId, label: 'Netflix' },
        { id: 'appletv' as ThemeId, label: 'Apple TV' },
        { id: 'prime' as ThemeId, label: 'Prime Video' },
        { id: 'hbo' as ThemeId, label: 'HBO' },
      ],
    []
  );

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Theme, blur, and account controls.</p>
      </div>

      <div className="settings-grid">
        <section className="settings-card glass-effect">
          <h2 className="settings-card-title">Appearance</h2>

          <div className="settings-field">
            <div className="settings-label-row">
              <span className="settings-label">Theme</span>
              <span className="settings-value">{themes.find((t) => t.id === theme)?.label}</span>
            </div>
            <div className="theme-choices">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-choice ${theme === t.id ? 'active' : ''}`}
                  onClick={() => setTheme(t.id)}
                >
                  <span className="theme-choice-label">{t.label}</span>
                  {theme === t.id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <div className="settings-label-row">
              <span className="settings-label">Blur Intensity</span>
              <span className="settings-value">{blur}px</span>
            </div>
            <input
              className="settings-slider"
              type="range"
              min={0}
              max={40}
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
            />
          </div>
        </section>

        <section className="settings-card glass-effect">
          <h2 className="settings-card-title">Account</h2>

          {user ? (
            <>
              <div className="settings-field">
                <div className="settings-label-row">
                  <span className="settings-label">Signed in</span>
                  <span className="settings-value">{user.email}</span>
                </div>
              </div>

              <div className="settings-actions">
                <Link to="/profile" className="settings-link">
                  Manage profile
                </Link>
                <button type="button" className="settings-logout" onClick={() => signOut()}>
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="settings-actions">
              <Link to="/login" className="settings-link">
                Sign in
              </Link>
              <Link to="/signup" className="settings-link">
                Create account
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Settings;
