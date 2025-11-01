import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // --- *** RE-USE LOGIN.CSS for form styles *** ---
import './Signup.css'; // --- *** We will create this file next *** ---

const Spinner = () => <div className="spinner"></div>;

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
    // --- *** NEW LAYOUT (uses 'signup-container') *** ---
    <div className="signup-container">
      
      {/* --- *** NEW: Video Background *** --- */}
      <video 
        className="signup-video-bg" 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/bg-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="signup-overlay"></div>
      {/* --- *** END NEW *** --- */}

      <form onSubmit={handleSignup} className="login-form"> {/* Re-use login-form style */}
        <h2 className="brand-title">CodeVault</h2>
        <p className="form-subtitle">Create your secure account.</p>
        
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
        
        <button type="submit" disabled={isLoading || isSuccess} className="btn btn-primary">
          {isLoading ? <Spinner /> : 'Create Account'}
        </button>

        {message && (
          <p className={`message ${isSuccess ? 'success-message' : 'error-message'}`}>
            {message}
          </p>
        )}

        <p className="form-toggle-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
    // --- *** END NEW LAYOUT *** ---
  );
}

export default SignupPage;