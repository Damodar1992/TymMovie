import { useEffect } from 'react';
import './App.css';
import { MoviesPage } from './components/MoviesPage';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './auth/AuthContext';

function App() {
  const { mode } = useAuth();

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

  return mode ? <MoviesPage /> : <LoginPage />;
}

export default App;
