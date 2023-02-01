import { randomUUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { Message } from '../types/types';
import redisMessageStore from '../utils/redisMessageStore';

export default (io: Server, socket: Socket) => {
  socket.on('chat message', (message: Message, callback) => {
    //.to(socket.userID)
    //@ts-ignore
    message.from = socket.roomId;
    const { to, content, timestamp, from, uuid } = message;

    socket.to(to).emit('chat message', {
      uuid, //TODO the id field must be generated on client side
      content,
      timestamp,
      from,
      to,
    });
    //? Send Ack To User
    if (callback)
      callback({
        status: 'received from server',
      });

    redisMessageStore.saveMessage(message);
  });
};
