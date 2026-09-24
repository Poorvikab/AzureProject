import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { apiClient, TOKEN_KEY, getErrorMessage } from '../api/client';

export default function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password) {
      setError('Please provide a username, email address, and password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/auth/signup', {
        username: username.trim(),
        email: email.trim(),
        password,
      });

      const token = response.data?.access_token;
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        navigate('/upload', { replace: true });
      } else {
        setError('No access token received in server response.');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell auth-shell">
      <div className="page-shell-inner max-w-md py-12">
        <div className="glass-panel p-6 sm:p-8">
          <div className="mb-8 text-center">
            <div className="mb-5 flex justify-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-rose-200 shadow-[0_0_30px_rgba(251,113,133,0.35)]">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <Link
              to="/"
              className="text-xl font-semibold tracking-tight text-white hover:text-slate-200 transition-colors"
            >
              MediaSense
            </Link>
            <h1 className="mt-4 text-2xl font-semibold text-white">Create your account</h1>
            <p className="mt-2 text-sm text-slate-300">
              Start with your profile, then upload your files to unlock a grounded digital twin.
            </p>
          </div>

          {error && (
            <div role="alert" className="status-banner error mb-5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="field-input"
                placeholder="username"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="field-input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="field-input"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure account with grounded document access</span>
            </div>

            <button type="submit" disabled={isLoading} className="primary-button mt-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-300">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:text-slate-100">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
