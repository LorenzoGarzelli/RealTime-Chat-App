//TODO Make IV Random

const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey(
    'jwk',
    keyPair.publicKey
  );
  const privateKeyJwk = await window.crypto.subtle.exportKey(
    'jwk',
    keyPair.privateKey
  );

  return { publicKeyJwk, privateKeyJwk };
};

const getSharedKey = async (
  publicKeyJwk: JsonWebKey,
  privateKeyJwk: JsonWebKey
) => {
  const publicKey = await window.crypto.subtle.importKey(
    'jwk',
    publicKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
  const privateKey = await window.crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
  const sharedKey = await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return await window.crypto.subtle.exportKey('jwk', sharedKey);
};

const encrypt = async (text: string, derivedKey: CryptoKey) => {
  const encodedText = new TextEncoder().encode(text);

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: new TextEncoder().encode('Initial Vector'),
    },
    derivedKey,
    encodedText
  );

  const uintArray = new Uint8Array(encryptedData);
  const string = String.fromCharCode.apply(null, Array(...uintArray));
  const base64Data = btoa(string);

  return base64Data;
};

const decrypt = async (encryptedText: string, derivedKey: CryptoKey) => {
  try {
    //const message = JSON.parse(cipherMessageJson);
    //const text = message.base64Data;
    const text = encryptedText;
    // const InitializationVector = new Uint8Array(message.InitializationVector)
    // .buffer;

    const string = atob(text);
    const uintArray = new Uint8Array(
      [...string].map(char => char.charCodeAt(0))
    );

    const algorithm = {
      name: 'AES-GCM',
      iv: new TextEncoder().encode('Initial Vector'),
    };

    const decryptedData = await window.crypto.subtle.decrypt(
      algorithm,
      derivedKey,
      uintArray
    );

    return new TextDecoder().decode(decryptedData);
  } catch (err: any) {
    return err.message;
  }
};
export { generateKeyPair, getSharedKey, encrypt, decrypt };
