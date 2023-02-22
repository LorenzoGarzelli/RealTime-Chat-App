import { Server, Socket } from 'socket.io';
import { Message, MessageAck } from '../types/types';
import redisMessageStore from '../utils/redisMessageStore';

export default (io: Server, socket: Socket) => {
  socket.on('messages ack', async (message: MessageAck, callback) => {
    await redisMessageStore.deleteMessages(socket, message);

    //? Send Ack To User
    if (callback)
      callback({
        status: 'received from server',
      });
  });
};
