import { Server, Socket } from 'socket.io';
import { Message, MessageAck } from '../types/types';
import redisMessageStore from '../utils/redisMessageStore';

export default (io: Server, socket: Socket) => {
  socket.on('messages ack', async (message: MessageAck, callback) => {
    //TODO Implement Messages ack

    //@ts-ignore
    //messages.forEach(sender =>
    //  socket.to(sender.to).emit('messages received ack', 'Messages received ')
    //);

    await redisMessageStore.deleteMessages(socket, message);

    //? Send Ack To User
    if (callback)
      callback({
        status: 'received from server',
      });

    //! DELETE
    // socket.to(message.from).emit('messages ack', {
    //   uuid: message.uuid,
    //   to: message.to,
    //   status: message.status,
    // });
  });
};
