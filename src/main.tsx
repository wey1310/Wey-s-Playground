import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { GameUIProvider } from './contexts/GameUIContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import 'katex/dist/katex.min.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <GameUIProvider>
          <App />
        </GameUIProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
