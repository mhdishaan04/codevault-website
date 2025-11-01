import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Ensure this path is correct
import { useAuth } from './AuthContext';    // Ensure this path is correct
import { Link } from 'react-router-dom';    // --- ADD THIS IMPORT ---
import './Marketplace.css';

// Spinner component
const Spinner = ({ size = '', color = '' }) => (
    <div className={`spinner ${size} ${color}`}></div>
);

// Placeholder Icon
const CodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);


function MarketplacePage() { // Renamed component
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // --- ADDED SEARCH ---
  const { user } = useAuth();

  useEffect(() => {
    const fetchListings = async () => {
      if (!supabase) { setError("Service unavailable."); setLoading(false); return; }
      setLoading(true); 
      setError(null);
      
      try {
        let query = supabase
          .from('code_listings')
          .select('*')
          .order('created_at', { ascending: false });

        // --- ADDED SEARCH LOGIC ---
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        // --- END SEARCH LOGIC ---

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setListings(data || []);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // --- ADDED DEBOUNCE ---
    const delayDebounceFn = setTimeout(() => {
      fetchListings();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(delayDebounceFn);
    // --- END DEBOUNCE ---

  }, [searchTerm]); // Re-run on searchTerm change

  if (loading) {
    return <div className="loading-container"><Spinner size="spinner-large"/></div>;
  }

  return (
    <div className="page-container marketplace-container"> {/* --- USE NEW CSS CLASS --- */}
      
      {/* --- USE NEW TITLE/SUBTITLE --- */}
      <h1 className="marketplace-title">Marketplace</h1>
      <p className="marketplace-subtitle">Browse and purchase secure code assets.</p>

      {/* --- ADDED SEARCH BAR --- */}
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search for code..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <p className="error-message" style={{marginBottom: '1.5rem'}}>{error}</p>}

      {!loading && !error && (
        // --- USE NEW GRID CLASS ---
        <div className="marketplace-grid">
          {listings.length === 0 ? (
            <p className="no-results-message">No listings found{searchTerm && ` for "${searchTerm}"`}.</p>
          ) : (
            listings.map((listing) => (
              
              // --- *** THIS IS THE MAIN FIX *** ---
              // Wrap the entire item in a Link to the detail page
              <Link to={`/marketplace/${listing.id}`} key={listing.id} className="marketplace-item-link">
                <div className="marketplace-item">
                  <div className="item-icon">
                    <CodeIcon />
                  </div>
                  <div className="item-content">
                    <h3 className="item-title">{listing.title}</h3>
                    <p className="item-description">
                      {listing.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="item-footer">
                    <span className="item-price">${parseFloat(listing.price || 0).toFixed(2)}</span>
                  </div>
                </div>
              </Link>
              // --- *** END OF FIX *** ---

            ))
          )}
        </div>
      )}
    </div>
  );
}

export default MarketplacePage;