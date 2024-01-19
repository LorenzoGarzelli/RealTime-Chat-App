import { Server } from 'socket.io';
import { ClientSocket, Message, MessageAck } from '../types/types';
import redisMessageStore from '../utils/redisMessageStore';

export default (io: Server, socket: ClientSocket) => {
  socket.on('messages ack', async (message: MessageAck, callback) => {
    await redisMessageStore.deleteMessages(socket, message);

    if (callback)
      callback({
        status: 'received from server',
      });
  });
};
