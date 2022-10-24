import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server, Socket } from 'socket.io';
import sendMessageHandlers from './webSockets/sendMessageHandlers';

import { app } from './app';
import initializeConnection from './webSockets/initializeConnection';
import { randomUUID } from 'crypto';

dotenv.config({ path: './config.env' });

const DB_uri = process.env.DATABASE!.replace(
  '<password>',
  process.env.DATABASE_PASSWORD!
);

let database: mongoose.Connection;

mongoose.connect(DB_uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as mongoose.ConnectOptions);

database = mongoose.connection;

database.once('open', async () => {
  console.log('Connected to database🔥');
});
database.once('error', async () => {
  console.log('⚠️ Error connecting to database❌');
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
const io = new Server(server);

io.use((socket: Socket, next) => {
  //const userID = socket.handshake.auth.userID;
  console.log(socket.handshake.headers);
  const userID = socket.handshake.headers.userid;
  if (userID) {
    console.log(userID);
    //@ts-ignore
    socket.userID = userID;
    return next();
  }
  //@ts-ignore
  socket.userID = randomUUID();

  next();
});

const OnConnection = (socket: Socket) => {
  initializeConnection(io, socket);
  sendMessageHandlers(io, socket);
  io.emit('Welcome', 'Benvenuto');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
};
//TODO Implement Socket Io Auth
io.on('connection', OnConnection);

process.on('unhandledRejection', (err: Error) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down ...');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED');
  server.close(() => {
    console.log('Process terminated');
  });
});

// process.on('SIGINT', () => {
//   console.log('SIGINT RECEIVED');
//   server.close(() => {
//     console.log('Process terminated');
//   });

//   process.kill(process.pid, 'SIGINT');
// });
