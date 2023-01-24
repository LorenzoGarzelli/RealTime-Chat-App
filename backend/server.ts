import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server, Socket } from 'socket.io';
import { createClient } from 'redis';

import sendMessageHandlers from './webSockets/sendMessageHandlers';
import { app } from './app';
import initializeConnection from './webSockets/initializeConnection';
import middlewareList from './webSockets/middlewares';

import messagesAck from './webSockets/messages-ack';

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

const pubClient = createClient({
  url: process.env.REDIS_DB_URL,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});
const subClient = pubClient.duplicate();

let io: Server;
//Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
io = new Server(server, { cors: { origin: 'http://localhost:5173' } }); //TODO Adjust cors policy

//? Socket Io
const OnConnection = (socket: Socket) => {
  initializeConnection(io, socket);
  sendMessageHandlers(io, socket);
  messagesAck(io, socket);
  io.emit('Welcome', 'Benvenuto');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
};

//? Loading middleware
middlewareList.forEach(mid => io.use(mid));

//TODO Implement Socket Io Auth
io.on('connection', OnConnection);
//});

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
