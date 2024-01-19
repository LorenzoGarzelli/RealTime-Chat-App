import { Server, Socket } from 'socket.io';
import { ClientSocket, KeysSharing } from '../types/types';

export default (io: Server, socket: ClientSocket) => {
  socket.on('keySharing', (message: KeysSharing) => {
    message.from = socket.roomId;
    socket.to(message.to).emit('keySharing', message);
  });
};
