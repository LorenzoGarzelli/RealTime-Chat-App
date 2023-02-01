import dotenv from 'dotenv';
import { createClient } from 'redis';

// import { createClient } from '';
// import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';
import * as p from '@redis/client';
import { Message, MessageAck } from '../types/types';
import { Socket } from 'socket.io';

dotenv.config({ path: './config.env' });

class RedisMessageStore {
  private client: ReturnType<typeof createClient>;

  constructor(_client?: RedisClientType) {
    this.client =
      //_client ||
      createClient({
        url: process.env.REDIS_DB_URL,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
      });
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log('Connected to Redis Store 💥');
    }
  }

  async saveMessage(message: Message) {
    await this.connect();

    //const value = JSON.stringify(message);

    const exist = await this.client.exists(`message:${message.to}`);

    if (exist < 1) await this.client.json.set(`message:${message.to}`, '$', []);

    this.client
      .multi()
      .json.arrAppend(`message:${message.to}`, '$', message)
      .expire(
        `message:${message.to}`,
        Number(process.env.CONVERSATION_TTL) || 86400
      )
      .exec();

    /*this.client
      .multi()
      .rPush(`message:${message.to}`, value)
      .expire(
        `message:${message.to}`,
        Number(process.env.CONVERSATION_TTL) || 86400
      )
      .exec();*/
  }

  async findMessagesForUser(userRoomId: string) {
    await this.connect();

    //const results = await this.client.lRange(`message:${userRoomId}`, 0, -1);
    //return results.map(result => JSON.parse(result));

    //@ts-ignore
    const results = await this.client.json.get(`message:${userRoomId}`, 0, -1);
    return results;
  }
  async findAcksForUser(userRoomId: string) {
    await this.connect();
    //const results = await this.client.lRange(`ack:${userRoomId}`, 0, -1);
    //return results.map(result => JSON.parse(result));

    //@ts-ignore
    const results = await this.client.json.get(`ack:${userRoomId}`);

    return results;
  }

  async deleteMessages(socket: Socket, message: MessageAck) {
    // console.time('messages');

    //TODO JSON.GET ack:816ccbc9-e281-40f8-a189-c82b79bedc5f "$.[?(@.uuid==\"b6211243-39b4-483e-8367-cb848a42e85a747474723\")]"

    const exist = await this.client.exists(`ack:${message.from}`);

    if (exist < 1) await this.client.json.set(`ack:${message.from}`, '$', []);

    this.client.json
      //@ts-ignore
      .arrAppend(`ack:${message.from}`, '$', {
        // [message.uuid]: {
        uuid: message.uuid,
        //@ts-ignore
        to: socket.roomId,
        status: message.status,
        // },
      })
      .then(() => {
        //? send ack to sender user
        socket.to(message.from).emit('messages ack', {
          uuid: message.uuid,
          //@ts-ignore
          to: socket.roomId,
          status: message.status,
        });
        //@ts-ignore
        this.client.json.DEL(
          //@ts-ignore
          `message:${socket.roomId}`,
          `$.[?(@.uuid=="${message.uuid}")]`
        );
      });

    /*this.client
        .multi()
        .rPush(
          `ack:${message.from}`,
          JSON.stringify({
            uuid: message.uuid,
            to: message.to,
            status: message.status,
          })
        )
        .expire(
          `message:${message.to}`,
          Number(process.env.CONVERSATION_TTL) || 86400
        )
        .exec();

      this.client.lRem(`message:${socketId}`, 1, JSON.stringify(message));*/

    // console.timeEnd('messages');

    //this.client.del(keys);
  }
}
export default new RedisMessageStore();
