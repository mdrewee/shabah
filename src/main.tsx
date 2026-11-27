import './utils/migrateLegacyStorage';
import { ConfirmationProvider } from './components/common/ConfirmationProvider';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css'; // Tailwind base styles

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider><ConfirmationProvider><App /></ConfirmationProvider></AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
