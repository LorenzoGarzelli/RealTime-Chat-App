import { Link, useParams } from 'react-router-dom';
import UserBadge from './UserBadge';
import styles from './UserChat.module.css';
import { motion } from 'framer-motion';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import Message from './Message';
import { SocketContext } from '../../store/socket-context';
import {
  DBController,
  KeysPairs,
  Message as MessageData,
  User,
} from '../../util/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffectOnce } from '../../hooks/use-effect-once';
import { MessageSent } from '../../types';
import { keyStore } from '../../util/KeyStore';

const UserChat = () => {
  //TODO Setting Redis TTL back to 86394
  //const MESSAGE_TTL = 86394; //TODO put in env file

  const { userId } = useParams<string>();

  const socket = useContext(SocketContext);
  const messageInput = useRef<HTMLInputElement>(null);
  const [isSendable, setIsSendable] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [messagesList, setMessagesList] = useState<JSX.Element[]>([]);

  const chatFeedRef = useRef<HTMLDivElement>(null);

  const messages = useLiveQuery(async () => {
    try {
      //        await (async () => await DBController.db.open())();

      const res: MessageData[] = await DBController.getChatMessagesByFriendId(
        userId!
      );

      if (res.length > 0) {
        setMessagesList(
          res.map(message => <Message message={message} key={message.id} />)
        );
      }
    } catch (err) {
      console.log('THIS', err);
    }
  }, []);
  const inputChangeHandler = () => {
    if (messageInput.current?.value.length) return setIsSendable(true);

    setIsSendable(false);
  };

  const sendMessage = (message: MessageSent, resent = false) => {
    //? sending message to user
    socket.emit(
      'chat message',
      message,
      //? update message status once server received it
      (res: any) => {
        DBController.updateChatMessageStatus(userId!, message.uuid, {
          status: 'sent',
          resent_timestamp: resent ? Date.now() + '' : undefined,
        });
      }
    );
  };

  const handleMessageSubmit: React.FormEventHandler<
    HTMLFormElement
  > = async event => {
    event.preventDefault();
    if (
      !messageInput.current?.value.length ||
      messageInput.current?.value.trim().length <= 0
    )
      return;

    const messageTxt = messageInput.current?.value;
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();

    const message: MessageData = {
      uuid: uuid,
      timestamp: timestamp + '',
      content: messageTxt,
      type: 'sent',
      status: 'sending',
    };
    //? storing message in local-DB
    DBController.saveMessage(message, userId!);
    const roomId = (await DBController.getFriendById(userId!)).roomId;

    const encryptedMessage = await keyStore.encrypt(messageTxt, userId!);

    const messageToSend: MessageSent = {
      to: roomId,
      uuid: uuid,
      content: encryptedMessage,
      timestamp: timestamp + '',
    };
    //? sending message to user

    sendMessage(messageToSend);
  };

  // useEffectOnce(() => {
  //   (async () => {
  //     //TODO Share Generated PBK
  //     // const keys = await generateKeyPair();
  //     //console.log('SHARED', shared);
  //     //const entry = {
  //     //  _id: '635ae80c297c2c057ce2c495',
  //     //  PBK: keys.publicKeyJwk,
  //     //  PVK: keys.privateKeyJwk,
  //     //};
  //     //db.table(`keys`).add(entry);
  //     await (async () => await db.open())();

  //     const keys: KeysPairs = (
  //       await db
  //         .table('keys')
  //         .where('_id')
  //         .equals('635ae80c297c2c057ce2c495')
  //         .toArray()
  //     )[0];

  //     console.log('KEYS:', keys);

  //     //TODO Obtain Friend Generated PBK, and compute shared key
  //     //const shared = await keyStore.getSharedKey(keys.PBK, keys.PVK);
  //     /* const key = await window.crypto.subtle.importKey(
  //       'jwk',
  //       shared,
  //       {
  //         name: 'AES-GCM',
  //         length: 256,
  //       },
  //       true,
  //       ['encrypt', 'decrypt']
  //     );*/

  //     const text = 'hello😎';

  //     console.time('ENCRYPTION');
  //     //@ts-ignore
  //     const cipherText = await keyStore.encrypt(text, userId);
  //     console.timeEnd('ENCRYPTION');

  //     console.log('ENCRYPT TEXT:', cipherText);
  //     console.time('DECRYPTION');
  //     //@ts-ignore
  //     const plainText = await keyStore.decrypt(cipherText, userId);
  //     console.timeEnd('DECRYPTION');
  //     console.log('PLAIN TEXT:', plainText);
  //   })();
  // });

  //? Sending Ack on page mounts
  useEffectOnce(() => {
    const sendAcks = async () => {
      //await (async () => await DBController.db.open())();

      const messages: Array<MessageData> = await DBController.getMessagesToRead(
        userId!
      );

      const userRoomId = (await DBController.getFriendById(userId!))._id;

      for (let msg of messages) {
        socket.emit(
          'messages ack',
          {
            uuid: msg.uuid,
            status: 'read',
            to: userRoomId,
          },
          (res: any) => {
            DBController.updateChatMessageStatus(userId!, msg.uuid, {
              status: 'read',
            });
          }
        );
      }
    };
    sendAcks();
  });

  //? Resending non delivered messages
  useEffectOnce(() => {
    const resendMessages = async () => {
      //await (async () => await DBController.db.open())();
      const messages: Array<MessageData> =
        await DBController.getMessagesToResend(userId!);
      console.log('TO RESEND', messages);
      messages?.forEach(msg => sendMessage({ ...msg, to: '' }, true));
    };
    resendMessages();
  });

  //? Auto-scrolling down on messages
  useEffect(() => {
    if (chatFeedRef && messagesList.length > 0) {
      let bounding = chatFeedRef.current!.getBoundingClientRect();
      if (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.right <= window.innerWidth &&
        bounding.bottom <= window.innerHeight
      ) {
        // console.log('Element is in the viewport!');
      } else {
        // console.log('Element is NOT in the viewport!');

        //TODO Fix auto scrolling

        if (!isMounted) {
          chatFeedRef.current?.scrollIntoView();
          setIsMounted(true);
        } else
          chatFeedRef.current?.scrollIntoView({
            behavior: 'smooth',
          });
      }
    }
  }, [messagesList, chatFeedRef]);

  return (
    <motion.div
      className={styles['container']}
      initial={{ x: window.innerWidth }}
      animate={{ x: 0, transition: { duration: 0.1 } }}
      exit={{ x: window.innerWidth, transition: { duration: 0.1 } }}
    >
      <div className={styles['header']}>
        <Link to="/chats">
          <i className="back-btn uil uil-angle-left-b"></i>
        </Link>
        <UserBadge />
      </div>
      <main className={styles.messagesContainer}>
        {messagesList}
        <div className="FEED" ref={chatFeedRef} />
      </main>
      <div className={styles['input-bar']}>
        <i className="input-bar__paper-clip-icon uil uil-paperclip"></i>
        <form onSubmit={handleMessageSubmit}>
          <input
            type="text"
            ref={messageInput}
            onChange={inputChangeHandler}
            placeholder="Write a message ..."
          ></input>
          <button>
            {isSendable && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <i className={'input-bar__send-msg-icon uil uil-message'}></i>
              </motion.div>
            )}
          </button>
        </form>
        <i className="input-bar__emoji-icon uil uil-grin"></i>
      </div>
    </motion.div>
  );
};

export default UserChat;
