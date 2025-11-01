import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
// --- *** FIX: Removed unused 'useAuth' *** ---
import { Link } from 'react-router-dom';
import './Marketplace.css';

const Spinner = () => <div className="spinner spinner-large"></div>;

// Placeholder Icon
const CodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);

function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- *** FIX: Removed unused 'user' variable *** ---
  // const { user } = useAuth();

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('code_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching listings:', fetchError);
        setError(fetchError.message);
      } else {
        setListings(data);
      }
      setLoading(false);
    };

    const delayDebounceFn = setTimeout(() => {
      fetchListings();
    }, 300); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="page-container marketplace-container">
      <h1 className="marketplace-title">Marketplace</h1>
      <p className="marketplace-subtitle">Browse and purchase secure code assets.</p>

      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search for code..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <div className="loading-container"><Spinner /></div>}
      
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <div className="marketplace-grid">
          {listings.length === 0 ? (
            <p className="no-results-message">No listings found{searchTerm && ` for "${searchTerm}"`}.</p>
          ) : (
            listings.map((listing) => (
              <Link to={`/marketplace/${listing.id}`} key={listing.id} className="marketplace-item-link">
                <div className="marketplace-item">
                  <div className="item-icon">
                    <CodeIcon />
                  </div>
                  <div className="item-content">
                    <h3 className="item-title">{listing.title}</h3>
                    <p className="item-description">{listing.description}</p>
                  </div>
                  <div className="item-footer">
                    <span className="item-price">${parseFloat(listing.price).toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default MarketplacePage;