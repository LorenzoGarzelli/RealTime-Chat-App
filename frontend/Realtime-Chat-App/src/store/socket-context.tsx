import React from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MessageReceived, MessageAck, KeysSharing } from '../types';
import { keyStore } from '../util/KeyStore';
import {
  User,
  DBController,
  Message as MessageData,
  KeysPairs,
} from './../util/db';

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
  //TODO check for null return value
  if (usernames.has(userRoomId)) return usernames.get(userRoomId);

  const user = await DBController.getFriendByRoomId(userRoomId);

  console.log(user);

  usernames.set(userRoomId, user._id);
  return user._id;
  // fetching the username
};
socket.on('session', async data => {
  const messages: Array<MessageReceived> = data.messages;
  const acks: Array<MessageAck> = data.acks;

  //TODO need to delete?? await (async () => await DBController.db.open())();
  let userId;
  //messages.map(msg => (msg.status = 'to read'));
  //? Save received messages to local db
  if (messages)
    for (let message of messages) {
      userId = await getUserId(message.from);
      //TODO Create SaveMessageToDb Method

      const messageData: MessageData = {
        uuid: message.uuid,
        timestamp: message.timestamp,
        content: await keyStore.decrypt(message.content, userId!),
        type: 'received',
        status: 'to read',
      };
      await DBController.saveMessage(messageData, userId!);
      socket.emit('messages ack', message);
      socket.emit('messages ack', {
        uuid: message.uuid,
        to: message.from,
        from: message.to,
        status: 'to read',
      });
      /* db.table(`chat-${userId}`)
        .add({
          uuid: message.uuid,
          // timestamp: message.timestamp,
          timestamp: Date.now(),
          //content: message.content,
          content: keyStore.decrypt(message.content, userId!),
          type: 'received',
          status: 'to read',
        })
        .then(() => {
          socket.emit('messages ack', message);
        });*/
    }

  //? Save received acks to local db
  if (acks)
    for (let ack of acks) {
      userId = await getUserId(ack.from);
      await DBController.updateMessageStatusWithAck(userId!, ack);
      socket.emit('received ack', ack.uuid);
    }
});
socket.on('error', error => {
  console.error('Connection Error');
  //TODO Handle Connection Error
});

socket.on('chat message', async (data: MessageReceived) => {
  const path = window.location.href.split('/');
  const param = path[path.length - 1];
  console.log(data);
  const userId = await getUserId(data.from);

  const status = param == userId ? 'read' : 'to read';
  const message: MessageData = {
    uuid: data.uuid,
    timestamp: data.timestamp,
    content: await keyStore.decrypt(data.content, userId!),
    type: 'received',
    status: status,
  };

  DBController.saveMessage(message, userId!);

  socket.emit('messages ack', {
    uuid: data.uuid,
    to: data.from,
    from: data.to,
    status: status,
  });
});

socket.on('messages ack', async (ack: MessageAck) => {
  const userId = await getUserId(ack.from);
  await DBController.updateMessageStatusWithAck(userId!, ack);
  socket.emit('received ack', ack.uuid);
});

socket.on('keySharing', async (message: KeysSharing) => {
  const userId = await getUserId(message.from);
  keyStore.storeReceivedKey(message.PBK, userId!);

  let keyPair: KeysPairs = await DBController.getKeyPairsByFriendId(userId!);
  const friend: User = await DBController.getFriendById(userId!);
});

socket.on('connect', () => {
  //TODO re-send sending messages on reconnection
  console.log('RECONNECT');
});
export const SocketContext = React.createContext(socket);
