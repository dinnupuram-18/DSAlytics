import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/PageTransition';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import Settings from './pages/Settings';

const ADMIN_COLLEGE_ID = '24J41A05HK';

function isAdminUser(): boolean {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.collegeId === ADMIN_COLLEGE_ID;
  } catch {
    return false;
  }
}

function AdminRoute() {
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;
  if (!isAdminUser()) return <Navigate to="/" replace />;
  return <PageTransition><Admin /></PageTransition>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const authenticated = !!localStorage.getItem('token');

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

        {/* Protected Routes */}
        <Route path="/" element={authenticated ? <PageTransition><Dashboard /></PageTransition> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={authenticated ? <PageTransition><Leaderboard /></PageTransition> : <Navigate to="/login" />} />
        <Route path="/analytics" element={authenticated ? <PageTransition><Analytics /></PageTransition> : <Navigate to="/login" />} />
        <Route path="/settings" element={authenticated ? <PageTransition><Settings /></PageTransition> : <Navigate to="/login" />} />

        {/* Admin — only allows collegeId 24J41A05HK */}
        <Route path="/admin/*" element={<AdminRoute />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
