project now live at codevw.netlify.app

# CodeVault - Secure Code Marketplace with AI Modification

## Project Goal

CodeVault aims to be a platform where developers (**Sellers**) can sell their code (e.g., utility scripts, components, algorithms) and other users (**Buyers**) can purchase and use this code securely. A key feature is preventing casual piracy by restricting direct access to the source code for buyers, while still allowing them to request modifications using AI.

## Core Features (When Complete)

1.  **User Authentication:**
    * Sellers and Buyers can sign up and log in securely (using Supabase Auth).

2.  **Code Marketplace:**
    * Sellers can upload their source code files along with descriptions, titles, and prices.
    * Source code is stored securely in the backend (Supabase Storage) and is **not** directly accessible to Buyers.
    * All users (including visitors) can browse available code listings.

3.  **Purchase System:**
    * Logged-in Buyers can purchase code listings.
    * The platform records the purchase, linking the Buyer to the specific code listing. (Payment integration would be a future step).

4.  **Secure Code Access (Anti-Piracy):**
    * Buyers **do not** get direct access to the original source code.
    * Depending on the code type, Buyers might receive:
        * A compiled, non-human-readable version (like a HEX file or WebAssembly module) via a temporary, secure download link (Signed URL).
        * Access to the code's functionality via an API endpoint hosted by the platform (if the code runs entirely on the backend).
    * Downloads use expiring signed URLs from Supabase Storage for security.

5.  **AI-Powered Modification:**
    * Buyers can select code they have purchased.
    * They can describe desired changes in natural language (e.g., "change the color variable to red").
    * This request is sent to the platform's backend (Supabase Edge Function).
    * The backend securely retrieves the original source code, sends it along with the request to the Gemini API.
    * Gemini processes the request and attempts to return modified source code.
    * The backend receives the modified code, potentially runs tests (future enhancement), and then either:
        * Makes the updated compiled version/API available to the Buyer.
        * Stores the modified source (still hidden from the Buyer) for future modification requests.
    * The Buyer interacts with the AI modification results through the platform UI, seeing the suggested code changes or receiving the updated compiled output/API endpoint.

## Technology Stack (Current)

* **Frontend:** React (using Create React App)
* **Backend & Database:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
* **AI Code Modification:** Google Gemini API (via Supabase Edge Function - planned)
* **Styling:** CSS

## Capabilities (When Complete)

* A functional marketplace for buying and selling code.
* Secure user management.
* A mechanism for sellers to upload and manage code listings.
* A system for buyers to purchase listings and access the code's functionality (or compiled version) securely without direct source code access.
* An interface for buyers to request modifications to their purchased code using natural language, processed by an AI backend.
* Scalable infrastructure leveraging Supabase's BaaS features.

## Limitations / Trade-offs

* The strict anti-piracy model (no source code for buyers) significantly limits how buyers can use, integrate, or debug the code compared to traditional marketplaces.
* The effectiveness of source code protection is higher for compiled languages than for interpreted languages.
* Buyers are dependent on the platform ("vendor lock-in") for modifications.
* The accuracy and capability of AI code modification depend heavily on the complexity of the code and the request.
* Platform security is critical, as the backend holds all original source code.
