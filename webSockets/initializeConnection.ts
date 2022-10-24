import { Server, Socket } from 'socket.io';

export default (io: Server, socket: Socket) => {
  //@ts-ignore
  socket.join(socket.userID);
  socket.emit('session', {
    //@ts-ignore
    userId: socket.userID,
  });
};
