import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';
import { MoviesPage } from './components/MoviesPage';
import { LoginPage } from './components/LoginPage';
import { InvitePage } from './components/InvitePage';
import { MobileApp } from './components/mobile/MobileApp';
import { useAuth } from './auth/AuthContext';
import { useIsMobileLayout } from './hooks/useIsMobileLayout';

function App() {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobileLayout();

  const inviteToken = useMemo(() => {
    const match = window.location.pathname.match(/^\/invite\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  }, []);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    if (!user) {
      root.classList.add('root-login-full');
    } else {
      root.classList.remove('root-login-full');
    }
    return () => root.classList.remove('root-login-full');
  }, [user]);

  if (isLoading) {
    // Avoid flashing the login screen while the initial
    // GET /api/auth/session check is still in flight.
    return null;
  }

  // Public route, works whether the visitor is signed in or not — see
  // InvitePage and db-multi-user-architecture doc §4.
  if (inviteToken) {
    return <InvitePage token={inviteToken} />;
  }

  return (
    <>
      <AnimatePresence>
        {!user ? (
          <motion.div
            key="login"
            className="app-login-layer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <LoginPage />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {user ? (isMobile ? <MobileApp /> : <MoviesPage />) : null}
    </>
  );
}

export default App;
