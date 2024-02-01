import { Server } from 'socket.io';
import { ClientSocket, Message, MessageAck } from '../types/types';
import redisMessageStore from '../utils/redisMessageStore';

export default (io: Server, socket: ClientSocket) => {
  socket.on('messages ack', async (message: MessageAck, callback) => {
    await redisMessageStore.saveAckAndDeleteMessage(socket, message);

    //? send ack to sender user
    socket.to(message.to).emit('messages ack', {
      uuid: message.uuid,
      from: socket.roomId,
      status: message.status,
    });

    if (callback)
      callback({
        status: 'received from server',
      });
  });
};
