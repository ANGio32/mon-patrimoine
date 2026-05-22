import { NavLink } from 'react-router-dom';
import { Home, Utensils, Dumbbell, TrendingUp, Plus } from 'lucide-react';

export default function NavBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
      style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="bg-[#1C1C1E] rounded-full px-2 py-2 flex items-center gap-1 shadow-nav">
        {[
          { to: '/', Icon: Home, end: true },
          { to: '/nutrition', Icon: Utensils, end: false },
        ].map(({ to, Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            {({ isActive }) => (
              <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 ${isActive ? 'bg-white' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className={isActive ? 'text-[#1C1C1E]' : 'text-white/70'} />
              </div>
            )}
          </NavLink>
        ))}

        <NavLink to="/log">
          {({ isActive }) => (
            <div className={`w-12 h-12 flex items-center justify-center rounded-full mx-1 transition-all active:scale-90 ${isActive ? 'bg-purple-light' : 'bg-white'}`}>
              <Plus size={22} strokeWidth={2.5} className="text-[#1C1C1E]" />
            </div>
          )}
        </NavLink>

        {[
          { to: '/fitness', Icon: Dumbbell, end: false },
          { to: '/progress', Icon: TrendingUp, end: false },
        ].map(({ to, Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            {({ isActive }) => (
              <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 ${isActive ? 'bg-white' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className={isActive ? 'text-[#1C1C1E]' : 'text-white/70'} />
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
