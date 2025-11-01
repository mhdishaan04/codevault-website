import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import './CodeDetailPage.css'; // This will be the new CSS file

const Spinner = () => <div className="spinner spinner-large"></div>;

// Icon for the left column
const CodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);

// Icon for the download prompt
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
    if (!listingId) return;
    setIsLoading(true);
    try {
      // 1. Fetch the listing details
      const { data: listingData, error: listingError } = await supabase
        .from('code_listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError) throw listingError;
      setListing(listingData);

      // 2. Check if the user has already purchased this
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
      {/* --- NEW 2-COLUMN GRID --- */}
      <div className="detail-grid">
        
        {/* --- LEFT COLUMN (STICKY) --- */}
        <div className="detail-grid-left">
          <div className="detail-graphic">
            <CodeIcon />
          </div>
          <div className="detail-purchase-box">
            <span className="detail-price">${parseFloat(listing.price).toFixed(2)}</span>
            <button 
              className={`btn ${isPurchased ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handlePurchase}
              disabled={isPurchased || isPurchasing || listing.seller_id === user?.id}
            >
              {isPurchasing ? <Spinner size="spinner-small" /> : (isPurchased ? 'Already Owned' : 'Buy Now')}
            </button>
            <div className="download-prompt">
              <InfoIcon />
              <div>
                <p className="prompt-title">Requires the CodeVault App</p>
                <p className="prompt-text">
                  This item must be run with the secure desktop app.
                </p>
                <Link to="/downloads" className="prompt-link">
                  Get the App
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN (CONTENT) --- */}
        <div className="detail-grid-right">
          <div className="detail-header">
            <h1 className="detail-title">{listing.title}</h1>
            <p className="detail-seller">
              Sold by: <span>{listing.seller_email || 'Anonymous Seller'}</span>
            </p>
          </div>

          <div className="detail-content-card">
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
          
          {message && (
            <p className={`message ${message.startsWith('Error') || message.startsWith('Purchase failed') ? 'error-message' : 'success-message'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CodeDetailPage;