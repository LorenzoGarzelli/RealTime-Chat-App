import { Server, Socket } from 'socket.io';

export default (io: Server, socket: Socket) => {
  socket.on('chat message', ({ content, to }) => {
    console.log('TO' + to);
    //@ts-ignore
    socket.to(to).to(socket.userID).emit('chat message', {
      content,
      //@ts-ignore
      from: socket.userID,
    });
  });
};
