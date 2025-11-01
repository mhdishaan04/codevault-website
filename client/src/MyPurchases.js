import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom'; // <-- Import Link
import './MyPurchases.css'; // <-- **** IMPORT THE CSS FILE ****

// Assuming Spinner is defined globally in index.css
const Spinner = ({ size = '', color = '' }) => (
    <div className={`spinner ${size} ${color}`}></div>
);

function PurchasesPage() { // Renamed component
  const { user } = useAuth();
  const [purchasesWithVersions, setPurchasesWithVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingCommand, setLoadingCommand] = useState({});
  const [loaderCommand, setLoaderCommand] = useState({});
  const [isArduinoCode, setIsArduinoCode] = useState({});
  const [copySuccess, setCopySuccess] = useState(''); // State for copy feedback

  useEffect(() => {
    const fetchPurchasesAndVersions = async () => {
      if (!user) { setLoading(false); return; } // Don't load if no user
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('purchases')
          .select(`
            id, created_at, listing_id,
            code_listings ( id, title, storage_path ),
            code_versions ( id, created_at, storage_path, version_number )
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false }) // Show newest purchases first
          .order('created_at', { foreignTable: 'code_versions', ascending: true });
        if (fetchError) throw fetchError;
        setPurchasesWithVersions(data || []);
      } catch (err) {
        console.error('Error fetching purchases and versions:', err);
        setError('Failed to load your purchases and their versions.');
      } finally {
        setLoading(false);
      }
    };
    fetchPurchasesAndVersions();
  }, [user]);

  const handleGetLoadCommand = async (listingId, storagePath, versionIdentifier, versionNumber) => {
    if (!listingId || !storagePath || !supabase) {
      setError('Missing required information or service unavailable.');
      return;
    }
    const commandKey = `${listingId}-${versionIdentifier}`;
    setLoadingCommand(prev => ({ ...prev, [commandKey]: true }));
    setError(null);
    setLoaderCommand(prev => ({ ...prev, [commandKey]: null }));
    setIsArduinoCode(prev => ({ ...prev, [commandKey]: false }));
    setCopySuccess(''); // Clear copy feedback

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('get-download-link', {
        body: { listingId: listingId, specificStoragePath: storagePath }
      });

      if (functionError) throw new Error(functionError.message || 'Function invocation failed');
      if (functionData && functionData.error) throw new Error(functionData.error);
      if (!functionData?.encryptedStoragePath || !functionData.hasOwnProperty('purchaseId')) {
        throw new Error('Did not receive valid metadata from the server.');
      }

      // Use 'node index.js' and '--vernum'
      const baseCommand = `node index.js use --path "${functionData.encryptedStoragePath}" --purchaseId ${functionData.purchaseId} --vernum ${functionData.versionNumber ?? 0}`;
      setLoaderCommand(prev => ({ ...prev, [commandKey]: baseCommand }));

      if (storagePath.includes('.ino') || storagePath.includes('.cpp')) {
        setIsArduinoCode(prev => ({ ...prev, [commandKey]: true }));
      }
    } catch (err) {
      console.error('Error getting load command:', err);
      setError(`Failed to get load command: ${err.message}`);
      setLoaderCommand(prev => ({ ...prev, [commandKey]: null }));
    } finally {
      setLoadingCommand(prev => ({ ...prev, [commandKey]: false }));
    }
  };

  const copyToClipboard = (text, commandKey) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(commandKey); // Set success for this specific button
      setTimeout(() => setCopySuccess(''), 2000); // Clear after 2s
    }).catch(err => {
      console.error('Failed to copy command: ', err);
      setError('Failed to copy command.');
    });
  };

  // --- Render Logic ---

  if (loading) {
    return <div className="loading-container"><Spinner size="spinner-large"/></div>;
  }
  if (!user) {
    // This case should be handled by ProtectedRoute in App.js
    return null;
  }
  
  if (error) {
    return <div className="page-container"><p className="error-message">{error}</p></div>;
  }

  if (purchasesWithVersions.length === 0) {
    return (
      <div className="page-container text-center">
        <h2 className="page-header">My Purchases</h2>
        <p className="text-secondary">You haven't purchased any code yet.</p>
        <p>Visit the <Link to="/marketplace" className="link">Marketplace</Link>!</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-header">My Purchased Code</h2>
      {/* Global error display */}
      {error && <p className="error-message" style={{marginBottom: '1.5rem'}}>{error}</p>}
      
      <ul className="list-container">
        {purchasesWithVersions.map((purchase) => {
          const originalListing = purchase.code_listings;
          const versions = purchase.code_versions || [];

          return (
            <li key={purchase.id} className="list-item">
              <div className="list-item-header">
                <h3 className="list-item-title">{originalListing?.title || 'Unknown Title'}</h3>
                <p className="list-item-subtitle">Purchased on: {new Date(purchase.created_at).toLocaleDateString()}</p>
              </div>
              <div className="version-list-container">
                <h4 className="version-list-title">Available Versions:</h4>
                <ul className="version-list">
                  {/* Original Version */}
                  {originalListing?.storage_path ? (
                    <li key="original" className="version-item">
                      {(() => {
                        const commandKey = `${purchase.listing_id}-original`;
                        const currentCommand = loaderCommand[commandKey];
                        return (
                          <>
                            <div className="version-item-header">
                              <span className="version-item-name">Original Code</span>
                              <button
                                onClick={() => handleGetLoadCommand(purchase.listing_id, originalListing.storage_path, 'original', 0)}
                                disabled={loadingCommand[commandKey]}
                                className="btn btn-secondary btn-small" // Use secondary button
                              >
                                {loadingCommand[commandKey] ? <Spinner size="spinner-small spinner-on-dark-button"/> : 'Get Load Command'}
                              </button>
                            </div>
                            {currentCommand && (
                              <div style={{marginTop: '0.75rem'}}>
                                <div className="loader-command-container">
                                  <input type="text" readOnly value={currentCommand} onClick={(e) => e.target.select()} className="form-input loader-command-input" />
                                  <button onClick={() => copyToClipboard(currentCommand, commandKey)} className="btn btn-primary btn-small loader-command-copy">
                                    {copySuccess === commandKey ? 'Copied!' : 'Copy'}
                                  </button>
                                </div>
                                {isArduinoCode[commandKey] && (
                                  <p className="arduino-instructions">
                                    <small>
                                      <b>Arduino detected:</b> Append <code>--board</code> and <code>--port</code> args.
                                      <br/>
                                      Example: <code>{`... --vernum 0 --board arduino:avr:uno --port COM3`}</code>
                                    </small>
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </li>
                  ) : (
                    <li className="version-item">
                      <span className="version-item-name text-muted">Original Code (Unavailable)</span>
                    </li>
                  )}

                  {/* Modified Versions */}
                  {versions.map(version => {
                     const commandKey = `${purchase.listing_id}-v${version.version_number}`;
                     const currentCommand = loaderCommand[commandKey];
                     return (
                      <li key={version.id} className="version-item">
                        <div className="version-item-header">
                          <span className="version-item-name">
                            Version {version.version_number}
                            <small className="version-item-date" style={{marginLeft: '0.5rem'}}>
                              ({new Date(version.created_at).toLocaleString()})
                            </small>
                          </span>
                          <button
                            onClick={() => handleGetLoadCommand(purchase.listing_id, version.storage_path, `v${version.version_number}`, version.version_number)}
                            disabled={loadingCommand[commandKey]}
                            className="btn btn-secondary btn-small" // Use secondary button
                          >
                            {loadingCommand[commandKey] ? <Spinner size="spinner-small spinner-on-dark-button"/> : 'Get Load Command'}
                          </button>
                        </div>
                        {currentCommand && (
                            <div style={{marginTop: '0.75rem'}}>
                                <div className="loader-command-container">
                                    <input type="text" readOnly value={currentCommand} onClick={(e) => e.target.select()} className="form-input loader-command-input" />
                                    <button onClick={() => copyToClipboard(currentCommand, commandKey)} className="btn btn-primary btn-small loader-command-copy">
                                        {copySuccess === commandKey ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                {isArduinoCode[commandKey] && (
                                    <p className="arduino-instructions">
                                    <small>
                                        <b>Arduino detected:</b> Append <code>--board</code> and <code>--port</code> args.
                                        <br/>
                                        Example: <code>{`... --vernum ${version.version_number} --board arduino:avr:uno --port COM3`}</code>
                                    </small>
                                    </p>
                                )}
                            </div>
                        )}
                      </li>
                   );
                  })}
                </ul>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  );
}

export default PurchasesPage; // Renamed export