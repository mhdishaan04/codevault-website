import React, { useState, useEffect } from 'react';
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
import DownloadsPage from './DownloadsPage';

import './App.css'; 

const Spinner = ({ size = 'w-8 h-8', color = 'border-t-cyan-glow' }) => (
    <div className={`spinner ${size === 'spinner-large' ? 'spinner-large' : ''}`}></div>
);

// --- *** 'CodeVaultLogo' function removed. It was unused. *** ---

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

const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function MainLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
      setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleSignOut = async () => {
        if (signOut) {
            await signOut();
            navigate('/login'); 
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="app-wrapper">
            <nav className="navbar">
              <div className="navbar-content">
                <Link to={user ? "/home" : "/"} className="nav-brand">
                    <span>Codevault</span>
                </Link>
                
                <button 
                  className="nav-hamburger-btn" 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
                </button>

                <div className={`nav-links ${isMobileMenuOpen ? 'nav-links-mobile-open' : ''}`}>
                    <div className="nav-links-left">
                      <Link to="/marketplace" className={`nav-link ${isActive('/marketplace') ? 'nav-link-active' : ''}`}>Marketplace</Link>
                      <Link to="/about" className={`nav-link ${isActive('/about') ? 'nav-link-active' : ''}`}>About</Link>
                      <Link to="/downloads" className={`nav-link ${isActive('/downloads') ? 'nav-link-active' : ''}`}>Downloads</Link>
                    </div>

                    <div className="nav-links-right">
                    {user ? (
                        <>
                            <Link to="/loader" className={`nav-link ${isActive('/loader') ? 'nav-link-active' : ''}`}>My Library</Link>
                            <Link to="/upload" className={`nav-link ${isActive('/upload') ? 'nav-link-active' : ''}`}>Sell Code</Link>
                            <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'nav-link-active' : ''}`}>Profile</Link>
                            <button onClick={handleSignOut} className="nav-link nav-link-button btn-secondary btn-small">
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={`nav-link ${isActive('/login') ? 'nav-link-active' : ''}`}>Login</Link>
                            <Link to="/signup" className="nav-link nav-link-button btn-primary btn-small">
                              Sign Up
                            </Link>
                        </>
                    )}
                    </div>
                </div>
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
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <SignupPage />} />

      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={!user ? <Navigate to="/home" replace /> : <HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/marketplace/:listingId" element={<CodeDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/downloads" element={<DownloadsPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
           <Route path="/upload" element={<UploadPage />} />
           <Route path="/loader" element={<LoaderPage />} />
           <Route path="/modify" element={<ModifyPage />} />
           <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function NotFoundPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    return (
        <div className="page-container text-center" style={{paddingTop: '4rem'}}>
            <h2 style={{color: 'var(--red-accent)', fontSize: '2.5rem', marginBottom: '1rem'}}>404 - Not Found</h2>
            <p className="text-secondary">The page you requested does not exist.</p>
            <button onClick={() => navigate(user ? '/home' : '/login')} className="btn btn-primary" style={{marginTop: '1.5rem'}}>
                Go Home
            </button>
        </div>
    );
}

export default App;