import dotenv from 'dotenv';
import { createClient } from 'redis';

import { RedisClientType } from '@redis/client';
import { Message } from '../types/types';

dotenv.config({ path: './config.env' });

class RedisMessageStore {
  private client: RedisClientType;

  constructor(_client?: RedisClientType) {
    this.client =
      _client ||
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

    const value = JSON.stringify(message);

    this.client
      .multi()
      .rPush(`message:${message.to}`, value)
      .expire(
        `message:${message.to}`,
        Number(process.env.CONVERSATION_TTL) || 86400
      )
      .exec();
  }

  async findMessagesForUser(userRoomId: string) {
    await this.connect();

    const results = await this.client.lRange(`message:${userRoomId}`, 0, -1);
    return results.map(result => JSON.parse(result));
  }

  deleteMessages(socketId: string, messages: Message[]) {
    // console.time('messages');

    messages.forEach(message => {
      this.client
        .multi()
        .rPush(
          `ack:${message.from}`,
          JSON.stringify({ uuid: message.uuid, to: message.to })
        )
        .expire(
          `message:${message.to}`,
          Number(process.env.CONVERSATION_TTL) || 86400
        )
        .exec();
      this.client.lRem(`message:${socketId}`, 1, JSON.stringify(message));
    });
    // console.timeEnd('messages');

    //this.client.del(keys);
  }
}
export default new RedisMessageStore();
