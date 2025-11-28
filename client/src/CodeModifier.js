import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import './CodeModifier.css'; 

const Spinner = ({ size = '' }) => <div className={`spinner ${size}`}></div>;

function CodeModifier() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(''); // Stores the 'storage_path'
  const [listingId, setListingId] = useState(''); // Stores the 'listing_id'
  const [modificationRequest, setModificationRequest] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Fetch all purchasable/modifiable items
  const fetchPurchases = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id, listing_id,
          code_listings ( id, title, storage_path ),
          code_versions ( id, created_at, storage_path, version_number )
        `)
        .eq('buyer_id', user.id);

      if (error) throw error;
      
      const formattedPurchases = data.map(p => ({
        ...p,
        // Combine original and versions into one list for the dropdown
        allVersions: [
          { 
            storage_path: p.code_listings.storage_path, 
            version_number: 0, // 0 for "Original"
            name: `${p.code_listings.title} (Original)`
          },
          ...p.code_versions.map(v => ({
            ...v,
            name: `${p.code_listings.title} (Version ${v.version_number})`
          }))
        ]
      }));
      
      setPurchases(formattedPurchases);
    } catch (err) {
      setMessage(`Error fetching purchases: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Handle dropdown change
  const handleSelectChange = (e) => {
    const selectedPath = e.target.value;
    if (!selectedPath) {
      setSelectedVersion('');
      setListingId('');
      return;
    }
    // Find the purchase this version belongs to to get the listingId
    const parentPurchase = purchases.find(p => 
      p.allVersions.some(v => v.storage_path === selectedPath)
    );
    
    setSelectedVersion(selectedPath);
    setListingId(parentPurchase ? parentPurchase.listing_id : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVersion || !modificationRequest || !listingId) {
      setMessage('Please select a code file and enter a modification request.');
      return;
    }

    setIsLoading(true);
    setMessage('Sending request to AI... This may take a moment.');

    try {
      // --- *** FIX: Aligned property names with Server expectation *** ---
      const { data, error } = await supabase.functions.invoke('modify-code', {
        body: {
          storagePath: selectedVersion,   // Changed from baseStoragePath
          listingId: listingId,
          requestText: modificationRequest, // Changed from modificationRequest
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setMessage(`Success! Version ${data.newVersionNumber} created. You can now run it from your Library.`);
      setModificationRequest('');
      
      // Refresh list to show new version
      await fetchPurchases(); 

    } catch (err) {
      console.error('Modification error:', err);
      setMessage(`Modification failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container modifier-container">
      <form onSubmit={handleSubmit} className="modifier-form">
        <h2 className="section-title">AI Code <span className="highlight">Modifier</span></h2>
        <p className="section-subtitle">
          Select a purchased code and describe the changes you want. The AI will
          create a new, secure version for you *without* exposing the source code.
        </p>

        <div className="form-group">
          <label htmlFor="code-select">Select Code to Modify:</label>
          <select 
            id="code-select" 
            className="form-input" 
            value={selectedVersion}
            onChange={handleSelectChange}
            disabled={isLoading}
          >
            <option value="">-- Select a purchased item --</option>
            {purchases.map(purchase => (
              <optgroup label={purchase.code_listings.title} key={purchase.id}>
                {purchase.allVersions.map(version => (
                  <option 
                    key={version.storage_path} 
                    value={version.storage_path}
                  >
                    {version.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="modification-request">Modification Request:</label>
          <textarea
            id="modification-request"
            className="form-input"
            rows="6"
            value={modificationRequest}
            onChange={(e) => setModificationRequest(e.target.value)}
            placeholder="e.g., 'Change the output color to red' or 'Add a function to sort the list in reverse'"
            disabled={isLoading}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? <Spinner size="spinner-on-button" /> : 'Generate New Version'}
        </button>

        {message && (
          <p className={`message ${message.startsWith('Error') || message.startsWith('Modification failed') ? 'error-message' : 'success-message'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default CodeModifier;