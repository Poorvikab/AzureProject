import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, LogOut } from 'lucide-react';
import { apiClient, TOKEN_KEY, getErrorMessage } from '../api/client';

interface UserProfile {
  id?: string | number;
  username: string;
  email: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    apiClient
      .get('/api/auth/me')
      .then((response) => {
        if (isMounted) {
          const data = response.data;
          setProfile({
            id: data.id,
            username: data.username || '',
            email: data.email || '',
          });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-12">
      <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/40">
        <h1 className="text-base font-semibold text-zinc-100 mb-6">User Profile</h1>

        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div
              role="alert"
              className="p-3 rounded bg-zinc-900 border border-red-900/60 text-red-400 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <span className="text-xs text-zinc-400 block mb-1">Username</span>
              <span className="text-sm font-medium text-zinc-200">{profile?.username || '—'}</span>
            </div>

            <div>
              <span className="text-xs text-zinc-400 block mb-1">Email</span>
              <span className="text-sm font-medium text-zinc-200">{profile?.email || '—'}</span>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
