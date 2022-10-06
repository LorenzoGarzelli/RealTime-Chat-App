import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { app } from './app';

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
