import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server, Socket } from 'socket.io';
import sendMessageHandler from './webSockets/sendMessageHandler';
import { app } from './app';
import initializeConnection from './webSockets/initializeConnection';
import authenticationMiddleware from './webSockets/middlewares';
import messageAckHandler from './webSockets/messageAckHandler';
import ackReceivedHandler from './webSockets/ackReceivedHandler';
import keySharingHandler from './webSockets/keySharingHandler';
import { ClientSocket } from './types/types';

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
  const clientSocket = socket as ClientSocket;
  if (!clientSocket.roomId) return; //TODO handle websocket errors

  initializeConnection(io, clientSocket);
  sendMessageHandler(io, clientSocket);
  keySharingHandler(io, clientSocket);
  messageAckHandler(io, clientSocket);
  ackReceivedHandler(io, clientSocket);

  clientSocket.on('disconnect', () => {
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
