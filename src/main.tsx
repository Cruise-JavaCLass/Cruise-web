import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';
import App from './App.tsx';

// In banner khởi chạy ứng dụng Frontend trên Console
console.log(
  `%c⚓ CRUISE ACTIVITY & SERVICE MANAGEMENT SYSTEM %c\n` +
  `%cVersion: ${import.meta.env.VITE_APP_VERSION || '1.0.0'}\n` +
  `API Gateway: ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}\n` +
  `Jira Task: KAN-36 | Story: KAN-37\n` +
  `Environment: ${import.meta.env.MODE}`,
  'background: #0284c7; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
  '',
  'color: #38bdf8;'
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
