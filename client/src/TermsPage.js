// client/src/TermsPage.js
import React from 'react';
import './AboutPage.css'; // Reusing the same CSS as the About Page

const TermsPage = () => {
  return (
    <div className="page-container static-page-container">
      <h1 className="page-header">Terms of Service</h1>
      <div className="static-content">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the CodeVault platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            CodeVault provides a marketplace for developers ("Sellers") to license their software, code snippets, and digital assets ("Assets") to other users ("Buyers"). The core premise of the Service is that Buyers do not receive direct access to the source code of the Assets. Instead, they receive access to the Asset's utility via a secure loader tool or through AI-powered modification services provided by the platform.
          </p>
        </section>

        <section>
          <h2>3. Seller Responsibilities</h2>
          <p>
            As a Seller, you represent and warrant that you own or have the necessary licenses, rights, consents, and permissions to publish and sell the Assets you upload. You grant CodeVault a non-exclusive, worldwide, royalty-free license to encrypt, store, host, display, and perform the necessary functions to facilitate the sale and secure delivery of your Assets.
          </p>
          <p>
            You agree that the Assets you upload do not contain any malware, viruses, or malicious code. You are responsible for the quality, functionality, and support of your Assets.
          </p>
        </section>

        <section>
          <h2>4. Buyer Responsibilities and License</h2>
          <p>
            When you purchase an Asset, you are purchasing a non-exclusive, non-transferable, revocable license to use the Asset's functionality as intended by the Service. You explicitly agree that you are not purchasing, and will not attempt to gain access to, the underlying source code.
          </p>
          <p>
            You agree not to reverse-engineer, decompile, disassemble, or otherwise attempt to discover the source code of any Asset or the CodeVault loader tool. Any violation of this clause will result in immediate termination of your account and potential legal action.
          </p>
        </section>

        <section>
          <h2>5. AI Modification Service</h2>
          <p>
            The Service may provide an "AI Modification" feature. This feature allows Buyers to request changes to their purchased Assets using natural language. The modification is performed by an automated system. CodeVault does not guarantee the accuracy, functionality, or security of the AI-generated modifications. All modifications are provided "as is" and are used at your own risk.
          </p>
        </section>

        <section>
          <h2>6. Termination</h2>
          <p>
            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
