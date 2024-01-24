import Dexie, { Table } from 'dexie';
import { MessageAck, MessageStatus, MessageType } from '../types';
export interface User {
  _id: string;
  name: string;
  roomId: string;
}
export type Message = {
  uuid: string;
  content: string;
  timestamp: string;
  id?: number;
  type: MessageType;
  status: MessageStatus;
  resent_timestamp?: string;
};

type MessageStatusUpdate = {
  status: MessageStatus;
  resent_timestamp?: string;
};

export type KeysPairs = {
  _id: string;
  PBK: JsonWebKey;
  PVK: JsonWebKey;
  FriendPBK?: JsonWebKey;
  shared?: CryptoKey;
  SharedKeyTimestamp?: number;
};

const MessageDBFields = '++id ,&uuid, status, type';
const FriendDBField = '&_id,&roomId';
const KeysPairDBField = '&_id, PBK, PVK, FriendPBK ,shared ';

export class DbController {
  private friends!: Table<User>;
  private db: Dexie;
  private static MESSAGE_TTL = 30; //TODO need to stay in env file

  private isSchemaLoaded: boolean;
  private schemaLoadingPromise: Promise<void>;

  constructor() {
    this.db = new Dexie('chat-app', { autoOpen: true });
    this.isSchemaLoaded = false;
    this.schemaLoadingPromise = this.loadCurrentSchema();
  }

  private async loadCurrentSchema() {
    await this.db.open();
    if (this.db.tables.length === 0) {
      await this.initializeDB();
    }

    const currentSchema = this.db.tables.reduce((result, { name, schema }) => {
      //@ts-ignore
      result[name] = [
        schema.primKey.src,
        ...schema.indexes.map(idx => idx.src),
      ].join(',');
      return result;
    }, {});

    console.log('Version: ' + this.db.verno);
    console.log('Current Schema: ', currentSchema);
    this.isSchemaLoaded = true;
  }
  private async initializeDB() {
    this.db.close();
    this.db.version(1).stores({
      friends: FriendDBField,
      keys: KeysPairDBField,
    });
    await this.db.open();
  }

  private async waitSchemaLoading() {
    if (!this.isSchemaLoaded) {
      await this.schemaLoadingPromise;
    }
  }

  public async addChatStore(storeName: string) {
    this.db = await this.changeSchema({
      [storeName]: MessageDBFields,
    });
  }

  private async changeSchema(schemaChanges: any) {
    //? If DB is empty from tables, it needs to be recreated
    if (this.db.tables.length === 0) {
      await this.initializeDB();
    }

    //? Extract current schema in dexie format:
    const currentSchema = this.db.tables.reduce((result, { name, schema }) => {
      //@ts-ignore
      result[name] = [
        schema.primKey.src,
        ...schema.indexes.map(idx => idx.src),
      ].join(',');
      return result;
    }, {});

    if (Object.keys(currentSchema).includes(Object.keys(schemaChanges)[0]))
      return this.db;

    console.log('Version: ' + this.db.verno);
    console.log('Current Schema: ', currentSchema);

    this.db.close();
    const newDb = new Dexie(this.db.name);
    newDb.on('blocked', () => false); // Silence console warning of blocked event.

    // Tell Dexie about current schema:
    newDb.version(this.db.verno).stores(currentSchema);

    // Tell Dexie about next schema:
    newDb.version(this.db.verno + 1).stores(schemaChanges);

    // Upgrade it:
    return await newDb.open();
  }

  public async saveMessage(message: Message, userId: string) {
    await this.waitSchemaLoading();

    await this.db.table(`chat-${userId}`).add(message);
  }

  public async saveFriend(user: User) {
    await this.waitSchemaLoading();
    await this.db
      .table('friends')
      .add(user)
      .catch('ConstraintError', ignored => {});
  }
  public async getFriends() {
    await this.waitSchemaLoading();

    return await this.db.table('friends').toArray();
  }

  public async getFriendByRoomId(roomId: string): Promise<User> {
    await this.waitSchemaLoading();

    return await this.db
      .table('friends')
      .where('roomId')
      .equals(roomId)
      .first();
  }

  public async getFriendById(friendId: string): Promise<User> {
    await this.waitSchemaLoading();

    return await this.db.table('friends').where('_id').equals(friendId).first();
    //   .toArray();
    // if (friendArray.length > 0) return;
  }

  public async updateMessageStatusWithAck(userId: string, ack: MessageAck) {
    await this.waitSchemaLoading();

    this.db
      .table(`chat-${userId}`)
      .where('uuid')
      .equals(ack.uuid)
      .and((msg: Message) => msg.status !== 'read')
      .modify({ status: ack.status });
    //.modify({ status: ack.status, resent_timestamp: undefined })
  }

  public async getKeyPairsByFriendId(friendId: string): Promise<KeysPairs> {
    await this.waitSchemaLoading();

    return await DBController.db
      .table('keys')
      .where('_id')
      .equals(friendId)
      .first();
  }

  public async saveKeyPairs(keyPairs: KeysPairs) {
    await this.waitSchemaLoading();

    await this.db.table(`keys`).add(keyPairs);
  }
  public async saveReceivedPBK(friendId: String, FriendPBK: JsonWebKey) {
    await this.waitSchemaLoading();

    await this.db.table('keys').update(friendId, { FriendPBK: FriendPBK });
  }

  public async updateKeyPairsByFriendId(friendId: string, keyPairs: KeysPairs) {
    await this.waitSchemaLoading();

    await this.db.table('keys').update(friendId, keyPairs);
  }

  public async getChatMessagesByFriendId(friendId: string) {
    await this.waitSchemaLoading();

    return await this.db.table(`chat-${friendId}`).toArray();
  }

  public async updateChatMessageStatus(
    friendId: string,
    messageUUID: string,
    modification: MessageStatusUpdate
  ) {
    await this.waitSchemaLoading();

    this.db
      .table(`chat-${friendId}`)
      .where('uuid')
      .equals(messageUUID)
      .modify(modification);
  }

  public async getMessagesToRead(friendId: string) {
    await this.waitSchemaLoading();

    return await this.db
      .table(`chat-${friendId}`)
      .where('type')
      .equals('received')
      .and((msg: Message) => msg.status == 'to read')
      .toArray();
  }
  public async getMessagesToResend(friendId: string) {
    await this.waitSchemaLoading();

    return await this.db
      .table(`chat-${friendId}`)
      .where('type')
      .equals('sent')
      .and(
        (msg: Message) =>
          (msg.status == 'sent' || msg.status == 'sending') &&
          (Date.now() - +msg.timestamp) / 1000 >= DbController.MESSAGE_TTL &&
          msg?.resent_timestamp == undefined
      )
      .toArray();
  }
}

export const DBController = new DbController();
