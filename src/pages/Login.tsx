import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { useAuth } from '../context/AuthContext';
import { isSupabaseEnabled } from '../lib/supabaseClient';

const Login = () => {
  const { signInWithPassword, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [error, setError] = useState<string | null>(null);

  const onPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) {
      setError(error);
    } else {
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email.trim());
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      // Redirect to home page after successful login
      navigate('/');
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-card card">
        <h1 className="mb-4">Sign in</h1>
        {!isSupabaseEnabled && (
          <p style={{ margin: '0 0 10px', color: 'var(--text-secondary)', fontSize: 13 }}>
            Dev login mode is enabled (Supabase env vars not configured). Any email/password will sign you in locally.
          </p>
        )}
        <form onSubmit={onPasswordLogin} className="auth-form">
          <label className="selector-label">Email</label>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="selector-label">Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ cursor: 'pointer', margin: 0 }}>Remember me</label>
          </div>
          {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
          <button className="btn btn-primary" disabled={loading || !email || !password}>Sign in</button>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <a className="btn btn-outline" href="/signup">Create account</a>
            <a className="btn btn-outline" href="/forgot-password">Forgot password?</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
