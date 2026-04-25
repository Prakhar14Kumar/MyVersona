import { useState, useEffect, useCallback } from 'react';

// Simple Native IndexedDB Wrapper
const DB_NAME = 'e2e-chat-db';
const STORE_NAME = 'key-store';
const PK_ID = 'user-private-key';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function setPrivateKey(key: CryptoKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(key, PK_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getPrivateKey(): Promise<CryptoKey | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(PK_ID);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// ArrayBuffer <-> Base64 helpers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useCrypto() {
  const [isReady, setIsReady] = useState(false);
  const [publicKeyJwk, setPublicKeyJwk] = useState<JsonWebKey | null>(null);

  useEffect(() => {
    async function initKeys() {
      try {
        let privateKey = await getPrivateKey();
        if (privateKey) {
          // If we have a private key, we assume public key is synced on backend, but we might want it.
          // Note: WebCrypto doesn't let you easily extract public key from private key.
          // We can just keep private key ready for decryption.
          setIsReady(true);
          return;
        }

        // Generate new key pair
        const keyPair = await window.crypto.subtle.generateKey(
          {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
          },
          true, // extractable (needed to export public key)
          ["encrypt", "decrypt"]
        );

        // Store private key securely (non-extractable conceptually in DB, though indexedDB stores it as structured clone)
        await setPrivateKey(keyPair.privateKey);

        // Export public key as JWK to send to backend
        const exportedPublicKey = await window.crypto.subtle.exportKey(
          "jwk",
          keyPair.publicKey
        );
        
        setPublicKeyJwk(exportedPublicKey);
        setIsReady(true);
      } catch (err) {
        console.error("Crypto init error:", err);
      }
    }
    initKeys();
  }, []);

  const encryptMessage = useCallback(async (publicKeyJwkRaw: string, plaintext: string) => {
    try {
      const parsedJwk = JSON.parse(publicKeyJwkRaw);
      const publicKey = await window.crypto.subtle.importKey(
        "jwk",
        parsedJwk,
        {
          name: "RSA-OAEP",
          hash: "SHA-256"
        },
        true,
        ["encrypt"]
      );

      const encoder = new TextEncoder();
      const encodedMessage = encoder.encode(plaintext);

      const ciphertextBuf = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP"
        },
        publicKey,
        encodedMessage
      );

      return arrayBufferToBase64(ciphertextBuf);
    } catch (err) {
      console.error("Encryption failed", err);
      throw err;
    }
  }, []);

  const decryptMessage = useCallback(async (ciphertextBase64: string) => {
    try {
      const privateKey = await getPrivateKey();
      if (!privateKey) throw new Error("No private key found");

      const ciphertextBuf = base64ToArrayBuffer(ciphertextBase64);

      const decryptedBuf = await window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP"
        },
        privateKey,
        ciphertextBuf
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuf);
    } catch (err) {
      console.error("Decryption failed", err);
      return "[Unable to decrypt message]";
    }
  }, []);

  return {
    isReady,
    publicKeyJwk,
    encryptMessage,
    decryptMessage
  };
}
