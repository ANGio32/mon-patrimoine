import { NavLink } from 'react-router-dom';
import { Home, Utensils, Dumbbell, User, PlusCircle } from 'lucide-react';

export default function NavBar() {
  const base = 'flex flex-col items-center gap-0.5 text-[10px] transition-colors duration-150';
  const active = 'text-primary';
  const inactive = 'text-muted';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/nutrition" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <Utensils size={22} />
          <span>Nutrition</span>
        </NavLink>
        <NavLink to="/log" className="flex flex-col items-center -mt-6">
          <div className="bg-primary rounded-full p-3 shadow-lg shadow-primary/30">
            <PlusCircle size={28} className="text-white" />
          </div>
        </NavLink>
        <NavLink to="/fitness" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <Dumbbell size={22} />
          <span>Fitness</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <User size={22} />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
