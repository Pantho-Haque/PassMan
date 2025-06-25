/**
 * Crypto.js - Password Manager Encryption Functions
 * 
 * This file handles all cryptographic operations for the password manager:
 * - Key derivation from master password
 * - Encryption and decryption of password data
 * - Secure random password generation
 */

class CryptoManager {
  constructor() {
    this.iv_length = 12;
    this.salt_length = 16;
    this.iterations = 100000;
    this.keyLength = 256;
    this.algorithm = 'AES-GCM';
  }

  /**
   * Derives a cryptographic key from the master password
   * 
   * @param {string} masterPassword - The user's master password
   * @param {Uint8Array} salt - Salt for key derivation (or null to generate new salt)
   * @returns {Promise<{key: CryptoKey, salt: Uint8Array}>} - Derived key and salt
   */
  async deriveKey(masterPassword, salt = null) {
    if (!salt) {
      salt = crypto.getRandomValues(new Uint8Array(this.salt_length));
    }

    // Convert password to bytes
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(masterPassword);

    // Import the password as a key
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      passwordBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive a key using PBKDF2
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: this.algorithm, length: this.keyLength },
      true,
      ['encrypt', 'decrypt']
    );

    return { key: derivedKey, salt };
  }

  /**
   * Encrypts data using the derived key
   * 
   * @param {CryptoKey} key - The encryption key
   * @param {Object} data - Data to encrypt
   * @returns {Promise<{encrypted: ArrayBuffer, iv: Uint8Array}>} - Encrypted data and IV
   */
  async encrypt(key, data) {
    // Generate an IV
    const iv = crypto.getRandomValues(new Uint8Array(this.iv_length));

    // Convert data to JSON and then to bytes
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(JSON.stringify(data));

    // Encrypt the data
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv
      },
      key,
      dataBytes
    );

    return { encrypted, iv };
  }

  /**
   * Decrypts data using the derived key
   * 
   * @param {CryptoKey} key - The decryption key
   * @param {ArrayBuffer} encryptedData - The encrypted data
   * @param {Uint8Array} iv - The initialization vector used for encryption
   * @returns {Promise<Object>} - Decrypted data as object
   */
  async decrypt(key, encryptedData, iv) {
    try {
      // Decrypt the data
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encryptedData
      );

      // Convert bytes to text and parse JSON
      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decrypted);
      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Invalid master password or corrupted data');
    }
  }

  /**
   * Exports encryption data (salt and IV) as a base64 string
   * 
   * @param {Uint8Array} salt - Salt used for key derivation
   * @param {Uint8Array} iv - IV used for encryption
   * @returns {string} - Base64 encoded string
   */
  exportEncryptionData(salt, iv) {
    const combined = new Uint8Array(salt.length + iv.length);
    combined.set(salt);
    combined.set(iv, salt.length);
    return this.arrayBufferToBase64(combined);
  }

  /**
   * Imports encryption data from a base64 string
   * 
   * @param {string} base64Data - Base64 encoded string
   * @returns {{salt: Uint8Array, iv: Uint8Array}} - Extracted salt and IV
   */
  importEncryptionData(base64Data) {
    const combined = this.base64ToArrayBuffer(base64Data);
    const salt = new Uint8Array(combined.slice(0, this.salt_length));
    const iv = new Uint8Array(combined.slice(this.salt_length));
    return { salt, iv };
  }

  /**
   * Converts an ArrayBuffer to a Base64 string
   * 
   * @param {ArrayBuffer} buffer - The buffer to convert
   * @returns {string} - Base64 encoded string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts a Base64 string to an ArrayBuffer
   * 
   * @param {string} base64 - Base64 encoded string
   * @returns {ArrayBuffer} - The decoded buffer
   */
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generates a secure random password
   * 
   * @param {number} length - Length of the password
   * @param {boolean} includeUppercase - Include uppercase letters
   * @param {boolean} includeLowercase - Include lowercase letters
   * @param {boolean} includeNumbers - Include numbers
   * @param {boolean} includeSymbols - Include special symbols
   * @returns {string} - Generated password
   */
  generatePassword(length = 16, includeUppercase = true, includeLowercase = true, 
                  includeNumbers = true, includeSymbols = true) {
    
    let charset = '';
    
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    if (charset === '') {
      throw new Error('At least one character type must be selected');
    }
    
    // Generate the random values
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    // Convert random values to characters
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }
    
    return password;
  }

  /**
   * Calculates the strength of a password
   * 
   * @param {string} password - The password to evaluate
   * @returns {{score: number, feedback: string}} - Score (0-100) and feedback
   */
  evaluatePasswordStrength(password) {
    if (!password) {
      return { score: 0, feedback: 'No password' };
    }
    
    // Calculate entropy and other factors
    let score = 0;
    let feedback = '';
    
    // Length factor (up to 40 points)
    const lengthFactor = Math.min(password.length * 2, 40);
    score += lengthFactor;
    
    // Character variety (up to 40 points)
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    
    const varietyScore = (hasLower ? 10 : 0) + 
                          (hasUpper ? 10 : 0) + 
                          (hasDigit ? 10 : 0) + 
                          (hasSpecial ? 10 : 0);
    score += varietyScore;
    
    // Complexity factor (up to 20 points)
    const uniqueChars = new Set(password.split('')).size;
    const uniqueRatio = uniqueChars / password.length;
    const complexityScore = Math.round(uniqueRatio * 20);
    score += complexityScore;
    
    // Generate feedback
    if (score < 40) {
      feedback = 'Weak - easily crackable';
    } else if (score < 60) {
      feedback = 'Fair - could be stronger';
    } else if (score < 80) {
      feedback = 'Good - decent protection';
    } else {
      feedback = 'Strong - excellent protection';
    }
    
    return { score, feedback };
  }
}

// Export the CryptoManager
const cryptoManager = new CryptoManager();
