import { IDBPDatabase, openDB } from 'idb';

class IndexDB {
  private database: string;
  private db: any;
  private static version: number;

  constructor(database: string) {
    this.database = database;
    const version = localStorage.getItem('db-version');
    IndexDB.version = version ? +version : 1;
  }

  public async addNewObjectStore(tableNames: string[]) {
    await this.db.close();
    await this.createObjectStore(tableNames, ++IndexDB.version);
  }
  public async createObjectStore(
    tableNames: string[],
    version = IndexDB.version
  ) {
    try {
      //TODO Fix Adding table
      this.db = await openDB(this.database, version, {
        // blocked() {
        //   console.log('Blocked');
        // },
        // blocking() {
        //   console.log('Blocking');
        // },
        upgrade(db: IDBPDatabase, oldVersion, newVersion, transaction) {
          let changesApplied = false;
          for (const tableName of tableNames) {
            if (!db.objectStoreNames.contains(tableName)) {
              db.createObjectStore(tableName, {
                autoIncrement: true,
                keyPath: 'id',
              });
              changesApplied = true;
            }
          }
          // db?.version = version;
          if (changesApplied) localStorage.setItem('db-version', `${version}`);
        },
      });
      return this.db;
    } catch (error) {
      console.error(error);
    }
  }
  public async getValue(tableName: string, id: number | string) {
    // if (!this.db) this.db = await this.createObjectStore([tableName]);
    // if (this.db) await this.db;
    await this.createObjectStore([tableName]);
    // if (!this.db) this.db = await openDB(this.database, IndexDB.version);
    const tx = this.db.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);

    const result = await store.get(id);
    console.log('Get Data ', JSON.stringify(result));
    return result;
  }

  public async getAllValue(tableName: string) {
    // if (!this.db) this.db = await this.createObjectStore([tableName]);
    // if (this.db) await this.db;
    await this.createObjectStore([tableName]);
    // if (!this.db) this.db = await openDB(this.database, IndexDB.version);
    const tx = this.db.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    const result = await store.getAll();
    console.log('Get All Data', JSON.stringify(result));
    return result;
  }

  public async putValue(tableName: string, value: object) {
    // if (!this.db) this.db = await this.createObjectStore([tableName]);
    // if (this.db) await this.db;
    await this.createObjectStore([tableName]);
    // if (!this.db) this.db = await openDB(this.database, IndexDB.version);
    const tx = this.db.transaction(tableName, 'readwrite');
    const store = tx.objectStore(tableName);
    const result = await store.put(value);
    console.log('Put Data ', JSON.stringify(result));
    return result;
  }

  public async putBulkValue(tableName: string, values: object[]) {
    // if (!this.db) this.db = await openDB(this.database, IndexDB.version);
    const tx = this.db.transaction(tableName, 'readwrite');
    const store = tx.objectStore(tableName);
    for (const value of values) {
      const result = await store.put(value);
      console.log('Put Bulk Data ', JSON.stringify(result));
    }
    return this.getAllValue(tableName);
  }

  public async deleteValue(tableName: string, id: number) {
    await this.createObjectStore([tableName]);
    // if (!this.db) this.db = await openDB(this.database, IndexDB.version);
    const tx = this.db.transaction(tableName, 'readwrite');
    const store = tx.objectStore(tableName);
    const result = await store.get(id);
    if (!result) {
      console.log('Id not found', id);
      return result;
    }
    await store.delete(id);
    console.log('Deleted Data', id);
    return id;
  }

  public getDBstatus() {
    return this.db;
  }
}

export default IndexDB;
