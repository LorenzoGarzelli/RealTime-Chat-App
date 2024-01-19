import { Server } from 'socket.io';
import redisMessageStore from '../utils/redisMessageStore';
import { ClientSocket } from '../types/types';

export default async (io: Server, socket: ClientSocket) => {
  socket.join(socket.roomId);

  const messages = await redisMessageStore.findMessagesForUser(socket.roomId);
  const acks = await redisMessageStore.findAcksForUser(socket.roomId);

  socket.emit('session', {
    userId: socket.roomId,
    messages,
    acks,
  });
};
