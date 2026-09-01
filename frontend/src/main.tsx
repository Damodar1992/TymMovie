import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import './pwa-fixes.css';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthContext';
import { MoviesFiltersProvider } from './state/MoviesFiltersContext';
import { ActiveListProvider } from './state/ActiveListContext';

const queryClient = new QueryClient();

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveListProvider>
          <MoviesFiltersProvider>
            <App />
          </MoviesFiltersProvider>
        </ActiveListProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
