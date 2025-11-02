import React from 'react';
import './DownloadsPage.css'; 
// --- *** FIX: Removed unused 'Link' import *** ---
// import { Link } from 'react-router-dom'; 

// Simple Windows Icon
const WindowsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1.25em', height: '1.25em', marginRight: '0.5em' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

// Desktop Icon
const DesktopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
    </svg>
);


function DownloadsPage() {
  // Paste your real GitHub release link here
  const downloadLink = "https://github.com/mhdishaan04/codevault-app/releases/download/v1.0.0/CodeVault.Setup.1.0.0.exe";

  return (
    <div className="page-container download-container">
      <div className="download-card">
        <div className="download-icon">
          <DesktopIcon />
        </div>
        <h1 className="download-title">Download CodeVault</h1>
        <p className="download-subtitle">
          The secure way to run, modify, and manage your purchased code.
        </p>

        <ul className="feature-list">
          <li>
            <strong>Secure Execution:</strong> Runs code in a sandboxed environment without exposing the source.
          </li>
          <li>
            <strong>AI Modification:</strong> Request changes to your code using natural language.
          </li>
          <li>
            <strong>Auto-Managed Dependencies:</strong> Automatically installs Python and other requirements for you.
          </li>
        </ul>

        <a 
          href={downloadLink} 
          className="btn btn-primary download-button"
        >
          <WindowsIcon />
          Download for Windows
        </a>
        <p className="download-note">
          Hosted on GitHub Releases.
        </p>
      </div>

      <div className="requirements-card">
        <h3 className="requirements-title">System Requirements</h3>
        <p className="requirements-text">
          To run all code types, the CodeVault app requires some system tools to be installed and added to your system's PATH.
        </p>
        <ul className="requirements-list">
          <li>
            <strong>Python (for `.py` files):</strong>
            <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer">Python 3.x</a>
          </li>
          <li>
            <strong>C/C++ (for `.c`, `.cpp` files):</strong>
            <a href="https://github.com/tdm-gcc/tdm-gcc/releases" target="_blank" rel="noopener noreferrer">TDM-GCC (MinGW)</a>
          </li>
          <li>
            <strong>Java (for `.java` files):</strong>
            <a href="https://www.oracle.com/java/technologies/downloads/" target="_blank" rel="noopener noreferrer">Java Development Kit (JDK)</a>
          </li>
          <li>
            <strong>Arduino (for `.ino` files):</strong>
            <a href="https://arduino.github.io/arduino-cli/latest/installation/" target="_blank" rel="noopener noreferrer">Arduino CLI</a>
          </li>
          <li>
            <strong>FFMPEG (for video scripts):</strong>
            <a href="https://ffmpeg.org/download.html" target="_blank" rel="noopener noreferrer">FFMPEG</a>
          </li>
        </ul>
        <p className="requirements-note">
          After installing, please ensure the tool's `bin` folder is added to your system's `PATH` environment variable and restart the CodeVault app.
        </p>
      </div>

    </div>
  );
}

export default DownloadsPage;