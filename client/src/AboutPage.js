// client/src/AboutPage.js
import React from 'react';
import './AboutPage.css'; // We will create this

const AboutPage = () => {
  return (
    <div className="page-container static-page-container">
      <h1 className="page-header">About CodeVault</h1>
      <div className="static-content">
        <section>
          <h2>Our Mission</h2>
          <p>
            At CodeVault, our mission is to create a fair and secure ecosystem for software developers to monetize their creations. We believe that intellectual property is the lifeblood of innovation. Traditional marketplaces often force a difficult choice: sell your code and risk piracy, or keep it private and miss monetization opportunities.
          </p>
          <p>
            We set out to solve this. CodeVault is built on a "zero-trust" principle for source code. We provide the platform for developers to sell their assets while ensuring that buyers receive unparalleled utility *without* direct access to the raw source code. Through our secure loader and revolutionary AI-modification engine, we protect the seller's IP while empowering the buyer.
          </p>
        </section>

        <section>
          <h2>How We're Different</h2>
          <p>
            Unlike other platforms, we don't just sell `.zip` files. We sell access and utility.
          </p>
          <ul>
            <li><strong>Seller Protection:</strong> Your code is encrypted with a unique key upon upload. It is never stored in plaintext on our servers and is never exposed to the buyer.</li>
            <li><strong>Buyer Empowerment:</strong> Purchased code isn't a black box. Our AI Modification engine allows buyers to request changes using natural language, which are then applied securely on our backend. This offers the flexibility of open-source with the security of a proprietary license.</li>
            <li><strong>Secure Execution:</strong> Our `codevault-loader` tool handles the entire process of authenticating, downloading, and decrypting code securely in the user's local environment for execution or compilation, cleaning up afterward.</li>
          </ul>
        </section>

        <section>
          <h2>The Team</h2>
          <p>
            We are a small, passionate team of developers, security-enthusiasts, and AI researchers dedicated to building the future of software distribution. We understand the challenges of being an independent creator, and we're building the platform we always wished we had.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
