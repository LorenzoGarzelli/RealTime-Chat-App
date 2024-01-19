import { Server, Socket } from 'socket.io';
import { ClientSocket, Message, MessageAck } from '../types/types';
import redisMessageStore from '../utils/redisMessageStore';

export default (io: Server, socket: ClientSocket) => {
  socket.on('received ack', async (messageUUID: string, callback) => {
    await redisMessageStore.deleteAckForUser(socket.roomId, messageUUID);

    if (callback)
      callback({
        status: 'received from server',
      });
  });
};
