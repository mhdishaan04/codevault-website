import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // --- *** RE-USE LOGIN.CSS *** ---

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

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setMessage(''); 
    setIsSuccess(false);
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    setIsLoading(false);
    if (error) {
      setMessage(`Signup failed: ${error.message}`);
    } else {
      setMessage('Signup successful! Please check your email to verify your account.');
      setIsSuccess(true);
    }
  };

  if (user) {
    navigate('/home'); // Redirect if already logged in
    return null;
  }

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
        
        {/* Right Side: Floating Signup Form */}
        <div className="auth-form-side">
          <div className="auth-form-box">
            <h2 className="auth-title">Sign Up</h2>
            
            <form onSubmit={handleSignup} className="auth-form">
              {message && (
                <p className={`message ${isSuccess ? 'success-message' : 'error-message'}`}>
                  {message}
                </p>
              )}
              <div className="form-group">
                <label htmlFor="signup-email">Email:</label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password:</label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>
              
              <button type="submit" disabled={isLoading || isSuccess} className="btn btn-primary btn-full-width">
                {isLoading ? <Spinner /> : 'Create Account'}
              </button>

              <p className="auth-toggle-link">
                Already have an account? <Link to="/login" className="link">Log In</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;