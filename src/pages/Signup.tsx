import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { signUpWithPassword, resendConfirmation, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
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
    const { error } = await signUpWithPassword(email.trim(), password);
    if (error) {
      setError(error);
    } else {
      setMessage('Account created! Redirecting to home...');
      // Redirect to home after 2 seconds
      setTimeout(() => navigate('/'), 2000);
    }
  };

  const onResend = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const { error } = await resendConfirmation(email.trim());
    if (error) setError(error);
    else setMessage('Confirmation email resent. Please check your inbox/spam.');
  };

  return (
    <div className="auth-page container">
      <div className="auth-card card">
        <h1 className="mb-4">Create account</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label className="selector-label">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="selector-label">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <label className="selector-label">Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
          {message && <p style={{ color: 'var(--success)' }}>{message}</p>}
          <button className="btn btn-primary" disabled={loading || !email || !password || !confirm}>Sign up</button>
          <button className="btn btn-outline" onClick={onResend} disabled={loading || !email}>Resend confirmation</button>
          <a href="/login" className="btn btn-outline">Have an account? Sign in</a>
        </form>
      </div>
    </div>
  );
};

export default Signup;
