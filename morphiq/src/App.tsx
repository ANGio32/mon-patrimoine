import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { useApp } from './context/AppContext';
import NavBar from './components/NavBar';
import WaterReminder from './components/WaterReminder';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import LogMeal from './pages/LogMeal';
import Nutrition from './pages/Nutrition';
import Fitness from './pages/Fitness';
import Profile from './pages/Profile';
import MenuAnalyzer from './pages/MenuAnalyzer';
import SmartGrocery from './pages/SmartGrocery';
import Progress from './pages/Progress';

export default function App() {
  const { state, userId, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader size={28} className="text-text animate-spin" />
          <p className="text-muted text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  if (!state.profile?.onboardingComplete) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <WaterReminder />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<LogMeal />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/fitness" element={<Fitness />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/menu" element={<MenuAnalyzer />} />
        <Route path="/smart-grocery" element={<SmartGrocery />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <NavBar />
    </div>
  );
}
