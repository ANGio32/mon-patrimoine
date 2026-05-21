import { NavLink } from 'react-router-dom';
import { Home, Utensils, Dumbbell, User } from 'lucide-react';

export default function NavBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 border-t border-border safe-bottom"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center max-w-lg mx-auto px-4 pt-2 pb-1 relative">
        <NavLink to="/" end className={({ isActive }) =>
          `flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors ${isActive ? 'text-green' : 'text-muted'}`
        }>
          {({ isActive }) => <>
            <Home size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-[10px] font-medium ${isActive ? 'text-green' : 'text-muted'}`}>Home</span>
          </>}
        </NavLink>

        <NavLink to="/nutrition" className={({ isActive }) =>
          `flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors ${isActive ? 'text-green' : 'text-muted'}`
        }>
          {({ isActive }) => <>
            <Utensils size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-[10px] font-medium ${isActive ? 'text-green' : 'text-muted'}`}>Nutrition</span>
          </>}
        </NavLink>

        <div className="flex-1 flex justify-center -mt-5">
          <NavLink to="/log">
            <div className="w-13 h-13 rounded-full bg-green flex items-center justify-center shadow-green active:scale-95 transition-all" style={{ width: 52, height: 52 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3v14M3 10h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </NavLink>
        </div>

        <NavLink to="/fitness" className={({ isActive }) =>
          `flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors ${isActive ? 'text-green' : 'text-muted'}`
        }>
          {({ isActive }) => <>
            <Dumbbell size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-[10px] font-medium ${isActive ? 'text-green' : 'text-muted'}`}>Fitness</span>
          </>}
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) =>
          `flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors ${isActive ? 'text-green' : 'text-muted'}`
        }>
          {({ isActive }) => <>
            <User size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-[10px] font-medium ${isActive ? 'text-green' : 'text-muted'}`}>Profile</span>
          </>}
        </NavLink>
      </div>
    </nav>
  );
}
