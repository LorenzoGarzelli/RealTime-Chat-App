import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server, Socket } from 'socket.io';
import sendMessageHandlers from './webSockets/sendMessageHandlers';
import { app } from './app';
import initializeConnection from './webSockets/initializeConnection';
import authenticationMiddleware from './webSockets/middlewares';
import messageAck from './webSockets/message-ack';
import ackReceived from './webSockets/ack-received';
import keySharingHandler from './webSockets/keySharingHandler';

dotenv.config({ path: './config.env' });

let connectToDatabase: () => void = () => {
  const DB_uri = process.env.DATABASE!.replace(
    '<password>',
    process.env.DATABASE_PASSWORD!
  );

  mongoose.connect(DB_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as mongoose.ConnectOptions);

  let databaseConnection = mongoose.connection;

  databaseConnection.once('open', async () => {
    console.log('Connected to database🔥');
  });
  databaseConnection.once('error', async () => {
    console.log('⚠️ Error connecting to database❌');
  });
};

connectToDatabase();
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

let io: Server = new Server(server, {
  cors: { origin: 'https://localhost:5173' },
}); //TODO Adjust cors policy

//? Socket Io
const connectionHandler = (socket: Socket) => {
  initializeConnection(io, socket);
  sendMessageHandlers(io, socket);
  keySharingHandler(io, socket);
  messageAck(io, socket);
  ackReceived(io, socket);

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
};

io.use(authenticationMiddleware);
io.on('connection', connectionHandler);

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
