import { socket } from "../store/socket-context";
import { DBController, KeysPairs, User } from "./db";

class KeyStore {
  private keysMap: Map<string, CryptoKey>;
  private loading: Promise<void>;
  constructor() {
    this.initialize();
  }

  private async initialize() {
    this.keysMap = new Map();
    this.loading = this.loadCryptographicKeys();
  }

  private async loadCryptographicKeys() {
    const friends: User[] = await DBController.getFriends();
    if (friends.length <= 0) return;

    let sharedKey: CryptoKey;
    for (let friend of friends) {
      let keyPairs: KeysPairs = await DBController.getKeyPairsByFriendId(
        friend._id
      );

      if (!keyPairs) {
        //? Generate new keyPairs
        const keys = await this.generateKeyPair();
        keyPairs = {
          _id: friend._id,
          PBK: keys.publicKeyJwk,
          PVK: keys.privateKeyJwk,
        };

        //? Share Generated PBK to server
        await fetch(`api/v1/users/friendShips/shareKeys/${friend._id}`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ PBK: keyPairs.PBK }),
        });

        await DBController.saveKeyPairs(keyPairs);

        //? Share Generated PBK to friend via WebSocket
        this.sharePBK(keyPairs.PBK, friend._id);
      }

      if (!keyPairs.shared && keyPairs.FriendPBK) {
        //? Compute shared AES Key

        keyPairs.shared = await this.computeSharedKey(
          keyPairs.FriendPBK,
          keyPairs.PVK
        );
        keyPairs.SharedKeyTimestamp = Date.now();
        await DBController.updateKeyPairsByFriendId(friend._id, keyPairs);
      }
      if (keyPairs.shared) this.keysMap.set(friend._id, keyPairs.shared);
    }
  }
  public async generateKeyPair() {
    const keyPairs = await window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );

    const publicKeyJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPairs.publicKey
    );
    const privateKeyJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPairs.privateKey
    );

    return { publicKeyJwk, privateKeyJwk };
  }
  public async computeSharedKey(
    publicKeyJwk: JsonWebKey,
    privateKeyJwk: JsonWebKey
  ) {
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      publicKeyJwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );
    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      privateKeyJwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );
    const sharedKey = await window.crypto.subtle.deriveKey(
      { name: "ECDH", public: publicKey },
      privateKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    return sharedKey;
  }

  public async encrypt(
    text: string,
    sendingTimestamp: string,
    friendId: string
  ) {
    try {
      await this.loading;
      const sharedKey: CryptoKey | undefined = this.keysMap.get(friendId);
      if (!sharedKey) {
        throw new Error("No sharedKey available for encryption");
      }
      const encodedText = new TextEncoder().encode(text);

      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: new TextEncoder().encode(sendingTimestamp),
        },
        sharedKey,
        encodedText
      );

      const uintArray = new Uint8Array(encryptedData);
      const string = String.fromCharCode.apply(null, Array(...uintArray));
      const base64Data = btoa(string);

      return base64Data;
    } catch (err) {
      this.initialize();
      throw new Error("fatal error during decryption");
    }
  }
  public async decrypt(
    base64encryptedText: string,
    receivingTimestamp: string,
    friendId: string
  ) {
    try {
      await this.loading;
      const sharedKey: CryptoKey | undefined = this.keysMap.get(friendId);
      if (!sharedKey) {
        throw new Error("No sharedKey available for decryption");
      }
      const decodedText = atob(base64encryptedText);
      const uintArray = new Uint8Array(
        [...decodedText].map((char) => char.charCodeAt(0))
      );

      const algorithm = {
        name: "AES-GCM",
        iv: new TextEncoder().encode(receivingTimestamp),
      };

      const decryptedData = await window.crypto.subtle.decrypt(
        algorithm,
        sharedKey,
        uintArray
      );

      const message = new TextDecoder().decode(decryptedData);
      return message;
    } catch (err: any) {
      await DBController.deleteKeysByFriendId(friendId);
      this.initialize();
      throw new Error("fatal error during decryption");
    }
  }
  private async sharePBK(PBK: JsonWebKey, to: string) {
    socket.emit("keySharing", { to, PBK });
  }

  public async storeReceivedKey(FriendPBK: JsonWebKey, friendId: string) {
    await DBController.saveReceivedPBK(friendId, FriendPBK);
    const keyPairs = await await DBController.getKeyPairsByFriendId(friendId);
    if (!keyPairs || !FriendPBK) return;

    keyPairs.shared = await this.computeSharedKey(
      keyPairs.FriendPBK!,
      keyPairs.PVK
    );
    keyPairs.SharedKeyTimestamp = Date.now();

    await DBController.updateKeyPairsByFriendId(friendId, keyPairs);
    this.keysMap.set(friendId, keyPairs.shared);
  }
}
export const keyStore = new KeyStore();
