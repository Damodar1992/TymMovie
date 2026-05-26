import { useEffect } from 'react';
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

  if (!mode) return <LoginPage />;
  if (isMobile) return <MobileApp />;
  return <MoviesPage />;
}

export default App;
