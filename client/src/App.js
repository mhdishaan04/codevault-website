import React from 'react';
import { Routes, Route, Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Import Page Components
import LoginPage from './Login';
import SignupPage from './Signup';
import MarketplacePage from './Marketplace';
import UploadPage from './SellerUploadForm';
import LoaderPage from './LoaderPage';
import ModifyPage from './CodeModifier';
import HomePage from './HomePage';
import Footer from './Footer';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import TermsPage from './TermsPage';
import PrivacyPage from './PrivacyPage';
import ProfilePage from './ProfilePage';
import CodeDetailPage from './CodeDetailPage';

// --- *** NEWLY IMPORTED PAGE *** ---
import DownloadsPage from './DownloadsPage';
// --- *** END NEW IMPORT *** ---

import './App.css'; 

const Spinner = ({ size = 'w-8 h-8', color = 'border-t-cyan-glow' }) => (
    <div className={`spinner ${size === 'spinner-large' ? 'spinner-large' : ''}`}></div>
);

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-container"><Spinner size="spinner-large"/></div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

function Layout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); 
    const isActive = (path) => location.pathname === path;

    const handleSignOut = async () => {
        if (signOut) {
            await signOut();
            navigate('/login'); 
        }
    };

    return (
        <div className="app-wrapper">
            <nav className="navbar">
                <Link to={user ? "/home" : "/"} className="nav-brand">
                    <span>CodeVault</span>
                </Link>
                <div className="nav-links">
                    {user ? (
                        <>
                            <Link to="/home" className={`nav-link ${isActive('/home') ? 'nav-link-active' : ''}`}>Home</Link>
                            <Link to="/marketplace" className={`nav-link ${isActive('/marketplace') ? 'nav-link-active' : ''}`}>Marketplace</Link>
                            
                            {/* --- *** NEW LINK *** --- */}
                            <Link to="/downloads" className={`nav-link ${isActive('/downloads') ? 'nav-link-active' : ''}`}>Downloads</Link>
                            {/* --- *** END NEW LINK *** --- */}

                            <Link to="/loader" className={`nav-link ${isActive('/loader') ? 'nav-link-active' : ''}`}>My Library</Link>
                            <Link to="/upload" className={`nav-link ${isActive('/upload') ? 'nav-link-active' : ''}`}>Upload</Link>
                            <Link to="/modify" className={`nav-link ${isActive('/modify') ? 'nav-link-active' : ''}`}>Modify</Link>
                            <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'nav-link-active' : ''}`}>Profile</Link>
                            <button onClick={handleSignOut} className="nav-link btn-danger btn-small">
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/about" className={`nav-link ${isActive('/about') ? 'nav-link-active' : ''}`}>About</Link>
                            
                            {/* --- *** NEW LINK *** --- */}
                            <Link to="/downloads" className={`nav-link ${isActive('/downloads') ? 'nav-link-active' : ''}`}>Downloads</Link>
                            {/* --- *** END NEW LINK *** --- */}

                            <Link to="/login" className={`nav-link ${isActive('/login') ? 'nav-link-active' : ''}`}>Login</Link>
                            <Link to="/signup" className={`nav-link ${isActive('/signup') ? 'nav-link-active' : ''}`}>Sign Up</Link>
                        </>
                    )}
                </div>
            </nav>
            
            <main className="main-content">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
      return <div className="loading-container"><Spinner size="spinner-large"/></div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <SignupPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        
        {/* --- *** NEW ROUTE *** --- */}
        <Route path="/downloads" element={<DownloadsPage />} />
        {/* --- *** END NEW ROUTE *** --- */}

        {/* Protected Routes (require login) */}
        <Route element={<ProtectedRoute />}>
           <Route index element={<HomePage />} />
           <Route path="/home" element={<HomePage />} />
           <Route path="/marketplace" element={<MarketplacePage />} />
           <Route path="/upload" element={<UploadPage />} />
           <Route path="/loader" element={<LoaderPage />} />
           <Route path="/modify" element={<ModifyPage />} />
           <Route path="/profile" element={<ProfilePage />} />
           <Route path="/marketplace/:listingId" element={<CodeDetailPage />} />
        </Route>

        <Route index element={!user ? <Navigate to="/login" replace /> : <HomePage />} />
        <Route path="*" element={<NotFoundPage />} />

      </Route>
    </Routes>
  );
}

function NotFoundPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    return (
        <div className="page-container text-center">
            <h2 style={{color: 'var(--red-accent)', fontSize: '2.5rem', marginBottom: '1rem'}}>404 - Not Found</h2>
            <p className="text-secondary">The page you requested does not exist.</p>
            <button onClick={() => navigate(user ? '/home' : '/login')} className="btn btn-primary" style={{marginTop: '1.5rem'}}>
                Go Home
            </button>
        </div>
    );
}

export default App;