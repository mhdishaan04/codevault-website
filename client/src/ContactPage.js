// client/src/ContactPage.js
import React, { useState } from 'react';
import './ContactPage.css'; // We will create this

const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd send this data to a backend.
    // For this demo, we'll just show a success message.
    setSubmitted(true);
  };

  return (
    <div className="page-container static-page-container">
      <h1 className="page-header">Contact Us</h1>

      {submitted ? (
        <div className="contact-success-message">
          <h3>Thank You!</h3>
          <p>Your message has been received. Our team will get back to you shortly.</p>
        </div>
      ) : (
        <div className="contact-container">
          <div className="contact-info">
            <h2>Get In Touch</h2>
            <p>
              Have a question about our platform? Need help with an upload? Or just want to talk about security and AI? We'd love to hear from you.
            </p>
            <p>
              Fill out the form, and our team will get back to you as soon as possible.
            </p>
            <div className="contact-details">
              <p><strong>Support:</strong> support@codevault.io</p>
              <p><strong>Press:</strong> press@codevault.io</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows="6"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full-width">
              Send Message
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContactPage;
