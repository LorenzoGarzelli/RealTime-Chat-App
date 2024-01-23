import dotenv from 'dotenv';
import { createClient } from 'redis';
import { ClientSocket, Message, MessageAck } from '../types/types';

dotenv.config({ path: './config.env' });

class RedisMessageStore {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient({
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
    if (!this.client.isOpen) await this.client.connect();

    const recipientMessagesBox = await this.client.exists(
      `message:${message.to}`
    );

    if (recipientMessagesBox < 1)
      await this.client.json.set(`message:${message.to}`, '$', []); // create the messages box if doesn't exist

    this.client
      .multi()
      .json.arrAppend(`message:${message.to}`, '$', message)
      .expire(
        `message:${message.to}`,
        Number(process.env.CONVERSATION_TTL) || 86400
      )
      .exec();
  }

  async findMessagesForUser(userRoomId: string) {
    if (!this.client.isOpen) await this.client.connect();

    const foundMessages = await this.client.json.get(
      //@ts-ignore
      `message:${userRoomId}`,
      0,
      -1
    );
    return foundMessages;
  }
  async findAcksForUser(userRoomId: string) {
    if (!this.client.isOpen) await this.client.connect();
    //@ts-ignore
    const foundAcks = await this.client.json.get(`ack:${userRoomId}`);

    return foundAcks;
  }

  async deleteAckForUser(userRoomId: string, uuid: string) {
    if (!this.client.isOpen) await this.client.connect();

    const query = `$.[?(@.uuid=="${uuid}")]`;
    this.client.json.DEL(`ack:${userRoomId}`, query);
  }

  async saveAckAndDeleteMessage(socket: ClientSocket, message: MessageAck) {
    if (!this.client.isOpen) await this.client.connect();

    const recipientAcksBox = await this.client.exists(`ack:${message.to}`);

    if (recipientAcksBox < 1)
      await this.client.json.set(`ack:${message.to}`, '$', []);

    await this.client.json.arrAppend(`ack:${message.to}`, '$', {
      uuid: message.uuid,
      //@ts-ignore
      from: socket.roomId,
      status: message.status,
    });

    await this.client.json.DEL(
      //@ts-ignore
      `message:${socket.roomId}`,
      `$.[?(@.uuid=="${message.uuid}")]`
    );
  }
}
export default new RedisMessageStore();
