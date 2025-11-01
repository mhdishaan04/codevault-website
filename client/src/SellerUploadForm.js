import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import './SellerUploadForm.css';

const Spinner = () => <div className="spinner"></div>;

function SellerUploadForm() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [pyRequirements, setPyRequirements] = useState([]);
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setDescription('');
    setPyRequirements([]);
    setMessage('');
  };

  const handleGenerateDescription = useCallback(async () => {
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }
    
    if (file.size > 1 * 1024 * 1024) { // 1MB limit for AI scan
        setMessage('File is too large for AI generation (Max 1MB).');
        setDescription('');
        setPyRequirements([]);
        return;
    }

    setIsGenerating(true);
    setMessage('Generating description with AI...');
    
    try {
      const fileText = await file.text();
      
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: { codeContent: fileText },
      });

      if (error) throw error;
      
      if (data.description) {
        setDescription(data.description);
      }
      if (data.requirements) {
        setPyRequirements(data.requirements);
        if (data.requirements.length > 0) {
            setMessage(`AI detected requirements: ${data.requirements.join(', ')}`);
        } else {
            setMessage('AI generated description. No Python requirements detected.');
        }
      }
    } catch (err) {
      console.error('Error generating description:', err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [file]); 

  useEffect(() => {
    if (file) {
      handleGenerateDescription();
    }
  }, [file, handleGenerateDescription]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !description || !price || !user) {
      setMessage('Please fill in title, price, and make sure AI description was generated.');
      return;
    }

    setIsLoading(true);
    setMessage('Encrypting and uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('sellerId', user.id);
      formData.append('pyRequirements', JSON.stringify(pyRequirements));
      
      // --- *** THIS IS THE NEW LINE *** ---
      formData.append('sellerEmail', user.email); // Send the user's email
      // --- *** END OF NEW LINE *** ---

      const { data, error } = await supabase.functions.invoke('upload-and-encrypt-code', {
        body: formData,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setMessage('Upload successful! Your code is now listed.');
      setTitle('');
      setDescription('');
      setPrice('');
      setFile(null);
      setPyRequirements([]);
      document.getElementById('file-input').value = null;

    } catch (err) {
      console.error('Upload error:', err);
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container upload-form-container">
      <form onSubmit={handleSubmit} className="upload-form">
        <h2>List Your Code</h2>
        <p className="form-subtitle">Securely encrypt and sell your code assets.</p>
        
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="form-input"
            placeholder="e.g., Python Video Clipper"
          />
        </div>

        <div className="form-group">
          <label htmlFor="file-input">Code File:</label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (AI Generated):</label>
          <textarea
            id="description"
            value={description}
            readOnly 
            placeholder="Select a file above to auto-generate description..."
            required
            className="form-input"
            rows="4"
          ></textarea>
          <button 
            type="button" 
            onClick={handleGenerateDescription} 
            disabled={isGenerating || !file}
            className="btn btn-secondary btn-small btn-ai-generate"
          >
            {isGenerating ? <Spinner size="spinner-small" /> : 'Re-Generate with AI'}
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price ($):</label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="form-input"
            placeholder="e.g., 4.99"
          />
        </div>

        <button type="submit" disabled={isLoading} className="btn btn-primary">
          {isLoading ? <Spinner /> : 'Encrypt & Upload'}
        </button>

        {message && (
          <p className={`message ${message.startsWith('Error') || message.startsWith('Upload failed') ? 'error-message' : 'success-message'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default SellerUploadForm;