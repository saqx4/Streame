import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { user, signOut, sendPasswordReset } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  if (!user) return null;

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="card">
        <h1 className="mb-4">Profile</h1>
        <div style={{ display: 'grid', gap: 12 }}>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>User ID:</strong> {user.id}</div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="btn btn-secondary" href="/watchlist">Watchlist</a>
          <button className="btn btn-outline" onClick={onSendReset} disabled={busy}>Send password reset email</button>
          <button className="btn btn-outline" onClick={signOut}>Sign out</button>
        </div>
        {(msg || err) && (
          <div style={{ marginTop: 12 }}>
            {msg && <div style={{ color: 'var(--success)' }}>{msg}</div>}
            {err && <div style={{ color: 'var(--error)' }}>{err}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
