
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("🚀 Office Snakes point of entry triggered.");

const container = document.getElementById('root');
if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ Office Snakes mounted successfully.");
  } catch (err) {
    console.error("❌ Failed to mount React app:", err);
  }
} else {
  console.error("❌ Root element #root not found in DOM.");
}
