import { useState } from 'react';
import './Auth.css';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const { sendPasswordReset, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const { error } = await sendPasswordReset(email.trim());
    if (error) setError(error);
    else setMessage('Check your email for a password reset link.');
  };

  return (
    <div className="auth-page container">
      <div className="auth-card card">
        <h1 className="mb-4">Forgot password</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label className="selector-label">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
          {message && <p style={{ color: 'var(--success)' }}>{message}</p>}
          <button className="btn btn-primary" disabled={loading || !email}>Send reset link</button>
          <a href="/login" className="btn btn-outline">Back to login</a>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
