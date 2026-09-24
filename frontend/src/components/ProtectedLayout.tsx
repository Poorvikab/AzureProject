import { NavLink, Outlet } from 'react-router-dom';
import { User } from 'lucide-react';

export default function ProtectedLayout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-zinc-100 font-medium transition-colors'
      : 'text-zinc-400 hover:text-zinc-200 transition-colors';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        {/* Left: App Name */}
        <NavLink
          to="/chat"
          className="text-base font-semibold tracking-tight text-zinc-100 hover:text-zinc-300 transition-colors"
        >
          MediaSense
        </NavLink>

        {/* Middle: Upload | Chat | Voice */}
        <nav className="flex items-center gap-3 text-sm">
          <NavLink to="/upload" className={navLinkClass}>
            Upload
          </NavLink>
          <span className="text-zinc-700" aria-hidden="true">|</span>
          <NavLink to="/chat" className={navLinkClass}>
            Chat
          </NavLink>
          <span className="text-zinc-700" aria-hidden="true">|</span>
          <NavLink to="/voice" className={navLinkClass}>
            Voice
          </NavLink>
        </nav>

        {/* Right: Profile Icon/Link */}
        <div className="flex items-center">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `p-1.5 rounded-md border transition-colors ${
                isActive
                  ? 'border-zinc-600 bg-zinc-900 text-zinc-100'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`
            }
            title="Profile"
            aria-label="User Profile"
          >
            <User className="w-4 h-4" />
          </NavLink>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
