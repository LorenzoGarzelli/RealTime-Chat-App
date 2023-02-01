import React from 'react';
import { io } from 'socket.io-client';
import { MessageReceived, MessageAck } from '../types';
import { User, db, Message as MessageData } from './../util/db';
// import { useQuery } from 'react-query';
export const socket = io('http://localhost:8000', {
  transports: ['websocket'],
  auth: {
    token: localStorage.getItem('token'),
  },
  extraHeaders: {
    userId: localStorage.getItem('roomId')!,
  },
});

const usernames = new Map<string, string>();

const getUserId = async (userRoomId: string) => {
  if (usernames.has(userRoomId)) return usernames.get(userRoomId);

  const user: Array<User> = await db
    .table('friends')
    .where('roomId')
    .equals(userRoomId)
    .toArray();

  if (user.length < 0) console.error('ERRORE'); //TODO To Handle
  usernames.set(userRoomId, user[0]._id);
  return user[0]._id;
  // fetching the username
};
socket.on('session', async data => {
  const messages: Array<MessageReceived> = data.messages;

  await (async () => await db.open())();
  let userId;
  messages.map(msg => (msg.status = 'to read'));
  for (let message of messages) {
    userId = await getUserId(message.from);
    db.table(`chat-${userId}`)
      .add({
        uuid: message.uuid,
        // timestamp: message.timestamp,
        timestamp: Date.now(),
        content: message.content,
        type: 'received',
        status: 'to read',
      })
      .then(() => {
        socket.emit('messages ack', message);
      });
  }
});
socket.on('error', error => {
  console.error('Connection Error');
  //TODO Handle Connection Error
});

socket.on('chat message', (data: MessageReceived) => {
  console.log(data);

  const message: MessageData = {
    uuid: data.uuid,
    timestamp: data.timestamp,
    content: data.content,
    type: 'received',
    status: 'to read',
  };
  db.table('chat-635ae80c297c2c057ce2c495').add({
    ...message,
  });

  socket.emit('messages ack', {
    uuid: data.uuid,
    to: data.to,
    from: data.from,
    status: 'to read',
  });
});

socket.on('messages ack', async (ack: MessageAck) => {
  const userId = await getUserId(ack.to);

  await (async () => await db.open())();
  await db
    .table(`chat-${userId}`)
    .where('uuid')
    .equals(ack.uuid)
    .and((msg: MessageData) => msg.status !== 'read')
    .modify({ status: ack.status });
});

export const SocketContext = React.createContext(socket);
