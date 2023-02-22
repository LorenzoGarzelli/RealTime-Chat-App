import { Server, Socket } from 'socket.io';
import { Message, MessageAck } from '../types/types';
import redisMessageStore from '../utils/redisMessageStore';

export default (io: Server, socket: Socket) => {
  socket.on('received ack', async (messageUUID: string, callback) => {
    //@ts-ignore
    await redisMessageStore.deleteAckForUser(socket.roomId, messageUUID);

    //? Send Ack To User
    if (callback)
      callback({
        status: 'received from server',
      });
  });
};
