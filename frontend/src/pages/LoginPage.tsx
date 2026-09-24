import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiClient, TOKEN_KEY, getErrorMessage } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });

      const token = response.data?.access_token;
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        navigate('/chat', { replace: true });
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-zinc-100 hover:text-zinc-300 transition-colors"
          >
            MediaSense
          </Link>
          <h1 className="text-xl font-medium mt-3 text-zinc-200">Sign in to your account</h1>
        </div>

        {/* Error Notice */}
        {error && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-md bg-zinc-900 border border-red-900/60 text-red-400 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-400 mb-1.5"
            >
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
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-400 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2 px-4 bg-zinc-100 text-zinc-900 text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Signup Link */}
        <div className="text-center mt-6 text-xs text-zinc-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-zinc-200 hover:text-white underline underline-offset-4"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
