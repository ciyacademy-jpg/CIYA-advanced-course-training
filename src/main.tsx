import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against browser IndexedDB closing/hidden errors during tab backgrounding or iframe focus shifts
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || reason?.name || String(reason || '');
    if (msg.includes('Database is closing/hidden') || msg.includes('Database is closing')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || event?.error?.message || '';
    if (msg.includes('Database is closing/hidden') || msg.includes('Database is closing')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
