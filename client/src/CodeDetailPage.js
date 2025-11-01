import React, { useState, useEffect, useCallback } from 'react';
// --- *** Import Link *** ---
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import './CodeDetailPage.css';

const Spinner = () => <div className="spinner spinner-large"></div>;

// --- *** NEW Info Icon *** ---
const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: '1.5rem', height: '1.5rem', flexShrink: 0, marginRight: '1rem'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);

function CodeDetailPage() {
  const { listingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isPurchased, setIsPurchased] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const fetchListing = useCallback(async () => {
    // ... (fetchListing function is unchanged)
    if (!listingId) return;
    setIsLoading(true);
    try {
      const { data: listingData, error: listingError } = await supabase
        .from('code_listings')
        .select('*')
        .eq('id', listingId)
        .single();
      if (listingError) throw listingError;
      setListing(listingData);
      if (user) {
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .select('id')
          .eq('buyer_id', user.id)
          .eq('listing_id', listingId)
          .maybeSingle();
        if (purchaseError) throw purchaseError;
        if (purchaseData) {
          setIsPurchased(true);
        }
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [listingId, user]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handlePurchase = async () => {
    // ... (handlePurchase function is unchanged)
    if (!user) {
      navigate('/login', { state: { from: `/marketplace/${listingId}` } });
      return;
    }
    if (listing.seller_id === user.id) {
        setMessage("You cannot buy your own item.");
        return;
    }
    setIsPurchasing(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('purchases')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
        });
      if (error) throw error;
      setMessage('Purchase successful! Find it in your "My Library" page.');
      setIsPurchased(true);
    } catch (err) {
      console.error("Purchase error:", err);
      setMessage(`Purchase failed: ${err.message}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return <div className="loading-container"><Spinner /></div>;
  }

  if (!listing) {
    return <div className="page-container"><h2 className="error-message">{message || "Listing not found."}</h2></div>;
  }

  return (
    <div className="page-container detail-page-container">
      <div className="detail-card">
        <div className="detail-header">
          <h1 className="detail-title">{listing.title}</h1>
          <p className="detail-seller">
            Sold by: <span>{listing.seller_email || 'Anonymous Seller'}</span>
          </p>
        </div>

        <div className="detail-body">
          <div className="detail-description">
            <h3>Description</h3>
            <p>{listing.description}</p>
          </div>
          
          {listing.py_requirements?.length > 0 && (
            <div className="detail-requirements">
              <h3>Requirements</h3>
              <p>This script automatically installs the following Python modules:</p>
              <ul>
                {listing.py_requirements.map(req => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* --- *** NEW DOWNLOAD PROMPT *** --- */}
        <div className="download-prompt">
          <InfoIcon />
          <div>
            <p className="prompt-title">Requires the CodeVault Desktop App</p>
            <p className="prompt-text">
              To securely run this code and manage dependencies, you must use the official desktop app.
            </p>
          </div>
          <Link to="/downloads" className="btn btn-secondary btn-small">
            Get the App
          </Link>
        </div>
        {/* --- *** END NEW PROMPT *** --- */}

        <div className="detail-footer">
          <span className="detail-price">${parseFloat(listing.price).toFixed(2)}</span>
          <button 
            className={`btn ${isPurchased ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handlePurchase}
            disabled={isPurchased || isPurchasing || listing.seller_id === user?.id}
          >
            {isPurchasing ? <Spinner size="spinner-small" /> : (isPurchased ? 'Already Owned' : 'Buy Now')}
          </button>
        </div>
        
        {message && (
          <p className={`message ${message.startsWith('Error') || message.startsWith('Purchase failed') ? 'error-message' : 'success-message'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default CodeDetailPage;