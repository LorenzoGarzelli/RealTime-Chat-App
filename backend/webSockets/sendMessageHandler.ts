import { Server } from 'socket.io';
import { ClientSocket, Message } from '../types/types';
import redisMessageStore from '../utils/redisMessageStore';

export default (io: Server, socket: ClientSocket) => {
  socket.on('chat message', async (message: Message, callback) => {
    message.from = socket.roomId;
    const { to, content, timestamp, from, uuid } = message;

    socket.to(to).emit('chat message', {
      uuid,
      content,
      timestamp,
      from,
      to,
    });

    await redisMessageStore.saveMessage(message);
    if (callback)
      callback({
        status: 'received from server',
      });
  });
};
