// supabase/functions/_shared/cryptoUtils.ts

/**
 * Encodes a string to a Uint8Array.
 * @param str The string to encode.
 * @returns Uint8Array
 */
function encodeText(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }
  
  /**
   * Decodes a Uint8Array to a string.
   * @param arr The Uint8Array to decode.
   * @returns string
   */
  function decodeText(arr: Uint8Array): string {
    return new TextDecoder().decode(arr);
  }
  
  /**
   * Converts a byte array (Uint8Array) to a Base64 string.
   * @param buffer The byte array.
   * @returns Base64 encoded string.
   */
  function bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  /**
   * Converts a Base64 string back to an ArrayBuffer.
   * @param base64 The Base64 encoded string.
   * @returns ArrayBuffer.
   */
  function base64ToBuffer(base64: string): ArrayBuffer {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
  }
  
  
  /**
   * Generates a new AES-GCM key.
   * @returns Promise<CryptoKey> The generated key.
   */
  export async function generateAesKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true, // Allow export
      ["encrypt", "decrypt"]
    );
  }
  
  /**
   * Exports a CryptoKey to a Base64 string format for storage.
   * @param key The CryptoKey to export.
   * @returns Promise<string> The key as a Base64 string.
   */
  export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
      const exported = await crypto.subtle.exportKey("raw", key);
      return bufferToBase64(exported);
  }
  
   /**
   * Imports a Base64 encoded key string back into a CryptoKey.
   * @param base64Key The Base64 encoded key string.
   * @returns Promise<CryptoKey> The imported CryptoKey.
   */
  export async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
      const keyBuffer = base64ToBuffer(base64Key);
      return await crypto.subtle.importKey(
          "raw",
          keyBuffer,
          { name: "AES-GCM", length: 256 },
          true, // Extractable
          ["encrypt", "decrypt"]
      );
  }
  
  
  /**
   * Encrypts data using AES-GCM.
   * @param plainText The string data to encrypt.
   * @param key The AES-GCM CryptoKey.
   * @returns Promise<{ iv: Uint8Array, encryptedData: ArrayBuffer }> The IV and encrypted data.
   */
  export async function encryptData(plainText: string, key: CryptoKey): Promise<{ iv: Uint8Array, encryptedData: ArrayBuffer }> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Standard GCM IV size
    const encodedText = encodeText(plainText);
  
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedText
    );
  
    return { iv, encryptedData };
  }
  
  /**
   * Decrypts data using AES-GCM.
   * @param encryptedData The ArrayBuffer containing the encrypted data.
   * @param key The AES-GCM CryptoKey.
   * @param iv The Initialization Vector (Uint8Array) used for encryption.
   * @returns Promise<string> The decrypted string data.
   */
  export async function decryptData(encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string> {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encryptedData
    );
  
    return decodeText(new Uint8Array(decryptedBuffer));
  }
  
  /**
  * Combines IV and encrypted data into a single ArrayBuffer for storage.
  * Format: [12 bytes IV][Encrypted Data bytes]
  * @param iv Uint8Array (12 bytes)
  * @param encryptedData ArrayBuffer
  * @returns ArrayBuffer Combined data
  */
  export function combineIvAndCiphertext(iv: Uint8Array, encryptedData: ArrayBuffer): ArrayBuffer {
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);
      return combined.buffer;
  }
  
  /**
   * Separates the IV and encrypted data from a combined ArrayBuffer.
   * Assumes the first 12 bytes are the IV.
   * @param combinedData ArrayBuffer
   * @returns { iv: Uint8Array, encryptedData: ArrayBuffer }
   */
  export function separateIvAndCiphertext(combinedData: ArrayBuffer): { iv: Uint8Array, encryptedData: ArrayBuffer } {
      if (combinedData.byteLength < 12) {
          throw new Error("Combined data is too short to contain a 12-byte IV.");
      }
      const iv = new Uint8Array(combinedData.slice(0, 12));
      const encryptedData = combinedData.slice(12);
      return { iv, encryptedData };
  }