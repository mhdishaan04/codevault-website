import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './HomePage.css'; // Import the specific styles

// (All icon components remain the same)
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>;
const AISparkleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L25.75 5.25l-.813 2.846a4.5 4.5 0 00-3.09 3.09L18.25 12zM18.25 12l-2.846.813a4.5 4.5 0 00-3.09 3.09L11.25 18.75l.813-2.846a4.5 4.5 0 003.09-3.09L18.25 12z" /></svg>;
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0l.879-.659M12 6a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25m0-3.75a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25M12 6v-1.5a2.25 2.25 0 00-2.25-2.25H9.75M12 6V4.5a2.25 2.25 0 012.25-2.25h.75m-3 15M9 18v-1.5a2.25 2.25 0 012.25-2.25h.75M15 18v-1.5a2.25 2.25 0 00-2.25-2.25h-.75" /></svg>;
const DesktopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
  </svg>
);

const steps = [
  { id: 1, title: '1. Seller Uploads & Encrypts', description: "Developer uploads code. It's instantly encrypted with a unique key (AES-GCM 256-bit) and stored. Plaintext is never saved." },
  { id: 2, title: '2. Buyer Purchases License', description: "A buyer purchases access, granting their account permission to use the code's functionality, not the source." },
  { id: 3, title: '3. AI-Powered Modification', description: "The AI securely modifies the code on the backend, creating a new, separately encrypted version for the buyer." },
  { id: 4, title: '4. Secure Local Execution', description: "The buyer's `codevault-loader` tool fetches the encrypted code and the key separately, decrypting it only in local memory." },
];

