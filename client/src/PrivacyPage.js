// client/src/PrivacyPage.js
import React from 'react';
import './AboutPage.css'; // Reusing the same CSS as the About Page

const PrivacyPage = () => {
  return (
    <div className="page-container static-page-container">
      <h1 className="page-header">Privacy Policy</h1>
      <div className="static-content">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            CodeVault ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>
            We may collect personal information about you in a variety of ways:
          </p>
          <ul>
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and payment information, that you voluntarily give to us when you register with the Service or when you make a purchase.</li>
            <li><strong>Uploaded Assets:</strong> For Sellers, we collect the code and any associated files you upload. This code is encrypted immediately and stored securely. It is treated as highly confidential.</li>
            <li><strong>Derivative Data:</strong> Information our servers automatically collect, such as your IP address, browser type, and pages you have visited.</li>
          </ul>
        </section>

        <section>
          <h2>3. Use of Your Information</h2>
          <p>
            Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:
          </p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Process your transactions and deliver the services you have requested.</li>
            <li>Securely process your AI modification requests, which involves sending your encrypted, purchased code (in a decrypted, in-memory state) to our AI service provider for processing.</li>
            <li>Email you regarding your account or orders.</li>
            <li>Monitor and analyze usage and trends to improve the Service.</li>
          </ul>
        </section>

        <section>
          <h2>4. Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information and your uploaded Assets. All uploaded code is encrypted at rest using AES-GCM 256-bit encryption. Decryption keys are managed securely and are never exposed to other users.
          </p>
          <p>
            While we have taken reasonable steps to secure the information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
