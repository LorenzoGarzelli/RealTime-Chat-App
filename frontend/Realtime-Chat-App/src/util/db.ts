import Dexie, { Table } from 'dexie';
import { MessageStatus, MessageType } from '../types';
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
};

const MessageDBFields = '++id ,&uuid, status, type';
const FriendDBField = '&_id,&roomId';

//TODO https://dexie.org/docs/Dexie/Dexie.open()
//TODO Dynamic Mode
export class DbController extends Dexie {
  friends!: Table<User>;

  constructor() {
    super('chat-app');

    //TODO Fix issues on db creation
    // this.version(1).stores({
    //   //friends: '++_id, name, rommId',
    //   friends: FriendDBField,
    // });
    this.open();
    this.changeSchema({ friends: FriendDBField });
    // this.on('versionchange', event => {
    //   if (
    //     confirm(
    //       'Another page tries to upgrade the database to version ' +
    //         event.newVersion +
    //         '. Accept?'
    //     )
    //   ) {
    //     // Refresh current webapp so that it starts working with newer DB schema.
    //     window.location.reload();
    //   } else {
    //     // Will let user finish its work in this window and
    //     // block the other window from upgrading.
    //     return false;
    //   }
    // });
    // this.open();

    /*this.open().then(async () => {
      console.log('DB', this);
      this.addFriendStore();
    });*/
  }
  async loadCurrentSchema() {
    const currentSchema = this.tables.reduce((result, { name, schema }) => {
      //@ts-ignore
      result[name] = [
        schema.primKey.src,
        ...schema.indexes.map(idx => idx.src),
      ].join(',');
      return result;
    }, {});

    console.log('Version: ' + this.verno);
    console.log('Current Schema: ', currentSchema);

    // Tell Dexie about current schema:
    this.version(this.verno).stores(currentSchema);
    // // Tell Dexie about next schema:
    // Upgrade it:
    await this.open();
  }
  async addFriendStore(storeName: string) {
    /*  if (this.table(storeName)) return;
    try {
      console.log('BEFORE', this);
      this.table(storeName);
    } catch (err) {
      //@ts-ignore
      if (err!.name == 'InvalidTableError') {
        this.close();
        this.version(this.verno + 1).stores({
          [storeName]: '++id',
        });
        await this.open();
        console.log('AFTER', this);
      }
    }*/
    this.changeSchema({
      /*[storeName]: '++id'*/ ['friends']: FriendDBField,
    });
  }
  async addChatStore(storeName: string) {
    /*  if (this.table(storeName)) return;
    try {
      console.log('BEFORE', this);
      this.table(storeName);
    } catch (err) {
      //@ts-ignore
      if (err!.name == 'InvalidTableError') {
        this.close();
        this.version(this.verno + 1).stores({
          [storeName]: '++id',
        });
        await this.open();
        console.log('AFTER', this);
      }
    }*/
    this.changeSchema({
      /*[storeName]: '++id'*/ [storeName]: MessageDBFields,
    });
  }
  //@ts-ignore
  async changeSchema(schemaChanges) {
    await this.open();
    this.close();

    // this = DbController.staticHelpert();
    // const newDb = new Dexie(db.name);
    this.on('blocked', () => false); // Silence console warning of blocked event.

    // Workaround: If DB is empty from tables, it needs to be recreated
    // if (this.tables.length === 0) {
    //   // await this.delete();
    //   // this.version(1).stores(schemaChanges);
    //   return await this.open();
    // }

    if (db.tables.length === 0) {
      await this.delete();
      this.version(1).stores(schemaChanges);
      return await this.open();
    }
    // Extract current schema in dexie format:
    const currentSchema = this.tables.reduce((result, { name, schema }) => {
      //@ts-ignore
      result[name] = [
        schema.primKey.src,
        ...schema.indexes.map(idx => idx.src),
      ].join(',');
      return result;
    }, {});

    console.log('Version: ' + this.verno);
    console.log('Current Schema: ', currentSchema);

    // Tell Dexie about current schema:
    this.version(this.verno).stores(currentSchema);
    // // Tell Dexie about next schema:
    this.version(this.verno + 1).stores(schemaChanges);
    // Upgrade it:
    return await this.open();
  }
}

export const db = new DbController();
