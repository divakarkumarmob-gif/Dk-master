import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handler for debugging on native devices
window.addEventListener('error', (event) => {
  const errorMsg = document.createElement('div');
  errorMsg.style.position = 'fixed';
  errorMsg.style.top = '0';
  errorMsg.style.left = '0';
  errorMsg.style.width = '100%';
  errorMsg.style.background = 'red';
  errorMsg.style.color = 'white';
  errorMsg.style.padding = '20px';
  errorMsg.style.zIndex = '999999';
  errorMsg.style.fontSize = '12px';
  errorMsg.style.wordBreak = 'break-all';
  errorMsg.innerHTML = `<strong>JS Error:</strong> ${event.message}<br/>at ${event.filename}:${event.lineno}:${event.colno}`;
  document.body.appendChild(errorMsg);

  // Auto-remove after 5 seconds to prevent permanent lock
  setTimeout(() => {
    if (document.body.contains(errorMsg)) {
      document.body.removeChild(errorMsg);
    }
  }, 5000);
});

window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason || '');
  // Ignore benign Vite HMR or Firebase WebSocket errors so they don't break the UI
  if (reasonStr.includes('WebSocket') || reasonStr.includes('websocket')) {
    return;
  }

  const errorMsg = document.createElement('div');
  errorMsg.style.position = 'fixed';
  errorMsg.style.top = '0';
  errorMsg.style.left = '0';
  errorMsg.style.width = '100%';
  errorMsg.style.background = 'blue';
  errorMsg.style.color = 'white';
  errorMsg.style.padding = '20px';
  errorMsg.style.zIndex = '999999';
  errorMsg.style.fontSize = '12px';
  errorMsg.style.wordBreak = 'break-all';
  errorMsg.innerHTML = `<strong>Promise Error:</strong> ${event.reason}`;
  document.body.appendChild(errorMsg);
  
  // Auto-remove after 5 seconds to prevent permanent lock
  setTimeout(() => {
    if (document.body.contains(errorMsg)) {
      document.body.removeChild(errorMsg);
    }
  }, 5000);
});

// Register Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  alert('Critical: Root element not found!');
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
