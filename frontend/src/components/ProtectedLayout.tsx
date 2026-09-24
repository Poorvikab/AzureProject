import { NavLink, Outlet } from 'react-router-dom';
import { User } from 'lucide-react';

export default function ProtectedLayout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-white shadow-[0_8px_30px_rgba(168,85,247,0.18)] transition-colors'
      : 'rounded-full border border-transparent px-3 py-1.5 text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white transition-colors';

  return (
    <div className="page-shell flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="page-shell-inner flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink
            to="/chat"
            className="text-base font-semibold tracking-tight text-white hover:text-slate-200 transition-colors"
          >
            MediaSense
          </NavLink>

          <nav className="flex items-center gap-2 text-sm">
            <NavLink to="/upload" className={navLinkClass}>
              Upload
            </NavLink>
            <NavLink to="/chat" className={navLinkClass}>
              Chat
            </NavLink>
            <NavLink to="/voice" className={navLinkClass}>
              Voice
            </NavLink>
          </nav>

          <div className="flex items-center">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  isActive
                    ? 'border-white/20 bg-white/[0.08] text-white'
                    : 'border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/20 hover:text-white'
                }`
              }
              title="Profile"
              aria-label="User Profile"
            >
              <User className="w-4 h-4" />
            </NavLink>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
