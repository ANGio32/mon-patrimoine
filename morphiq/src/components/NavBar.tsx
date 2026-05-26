import { NavLink } from 'react-router-dom';
import { Home, Utensils, Dumbbell, TrendingUp, User } from 'lucide-react';

const TABS = [
  { to: '/',          Icon: Home,       end: true  },
  { to: '/nutrition', Icon: Utensils,   end: false },
  { to: '/fitness',   Icon: Dumbbell,   end: false },
  { to: '/progress',  Icon: TrendingUp, end: false },
  { to: '/profile',   Icon: User,       end: false },
];

export default function NavBar() {
  return (
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
  );
}
