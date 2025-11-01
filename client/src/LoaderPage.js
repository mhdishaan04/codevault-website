import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import './LoaderPage.css';

// --- Components ---
const Spinner = ({ size = '', color = '' }) => (
  <div className={`spinner ${size} ${color}`}></div>
);

// --- Arduino Config Modal ---
const ArduinoModal = ({ onCancel, onConfirm }) => {
  const [board, setBoard] = useState('arduino:avr:uno'); 
  const [port, setPort] = useState(''); 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (board && port) {
      onConfirm(board, port);
    }
  };

  return (
    <div className="modal-backdrop">
      <form onSubmit={handleSubmit} className="modal-content">
        <h3 className="modal-title">Arduino Configuration</h3>
        <p className="modal-instructions">
          Please specify your board and port to upload.
        </p>
        
        <div className="form-group">
          <label htmlFor="board-fqbn">Board FQBN:</label>
          <input
            id="board-fqbn"
            type="text"
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            placeholder="e.g., arduino:avr:uno"
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="port">Port:</label>
          <input
            id="port"
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="e.g., COM3 or /dev/ttyUSB0"
            required
            className="form-input"
          />
        </div>

        <div className="modal-button-group">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Confirm & Upload
          </button>
        </div>
      </form>
    </div>
  );
};


function LoaderPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [runningJob, setRunningJob] = useState(null); 
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const consoleEndRef = useRef(null);

  const [isArduinoModalOpen, setIsArduinoModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null); 

  // --- Log and Console Logic (Unchanged) ---
  const clearLogs = () => setLogs([]);
  const addLog = useCallback((message) => {
    if (!window.electronApi) {
        setLogs(prev => [...prev, "--- ERROR ---", "This 'Run' feature only works inside the CodeVault desktop app."]);
        return;
    }
    setLogs((prevLogs) => [...prevLogs, message]);
  }, []);

  useEffect(() => {
    if (window.electronApi) {
        window.electronApi.onLog(addLog);
    }
    return () => {
      if (window.electronApi) {
        window.electronApi.removeLogListeners();
      }
    };
  }, [addLog]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- Data Fetching Logic (MODIFIED) ---
  const fetchPurchases = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      // --- *** ADDED 'py_requirements' TO THE SELECT *** ---
      const { data, error: fetchError } = await supabase
        .from('purchases')
        .select(`
          id, created_at, listing_id,
          code_listings ( id, title, storage_path, py_requirements ), 
          code_versions ( id, created_at, storage_path, version_number, modification_request )
        `)
        // --- *** END OF CHANGE *** ---
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .order('created_at', { foreignTable: 'code_versions', ascending: true });
        
      if (fetchError) throw fetchError;
      setPurchases(data || []);
    } catch (err) {
      setError(`Failed to load purchases: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // --- Code Execution Logic ---
  
  const runElectronJob = async (purchase, version, board = null, port = null) => {
    const jobKey = `${purchase.id}-${version.version_number}`;
    setRunningJob(jobKey);
    setIsRunning(true);
    clearLogs();
    setError(null);

    addLog('Authenticating session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      setError("Error: Could not get user session. Please restart the app.");
      addLog("Error: Could not get user session. Please restart the app.");
      setIsRunning(false);
      setRunningJob(null);
      return;
    }
    addLog('Session token acquired.');

    // --- *** NEW: Get requirements list *** ---
    // Note: py_requirements are only on the *original listing*, not on versions
    const requirements = purchase.code_listings?.py_requirements || [];
    // --- *** END NEW CODE *** ---

    try {
      await window.electronApi.runCode({
        token: session.access_token,
        storagePath: version.storage_path,
        purchaseId: purchase.id,
        version: version.version_number,
        board: board, 
        port: port,
        pyRequirements: requirements // <-- Pass the new list
      });
    } catch (err) {
      setError(`Execution failed: ${err.message}`);
      addLog(`--- ERROR: ${err.message} ---`);
    } finally {
      setIsRunning(false);
      setRunningJob(null);
      setCurrentJob(null);
      setIsArduinoModalOpen(false);
    }
  };

  const handleRunClick = (purchase, version) => {
    if (!window.electronApi) {
      clearLogs();
      addLog("This feature is only available in the CodeVault desktop app.");
      setError("This feature is only available in the CodeVault desktop app.");
      return;
    }
    
    const isArduino = version.storage_path.includes('.ino') || version.storage_path.includes('.cpp');

    if (isArduino) {
      setCurrentJob({ purchase, version });
      setIsArduinoModalOpen(true);
    } else {
      runElectronJob(purchase, version);
    }
  };

  const handleArduinoConfirm = (board, port) => {
    if (currentJob) {
      runElectronJob(currentJob.purchase, currentJob.version, board, port);
    }
  };

  return (
    <>
      {isArduinoModalOpen && (
        <ArduinoModal
          onCancel={() => setIsArduinoModalOpen(false)}
          onConfirm={handleArduinoConfirm}
        />
      )}

      <div className="loader-ui-container">
        {/* --- Left Panel: Library --- */}
        <div className="library-panel">
          <div className="library-header">
            <h2>My Library</h2>
            <button onClick={fetchPurchases} disabled={loading} className="btn-refresh">
              {loading ? <Spinner size="spinner-small" /> : 'Refresh'}
            </button>
          </div>
          <div className="library-list">
            {loading && purchases.length === 0 && <p style={{padding: '1rem', color: 'var(--text-secondary)'}}>Loading...</p>}
            {error && <p className="error-message" style={{margin: '1rem'}}>{error}</p>}
            {!loading && purchases.length === 0 && !error && (
              <div className="loader-empty-state">
                <p>You haven't purchased any code yet.</p>
                <Link to="/marketplace" className="btn btn-primary">Explore Marketplace</Link>
              </div>
            )}
            {purchases.map((purchase) => {
              if (!purchase.code_listings) return null;
              
              const originalVersion = {
                version_number: 0,
                storage_path: purchase.code_listings.storage_path,
                modification_request: 'Original Code'
              };
              const allVersions = [originalVersion, ...purchase.code_versions];

              return (
                <div key={purchase.id} className="purchase-card">
                  <h3 className="purchase-title">{purchase.code_listings.title}</h3>
                  <div className="version-list-app">
                    {allVersions.map((v) => {
                      if (!v.storage_path) return null;
                      const jobKey = `${purchase.id}-${v.version_number}`;
                      const isThisRunning = runningJob === jobKey;
                      const isArduino = v.storage_path.includes('.ino') || v.storage_path.includes('.cpp');

                      return (
                        <div key={jobKey} className="version-row">
                          <div className="version-row-info">
                            <strong>{v.version_number === 0 ? 'Original' : `Version ${v.version_number}`}</strong>
                            <span>{v.modification_request?.substring(0, 60)}{v.modification_request?.length > 60 ? '...' : ''}</span>
                          </div>
                          <button
                            onClick={() => handleRunClick(purchase, v)}
                            disabled={isRunning}
                            className={`btn btn-small ${isArduino ? 'btn-secondary' : 'btn-primary'}`}
                          >
                            {isThisRunning ? <Spinner size="spinner-small spinner-on-button" /> : (isArduino ? 'Upload' : 'Run')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- Right Panel: Console (Unchanged) --- */}
        <div className="console-panel">
          <div className="console-header">
            <h3>Console Output</h3>
            <button onClick={clearLogs} disabled={logs.length === 0} className="btn-clear">Clear</button>
          </div>
          <div className="console-output">
            {logs.length === 0 && <span className="console-placeholder">Click 'Run' on an item to see its output...</span>}
            {logs.map((log, index) => (
              <div key={index} className={`log-line ${log.includes('ERROR') || log.includes('FAILED') ? 'log-error' : ''} ${log.includes('STDOUT') ? 'log-stdout' : ''}`}>
                {log}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </>
  );
}

export default LoaderPage;