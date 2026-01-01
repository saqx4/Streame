import { useEffect, useState } from 'react';
import './Auth.css';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseEnabled } from '../lib/supabaseClient';

const ResetPassword = () => {
  const { updatePassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyingLink, setVerifyingLink] = useState(false);
  const [linkVerified, setLinkVerified] = useState(false);

  useEffect(() => {
    if (!isSupabaseEnabled) return;

    let cancelled = false;
    const run = async () => {
      setVerifyingLink(true);
      setError(null);

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const tokenHash = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type');

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          url.searchParams.delete('code');
          window.history.replaceState({}, document.title, url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash);
        } else if (tokenHash && type) {
          await supabase.auth.verifyOtp({ type: type as any, token_hash: tokenHash } as any);
          url.searchParams.delete('token_hash');
          url.searchParams.delete('type');
          window.history.replaceState({}, document.title, url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash);
        } else if (url.hash && url.hash.includes('access_token=')) {
          const params = new URLSearchParams(url.hash.replace(/^#/, ''));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }

          window.history.replaceState({}, document.title, url.pathname + url.search);
        }

        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          setLinkVerified(!!data.session);
          if (!data.session) {
            setError('Reset link is missing or expired. Please request a new one.');
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Failed to verify reset link. Please request a new one.');
          setLinkVerified(false);
        }
      } finally {
        if (!cancelled) setVerifyingLink(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

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
        {isSupabaseEnabled && verifyingLink && (
          <p style={{ color: 'var(--text-secondary)' }}>Verifying reset link…</p>
        )}
        <form onSubmit={onSubmit} className="auth-form">
          <label className="selector-label">New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <label className="selector-label">Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
          {message && <p style={{ color: 'var(--success)' }}>{message}</p>}
          <button className="btn btn-primary" disabled={loading || verifyingLink || (isSupabaseEnabled && !linkVerified) || !password || !confirm}>Update password</button>
          <a href="/login" className="btn btn-outline">Back to login</a>
          {isSupabaseEnabled && !verifyingLink && !linkVerified && (
            <a href="/forgot-password" className="btn btn-outline">Request new reset link</a>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
