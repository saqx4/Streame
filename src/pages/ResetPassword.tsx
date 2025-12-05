import React, { useState } from 'react';
import './Auth.css';
import { useAuth } from '../context/AuthContext';

const ResetPassword: React.FC = () => {
  const { updatePassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const { error } = await updatePassword(password);
    if (error) setError(error);
    else setMessage('Password updated. You can now close this page or continue browsing.');
  };

  return (
    <div className="auth-page container">
      <div className="auth-card card">
        <h1 className="mb-4">Set new password</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label className="selector-label">New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <label className="selector-label">Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
          {message && <p style={{ color: 'var(--success)' }}>{message}</p>}
          <button className="btn btn-primary" disabled={loading || !password || !confirm}>Update password</button>
          <a href="/login" className="btn btn-outline">Back to login</a>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
