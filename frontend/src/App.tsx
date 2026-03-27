import './App.css';
import { MoviesPage } from './components/MoviesPage';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './auth/AuthContext';

function App() {
  const { mode } = useAuth();
  return mode ? <MoviesPage /> : <LoginPage />;
}

export default App;
