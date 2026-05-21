import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import NavBar from './components/NavBar';
import WaterReminder from './components/WaterReminder';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import LogMeal from './pages/LogMeal';
import Nutrition from './pages/Nutrition';
import Fitness from './pages/Fitness';
import Profile from './pages/Profile';
import MenuAnalyzer from './pages/MenuAnalyzer';

export default function App() {
  const { state } = useApp();
  const ready = state.profile?.onboardingComplete;

  if (!ready) {
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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <NavBar />
    </div>
  );
}
