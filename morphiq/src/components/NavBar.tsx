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

  return (
    <>
      {/* Backdrop — closes menu on tap outside */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Action sheet — appears above the + button */}
      {open && (
        <div
          className="fixed z-50 flex flex-col gap-2"
          style={{ bottom: 'calc(max(1.75rem, env(safe-area-inset-bottom)) + 80px)', left: '50%', transform: 'translateX(-50%)', minWidth: 220 }}
        >
          <button
            onClick={() => go('/log')}
            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-card-lg active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#DCE3CE' }}>
              <UtensilsCrossed size={18} color="#5A6B47" />
            </div>
            <div className="text-left">
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1F1B14' }}>Ajouter un repas</div>
              <div style={{ fontSize: 11, color: '#8A8270' }}>Logger calories & macros</div>
            </div>
          </button>

          <button
            onClick={() => go('/menu')}
            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-card-lg active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F4DBC2' }}>
              <ScanLine size={18} color="#C97539" />
            </div>
            <div className="text-left">
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1F1B14' }}>Analyser un menu</div>
              <div style={{ fontSize: 11, color: '#8A8270' }}>IA — trouver le plat healthy</div>
            </div>
          </button>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}
      >
        <div
          className="rounded-full px-2 py-2 flex items-center gap-1 shadow-nav"
          style={{ background: '#3D4A2F' }}
        >
          {/* Home + Nutrition */}
          {TABS.slice(0, 2).map(({ to, Icon, end }) => (
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

          {/* Center + button */}
          <button
            onClick={() => setOpen(o => !o)}
            className="w-12 h-12 flex items-center justify-center rounded-full mx-1 active:scale-90 transition-all"
            style={{ background: open ? '#F1ECE2' : '#fff' }}
          >
            {open
              ? <X size={20} style={{ color: '#3D4A2F' }} strokeWidth={2.5} />
              : <Plus size={22} style={{ color: '#3D4A2F' }} strokeWidth={2.5} />
            }
          </button>

          {/* Fitness + Progress + Profile */}
          {TABS.slice(2).map(({ to, Icon, end }) => (
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
