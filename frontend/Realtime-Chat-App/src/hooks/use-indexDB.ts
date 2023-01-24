import { memo, useEffect, useState } from 'react';
import IndexDB from '../util/indexDB';

interface User {
  _id: string;
  name: string;
  roomId: string;
  id: string;
}

const useIndexDB = () => {
  // const indexDb =
  /*
  const indexDb = new IndexDB('chat-app');

  useEffect(() => {
    const runIndexDb = async () => {
      //? Friends documents initializations

      await indexDb?.createObjectStore(['friends']);
      //await indexDb?.createObjectStore(['chat']);
      //await indexDb.putValue('chat', { id: '123', message: '123' });

      // await indexDb?.putValue('friends', {
      //   id: '633dde86865b2d2107f07bef',
      //   name: 'prova',
      // });
      //   await indexDb.getValue('friends', '633dde86865b2d2107f07bef');
      //? Chats documents initializations
      const res: User[] = await indexDb.getAllValue('friends');

      if (res.length > 0) {
        const chatsDocumentsNames = res.map(user => `chat-${user._id}`);

        await indexDb.addNewObjectStore(chatsDocumentsNames);
      }
    };
    runIndexDb();
  }, []);
  return indexDb;*/
};

export default useIndexDB;
