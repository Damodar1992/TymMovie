import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';
import { MoviesPage } from './components/MoviesPage';
import { LoginPage } from './components/LoginPage';
import { MobileApp } from './components/mobile/MobileApp';
import { useAuth } from './auth/AuthContext';
import { useIsMobileLayout } from './hooks/useIsMobileLayout';

function App() {
  const { mode } = useAuth();
  const isMobile = useIsMobileLayout();

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    if (!mode) {
      root.classList.add('root-login-full');
    } else {
      root.classList.remove('root-login-full');
    }
    return () => root.classList.remove('root-login-full');
  }, [mode]);

  return (
    <>
      <AnimatePresence>
        {!mode ? (
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

      {mode ? (isMobile ? <MobileApp /> : <MoviesPage />) : null}
    </>
  );
}

export default App;
