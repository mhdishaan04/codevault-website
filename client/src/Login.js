import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom'; 
import './Login.css'; 

const Spinner = () => <div className="spinner"></div>;

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
    <div className="login-container">
      <video 
        className="login-video-bg" 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/bg-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="login-overlay"></div> 

      <form onSubmit={handleLogin} className="login-form">
        <h2 className="brand-title">CodeVault</h2>
        <p className="form-subtitle">Welcome back. Please log in.</p>
        
        <div className="form-group">
          <label htmlFor="login-email">Email:</label>
          <input
            id="login-email"
            type="email"
            value={email}
            // --- *** THIS IS THE FIX *** ---
            onChange={(e) => setEmail(e.target.value)} 
            // --- *** END OF FIX *** ---
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
        
        <button type="submit" disabled={isLoading} className="btn btn-primary">
          {isLoading ? <Spinner /> : 'Login'}
        </button>

        {message && (
          <p className={`message ${message.startsWith('Login failed') ? 'error-message' : 'success-message'}`}>
            {message}
          </p>
        )}

        <p className="form-toggle-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;