function HomePage() {
  const navigate = useNavigate();

  // 2. Intersection Observer for fade-ins
  useEffect(() => {
    const mainObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          mainObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const elementsToAnimate = document.querySelectorAll('.fade-in-section, .feature-card');
    elementsToAnimate.forEach(el => mainObserver.observe(el));

    return () => mainObserver.disconnect();
  }, []);


  return (
    <div className="homepage-content">
      {/* --- *** FIX: Video Background (Video 3) *** --- */}
      <video
        className="homepage-background-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/Matrix_Video_For_Website_Background.mp4" type="video/mp4" />
      </video>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content fade-in-section is-visible">
          <h1 className="hero-title">
            Securely Share & Monetize Your <span className="highlight">Code</span>.
          </h1>
          <p className="hero-subtitle">
            CodeVault offers a unique marketplace where developers sell code assets securely,
            and buyers can purchase, utilize, and even request AI-powered modifications without direct source code exposure.
          </p>
          <button onClick={() => navigate('/marketplace')} className="btn btn-primary hero-cta">
            Explore Marketplace
          </button>
        </div>
        <div className="hero-graphic fade-in-section is-visible">
            {/* --- *** FIX: Hero graphic replaced with Video 1 *** --- */}
            <video
              autoPlay
              loop
              muted
              playsInline
            >
              
              
            </video>
        </div>
      </section>

      {/* Features Section */}
      <section className="feature-section page-container fade-in-section">
        <h2 className="section-title">Why <span className="highlight">CodeVault</span>?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon"><LockIcon /></div>
            <h3 className="feature-title">Enhanced Security</h3>
            <p className="feature-description">Source code remains encrypted on the server. Buyers interact via a secure loader or request AI modifications, minimizing piracy risks.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><DollarIcon /></div>
            <h3 className="feature-title">Monetize Your Assets</h3>
            <p className="feature-description">Sell utility scripts, components, algorithms, or snippets easily. Reach buyers while protecting your intellectual property.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><AISparkleIcon /></div>
            <h3 className="feature-title">AI-Powered Customization</h3>
            <p className="feature-description">Buyers can request modifications using natural language, processed by AI, allowing customization without revealing the source.</p>
          </div>
           <div className="feature-card">
            <div className="feature-icon"><CodeIcon /></div>
            <h3 className="feature-title">Developer Focused</h3>
            <p className="feature-description">Built for developers, CodeVault understands the need for secure code distribution and efficient utilization.</p>
          </div>
        </div>
      </section>

      {/* --- Vertical Timeline "How It Works" Section --- */}
      <section className="hiw-timeline-section page-container fade-in-section">
        <div className="hiw-title-container">
          <h2 className="section-title">How It <span className="highlight">Works</span></h2>
          <p className="section-subtitle">
            An end-to-end security flow that protects sellers and empowers buyers.
          </p>
        </div>
        <div className="hiw-timeline-list">
          {steps.map((step, index) => (
            <div key={step.id} className="hiw-timeline-step">
              <div className="timeline-node">
                <span className="step-number">{step.id}</span>
              </div>
              <div className="timeline-content">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* --- APP DOWNLOAD CTA SECTION --- */}
      <section className="app-cta-section page-container fade-in-section">
        <div className="app-cta-content">
          <h2 className="section-title">Meet the <span className="highlight">CodeVault App</span></h2>
          <p className="section-subtitle" style={{textAlign: 'left', margin: '0 0 1.5rem 0', maxWidth: '100%'}}>
            The official desktop app is the key to the entire CodeVault ecosystem. It's the only way to securely download, decrypt, and execute purchased code.
          </p>
          <ul className="app-cta-features">
            <li>Secure, sandboxed execution</li>
            <li>Automatic dependency installation (Python, etc.)</li>
            <li>One-click access to AI code modification</li>
          </ul>
          <Link to="/downloads" className="btn btn-primary hero-cta">
            Download the App
          </Link>
        </div>
        <div className="app-cta-graphic">
          <DesktopIcon />
        </div>
      </section>

       {/* Security Focus Section */}
      <section className="security-section fade-in-section">
        <div className="page-container text-center max-w-3xl mx-auto" style={{maxWidth: '900px', margin: '0 auto'}}>
             <h2 className="section-title">Security at the <span className="highlight">Core</span></h2>
             <p className="text-secondary mb-6" style={{color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center'}}>
                CodeVault employs multiple layers to protect code assets. While the loader decrypts locally for execution,
                the initial distribution and modification process are designed with security in mind.
             </p>
             <ul style={{listStyle: 'none', paddingLeft: 0, maxWidth: '700px', margin: '0 auto'}}>
                <li style={{marginBottom: '0.75rem', position: 'relative', paddingLeft: '1.5rem'}}><span className="font-semibold text-primary" style={{fontWeight: 500, color: 'var(--text-primary)'}}>AES-GCM Encryption:</span> Industry-standard encryption for code at rest.</li>
                <li style={{marginBottom: '0.75rem', position: 'relative', paddingLeft: '1.5rem'}}><span className="font-semibold text-primary" style={{fontWeight: 500, color: 'var(--text-primary)'}}>Secure Key Management:</span> Decryption keys are managed server-side and only provided to authenticated buyers.</li>
                 <li style={{marginBottom: '0.75rem', position: 'relative', paddingLeft: '1.5rem'}}><span className="font-semibold text-primary" style={{fontWeight: 500, color: 'var(--text-primary)'}}>No Direct Source Access:</span> Buyers interact through the loader or AI, preventing casual browsing or unauthorized distribution.</li>
                 <li style={{marginBottom: '0.75rem', position: 'relative', paddingLeft: '1.5rem'}}><span className="font-semibold text-primary" style={{fontWeight: 500, color: 'var(--text-primary)'}}>Temporary Execution:</span> The loader decrypts and runs code in temporary locations, cleaning up afterward.</li>
             </ul>
        </div>
      </section>

       {/* Final CTA Section */}
       <section className="cta-section page-container text-center fade-in-section">
           <h2 className="section-title" style={{fontSize: '1.8rem', marginBottom: '1.5rem'}}>Ready to Get Started?</h2>
           <div className="cta-buttons">
               <button onClick={() => navigate('/marketplace')} className="btn btn-primary">Browse Marketplace</button>
               <button onClick={() => navigate('/upload')} className="btn btn-secondary">Upload Your Code</button>
           </div>
       </section>

        {/* CSS for initial animation state */}
        <style>{`
            .fade-in-section, .feature-card {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.6s ease-out, transform 0.6s ease-out;
            }
            .is-visible {
                opacity: 1;
                transform: translateY(0);
            }
        `}</style>
    </div>
  );
}

export default HomePage;