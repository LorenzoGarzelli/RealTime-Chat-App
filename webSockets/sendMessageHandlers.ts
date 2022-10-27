import { Server, Socket } from 'socket.io';

export default (io: Server, socket: Socket) => {
  socket.on('chat message', ({ content, to, timestamp }) => {
    //.to(socket.userID)
    //TODO Implement message saving on Redis
    socket.to(to).emit('chat message', {
      content,
      timestamp,
      //@ts-ignore
      from: socket.roomId,
    });
  });
};
