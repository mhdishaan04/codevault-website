import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom'; 
import './Login.css';

// Spinner now uses global styles
const Spinner = () => <div className="spinner spinner-on-button"></div>;

// --- Left-Side Animated Feature Component ---
const AnimatedFeatures = () => {
  const features = [
    { word: "Secure.", description: "Your code is AES-256 encrypted and never exposed." },
    { word: "Monetize.", description: "Sell your algorithms and scripts to a global market." },
    { word: "Modify.", description: "Let buyers customize your code using secure AI." }
  ];
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    // Animation cycle
    const interval = setInterval(() => {
      setFade(false); // Start fade out
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % features.length);
        setFade(true); // Start fade in
      }, 500); // Wait for fade out to complete
    }, 3000); // Change text every 3 seconds

    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="auth-features">
      <h1 className="auth-brand-name">Codevault</h1>
      <div className={`feature-text-animated ${fade ? 'fade-in' : 'fade-out'}`}>
        <h2 className="feature-word">{features[index].word}</h2>
        <p className="feature-description">{features[index].description}</p>
      </div>
    </div>
  );
};

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!signIn) return;
    setMessage(''); 
    setIsLoading(true);
    const { error } = await signIn({ email, password });
    setIsLoading(false);
    if (error) {
      setMessage(`Login failed: ${error.message}`);
    } else {
      navigate('/home'); // Redirect on successful login
    }
  };

  return (
    <div className="auth-page-container">
      {/* --- Matrix Background Video --- */}
      <video
        className="auth-background-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      {/* --- Two-Column Content Wrapper --- */}
      <div className="auth-content-wrapper">
        {/* Left Side: Animated Features */}
        <div className="auth-graphic-side">
          <AnimatedFeatures />
        </div>

        {/* Right Side: Floating Login Form */}
        <div className="auth-form-side">
          <div className="auth-form-box">
            <h2 className="auth-title">Login</h2>
            
            <form onSubmit={handleLogin} className="auth-form">
              {message && (
                <p className={`message ${message.startsWith('Login failed') ? 'error-message' : 'success-message'}`}>
                  {message}
                </p>
              )}
              <div className="form-group">
                <label htmlFor="login-email">Email:</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                  placeholder="you@example.com"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password:</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>
              
              <button type="submit" disabled={isLoading} className="btn btn-primary btn-full-width">
                {isLoading ? <Spinner /> : 'Login'}
              </button>

              <p className="auth-toggle-link">
                Don't have an account? <Link to="/signup" className="link">Sign Up</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;