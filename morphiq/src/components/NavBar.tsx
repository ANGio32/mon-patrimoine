import { NavLink } from 'react-router-dom';
import { Home, Utensils, Dumbbell, User } from 'lucide-react';

export default function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(12,12,15,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center max-w-lg mx-auto px-4 py-3 relative">
        <NavLink to="/" end className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-muted'}`}>
          <Home size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>
        <NavLink to="/nutrition" className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-muted'}`}>
          <Utensils size={20} />
          <span className="text-[10px] font-medium">Nutrition</span>
        </NavLink>

        {/* Center log button */}
        <div className="flex-1 flex justify-center">
          <NavLink to="/log" className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 transition-all active:scale-95">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </NavLink>
        </div>

        <NavLink to="/fitness" className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-muted'}`}>
          <Dumbbell size={20} />
          <span className="text-[10px] font-medium">Fitness</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-muted'}`}>
          <User size={20} />
          <span className="text-[10px] font-medium">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
