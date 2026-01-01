import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseEnabled } from '../lib/supabaseClient';
import './Profile.css';

const Profile = () => {
  const { user, signOut, sendPasswordReset } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarHue, setAvatarHue] = useState<number | null>(null);

  const hashHue = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash % 360;
  };

  const defaultName = useMemo(() => {
    const meta = (user as any)?.user_metadata;
    const fromMeta = typeof meta?.username === 'string' ? meta.username : null;
    if (fromMeta && fromMeta.trim().length > 0) return fromMeta.trim();
    const email = typeof user?.email === 'string' ? user.email : '';
    if (email.includes('@')) return email.split('@')[0];
    return email || 'User';
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const meta = (user as any)?.user_metadata;
    const metaName = typeof meta?.username === 'string' ? meta.username.trim() : '';
    const metaHueRaw = (meta as any)?.avatar_color;
    const metaHue = typeof metaHueRaw === 'number' ? metaHueRaw : Number.isFinite(Number(metaHueRaw)) ? Number(metaHueRaw) : null;

    try {
      const storedName = localStorage.getItem(`streame.username.${user.id}`);
      if (storedName && storedName.trim().length > 0) setUsername(storedName.trim());
      else if (metaName) setUsername(metaName);
      else setUsername(defaultName);

      const storedHue = localStorage.getItem(`streame.avatarHue.${user.id}`);
      const parsedHue = storedHue != null ? Number(storedHue) : NaN;
      if (Number.isFinite(parsedHue)) setAvatarHue(((parsedHue % 360) + 360) % 360);
      else if (metaHue != null && Number.isFinite(metaHue)) setAvatarHue(((metaHue % 360) + 360) % 360);
      else setAvatarHue(null);
    } catch {
      if (metaName) setUsername(metaName);
      else setUsername(defaultName);
      if (metaHue != null && Number.isFinite(metaHue)) setAvatarHue(((metaHue % 360) + 360) % 360);
      else setAvatarHue(null);
    }

    if (!isSupabaseEnabled) return;

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_color')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) return;

      if (typeof (data as any).username === 'string' && (data as any).username.trim().length > 0) {
        setUsername((data as any).username.trim());
      }

      const dbHueRaw = (data as any).avatar_color;
      const dbHue = typeof dbHueRaw === 'number' ? dbHueRaw : Number.isFinite(Number(dbHueRaw)) ? Number(dbHueRaw) : null;
      if (dbHue != null && Number.isFinite(dbHue)) setAvatarHue(((dbHue % 360) + 360) % 360);
    })();
  }, [defaultName, user?.id]);

  const resolvedName = username.trim().length > 0 ? username.trim() : defaultName;
  const resolvedHue = avatarHue != null && Number.isFinite(avatarHue)
    ? ((avatarHue % 360) + 360) % 360
    : hashHue(String(user?.id ?? user?.email ?? resolvedName));

  const letter = String(resolvedName).slice(0, 1).toUpperCase();
  const avatarBg = `linear-gradient(135deg, hsl(${resolvedHue} 85% 52%), hsl(${(resolvedHue + 42) % 360} 85% 45%))`;

  const onSendReset = async () => {
    if (!user?.email) return;
    setErr(null);
    setMsg(null);
    setBusy(true);
    const { error } = await sendPasswordReset(user.email);
    if (error) setErr(error);
    else setMsg('Password reset email sent. Please check your inbox.');
    setBusy(false);
  };

  const onSaveProfile = async () => {
    if (!user?.id) return;
    setErr(null);
    setMsg(null);
    setSaving(true);

    const nextName = username.trim();
    const nextHue = ((resolvedHue % 360) + 360) % 360;

    try {
      try {
        localStorage.setItem(`streame.username.${user.id}`, nextName);
        localStorage.setItem(`streame.avatarHue.${user.id}`, String(nextHue));
      } catch {}

      if (isSupabaseEnabled) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: user.id, username: nextName || null, avatar_color: nextHue } as any, { onConflict: 'id' } as any);

        if (upsertError) throw upsertError;

        const { error: metaError } = await supabase.auth.updateUser({
          data: { username: nextName || null, avatar_color: nextHue } as any,
        });
        if (metaError) throw metaError;
      }

      window.dispatchEvent(new Event('streame:profile-updated'));
      setMsg('Profile updated.');
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-card glass-effect">
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="profile-avatar-fallback" style={{ background: avatarBg }} aria-hidden="true">
              {letter}
            </div>
          </div>

          <div className="profile-header-text">
            <h1 className="profile-title">{resolvedName}</h1>
            <p className="profile-subtitle">{user.email}</p>
          </div>
        </div>

        <div className="profile-grid">
          <section className="profile-section">
            <h2 className="profile-section-title">Account</h2>
            <div className="profile-kv">
              <div className="profile-k">Email</div>
              <div className="profile-v">{user.email}</div>
            </div>
            <div className="profile-kv">
              <div className="profile-k">User ID</div>
              <div className="profile-v">{user.id}</div>
            </div>
            <div className="profile-kv">
              <div className="profile-k">Username</div>
              <div className="profile-v">{resolvedName}</div>
            </div>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Profile</h2>
            <p className="profile-help">Change your username and avatar color.</p>

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-username">Username</label>
              <input
                id="profile-username"
                className="profile-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={defaultName}
                maxLength={24}
                autoComplete="nickname"
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-color">Avatar color</label>
              <div className="profile-color-row">
                <div className="profile-color-preview" style={{ background: avatarBg }} aria-hidden="true" />
                <input
                  id="profile-color"
                  className="profile-range"
                  type="range"
                  min={0}
                  max={359}
                  value={resolvedHue}
                  onChange={(e) => setAvatarHue(Number(e.target.value))}
                />
              </div>
              <div className="profile-swatches" role="group" aria-label="Avatar color presets">
                {[0, 18, 40, 60, 90, 120, 160, 200, 230, 260, 290, 320].map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`profile-swatch ${resolvedHue === h ? 'active' : ''}`}
                    style={{ background: `linear-gradient(135deg, hsl(${h} 85% 52%), hsl(${(h + 42) % 360} 85% 45%))` }}
                    onClick={() => setAvatarHue(h)}
                    aria-label={`Hue ${h}`}
                  />
                ))}
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn btn-primary" type="button" onClick={onSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setUsername(defaultName);
                  setAvatarHue(null);
                }}
                disabled={saving}
              >
                Reset
              </button>
            </div>
          </section>
        </div>

        <div className="profile-footer">
          <Link className="btn btn-primary profile-watchlist-btn" to="/watchlist">Watchlist</Link>
          <button className="btn btn-outline" onClick={onSendReset} disabled={busy}>
            Send password reset email
          </button>
          <button className="btn btn-outline" onClick={signOut}>
            Sign out
          </button>
        </div>

        {(msg || err) && (
          <div className="profile-messages">
            {msg && <div style={{ color: 'var(--success)' }}>{msg}</div>}
            {err && <div style={{ color: 'var(--error)' }}>{err}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
