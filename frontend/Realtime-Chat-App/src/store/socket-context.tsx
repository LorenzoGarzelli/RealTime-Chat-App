import React from 'react';
import { io } from 'socket.io-client';
import { MessageReceived } from '../types';
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
socket.on('session', async data => {
  const messages: Array<MessageReceived> = data.messages;
  const usernames = new Map<string, string>();

  const getUsername = async (userRoomId: string) => {
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

  await (async () => await db.open())();
  let userId;
  for (let message of messages) {
    userId = await getUsername(message.from);
    db.table(`chat-${userId}`).add({
      uuid: message.uuid,
      // timestamp: message.timestamp,
      timestamp: Date.now(),
      content: message.content,
      type: 'received',
      status: 'to read',
    });
  }

  //socket.emit('messages ack', { messages: messages });
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
});

export const SocketContext = React.createContext(socket);
