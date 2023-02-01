import { Server, Socket } from 'socket.io';
import redisMessageStore from '../utils/redisMessageStore';

export default async (io: Server, socket: Socket) => {
  //@ts-ignore
  socket.join(socket.roomId);

  //@ts-ignore
  const messages = await redisMessageStore.findMessagesForUser(socket.roomId);
  //@ts-ignore
  const acks = await redisMessageStore.findAcksForUser(socket.roomId);
  socket.emit('session', {
    //@ts-ignore
    userId: socket.roomId,
    messages,
    acks,
  });
};
