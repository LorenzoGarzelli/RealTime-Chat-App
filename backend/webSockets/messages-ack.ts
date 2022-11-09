import { Server, Socket } from 'socket.io';
import { Message } from '../types/types';
import redisMessageStore from '../utils/redisMessageStore';

export default (io: Server, socket: Socket) => {
  socket.on('messages ack', ({ messages }) => {
    //TODO Implement Messages ack

    //@ts-ignore
    //messages.forEach(sender =>
    //  socket.to(sender.to).emit('messages received ack', 'Messages received ')
    //);
    redisMessageStore.deleteMessages(socket.roomId, messages);
  });
};
