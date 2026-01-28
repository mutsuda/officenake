
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("🚀 [Synergy] Entry point triggered. Mounting application...");

const container = document.getElementById('root');
if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ [Synergy] Application mounted successfully.");
  } catch (err) {
    console.error("❌ [Synergy] Failed to mount React app:", err);
  }
} else {
  console.error("❌ [Synergy] Critical Error: Root element '#root' not found.");
}
