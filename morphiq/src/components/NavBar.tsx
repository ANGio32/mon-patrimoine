import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Utensils, Dumbbell, TrendingUp, User, Plus, X, UtensilsCrossed, ScanLine } from 'lucide-react';

const TABS = [
  { to: '/',          Icon: Home,       end: true  },
  { to: '/nutrition', Icon: Utensils,   end: false },
  { to: '/fitness',   Icon: Dumbbell,   end: false },
  { to: '/progress',  Icon: TrendingUp, end: false },
  { to: '/profile',   Icon: User,       end: false },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }

  const fabBottom = 'calc(max(1.75rem, env(safe-area-inset-bottom)) + 72px)';

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Action sheet — anchored to right, above FAB */}
      {open && (
        <div
          className="fixed z-50 flex flex-col gap-2"
          style={{ bottom: 'calc(max(1.75rem, env(safe-area-inset-bottom)) + 132px)', right: 20, minWidth: 220 }}
        >
          <button
            onClick={() => go('/log')}
            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 active:scale-95 transition-all"
            style={{ boxShadow: '0 4px 20px rgba(31,27,20,0.12)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#DCE3CE' }}>
              <UtensilsCrossed size={18} color="#5A6B47" />
            </div>
            <div className="text-left">
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1F1B14' }}>Ajouter un repas</div>
              <div style={{ fontSize: 11, color: '#8A8270' }}>Logger calories & macros</div>
            </div>
          </button>

          <button
            onClick={() => go('/menu')}
            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 active:scale-95 transition-all"
            style={{ boxShadow: '0 4px 20px rgba(31,27,20,0.12)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F4DBC2' }}>
              <ScanLine size={18} color="#C97539" />
            </div>
            <div className="text-left">
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1F1B14' }}>Analyser un menu</div>
              <div style={{ fontSize: 11, color: '#8A8270' }}>IA — trouver le plat healthy</div>
            </div>
          </button>
        </div>
      )}

      {/* FAB — right side, above navbar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed z-50 w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all duration-200"
        style={{
          bottom: fabBottom,
          right: 20,
          background: open ? '#F1ECE2' : '#1F1B14',
          boxShadow: open
            ? '0 4px 16px rgba(31,27,20,0.15)'
            : '0 6px 20px rgba(31,27,20,0.35)',
        }}
      >
        {open
          ? <X size={22} color="#1F1B14" strokeWidth={2.5} />
          : <Plus size={24} color="#F1ECE2" strokeWidth={2.5} />
        }
      </button>

      {/* NavBar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}
      >
        <div
          className="rounded-full px-2 py-2 flex items-center gap-1 shadow-nav"
          style={{ background: '#3D4A2F' }}
        >
          {TABS.map(({ to, Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              {({ isActive }) => (
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200"
                  style={isActive ? { background: '#F1ECE2' } : undefined}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? '#3D4A2F' : 'rgba(241,236,226,0.65)' }}
                  />
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
