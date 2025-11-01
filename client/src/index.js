import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// --- ADD BrowserRouter ---
import { HashRouter } from 'react-router-dom';
// --- Import your global CSS (e.g., index.css or styles.css) ---// Or './styles.css' if you used that
import App from './App';
import { AuthProvider } from './AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* --- WRAP with BrowserRouter --- */}
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
    {/* --- END WRAP --- */}
  </React.StrictMode>
);

// If you have reportWebVitals, keep it
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();