// client/src/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // We will create this CSS file

// Simple icon components (replace with a real icon library if you add one)
const IconGithub = () => <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.5.499.09.682-.217.682-.482 0-.237-.009-.865-.013-1.698-2.782.602-3.369-1.34-3.369-1.34-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.527 2.341 1.086 2.91.83.091-.645.35-1.086.636-1.336-2.22-.25-4.557-1.11-4.557-4.94 0-1.09.39-1.984 1.029-2.682-.103-.253-.446-1.27.098-2.645 0 0 .84-.27 2.75 1.026.798-.22 1.649-.33 2.5-.334.851.004 1.702.114 2.5.334 1.909-1.296 2.748-1.026 2.748-1.026.546 1.375.201 2.392.1 2.645.64.698 1.028 1.59 1.028 2.682 0 3.84-2.339 4.687-4.566 4.935.359.307.678.915.678 1.846 0 1.334-.012 2.41-.012 2.73 0 .268.18.577.688.48C19.137 20.19 22 16.44 22 12.017 22 6.484 17.522 2 12 2Z" clipRule="evenodd"></path></svg>;
const IconTwitter = () => <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>;

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content page-container">
        <div className="footer-section footer-brand">
          <h3 className="footer-logo">CodeVault</h3>
          <p className="footer-tagline">Securely Share & Monetize Your Code.</p>
          <div className="footer-socials">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="social-link">
              <IconTwitter />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="social-link">
              <IconGithub />
            </a>
          </div>
        </div>

        <div className="footer-section footer-links">
          <h4>Product</h4>
          <Link to="/marketplace" className="footer-link">Marketplace</Link>
          <Link to="/upload" className="footer-link">Upload</Link>
          <Link to="/modify" className="footer-link">AI Modify</Link>
        </div>

        <div className="footer-section footer-links">
          <h4>Company</h4>
          <Link to="/about" className="footer-link">About Us</Link>
          <Link to="/contact" className="footer-link">Contact</Link>
          {/* <Link to="/careers" className="footer-link">Careers</Link> */}
        </div>

        <div className="footer-section footer-links">
          <h4>Legal</h4>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms" className="footer-link">Terms of Service</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} CodeVault. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
