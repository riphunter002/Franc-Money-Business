import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { BusinessProvider } from './hooks/useBusiness.jsx';
import { ThemeProvider } from './hooks/useTheme.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BusinessProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BusinessProvider>
    </AuthProvider>
  </StrictMode>,
);
