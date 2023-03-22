import { Link, useParams } from 'react-router-dom';
import UserBadge from './UserBadge';
import styles from './UserChat.module.css';
import { motion } from 'framer-motion';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import Message from './Message';
import { SocketContext } from '../../store/socket-context';
import { db, Message as MessageData, User } from '../../util/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffectOnce } from '../../hooks/use-effect-once';
import { MessageSent } from '../../types';
import {
  decrypt,
  encrypt,
  generateKeyPair,
  getSharedKey,
} from '../../util/e2e';

const UserChat = () => {
  //TODO Setting Redis TTL back to 86394
  //const MESSAGE_TTL = 86394; //TODO put in env file
  const MESSAGE_TTL = 30;
  const { userId } = useParams<string>();

  const socket = useContext(SocketContext);
  const messageInput = useRef<HTMLInputElement>(null);
  const [isSendable, setIsSendable] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [messagesList, setMessagesList] = useState<JSX.Element[]>([]);

  const chatFeedRef = useRef<HTMLDivElement>(null);

  const messages = useLiveQuery(
    async () => {
      try {
        await (async () => await db.open())();

        const res: MessageData[] = await db
          //.table('chat-635ae80c297c2c057ce2c495')
          .table(`chat-${userId}`)
          .toArray();
        if (res.length > 0) {
          setMessagesList(
            res.map(message => <Message message={message} key={message.id} />)
          );
        }
      } catch (err) {
        console.log('THIS', err);
        console.log(db);
        db.close();
        db.open();
      }
      //TODO Check if i can change dependency
    },
    [
      /*db.verno*/
    ]
  );
  const inputChangeHandler = () => {
    if (messageInput.current?.value.length) return setIsSendable(true);

    setIsSendable(false);
  };

  const sendMessage = (message: MessageSent, resent = false) => {
    //? sending message to user
    socket.emit(
      'chat message',
      {
        to: '816ccbc9-e281-40f8-a189-c82b79bedc5f',
        uuid: message.uuid,
        content: message.content,
        timestamp: message.timestamp,
      },
      //? update message status once server received it
      (res: any) => {
        db.table(`chat-${userId}`)
          .where('uuid')
          .equals(message.uuid)
          .modify({
            status: 'sent',
            resent_timestamp: resent ? Date.now() + '' : undefined,
          });
      }
    );
  };

  const handleMessageSubmit: React.FormEventHandler<
    HTMLFormElement
  > = event => {
    event.preventDefault();
    if (
      !messageInput.current?.value.length ||
      messageInput.current?.value.trim().length <= 0
    )
      return;

    const messageTxt = messageInput.current?.value;
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    console.log(db);

    const message: MessageData = {
      uuid: uuid,
      timestamp: timestamp + '',
      content: messageTxt,
      type: 'sent',
      status: 'sending',
    };
    //? storing message in local-DB
    db.table(`chat-${userId}`).add(message);

    const messageToSend: MessageSent = {
      to: '816ccbc9-e281-40f8-a189-c82b79bedc5f',
      uuid: uuid,
      content: messageTxt,
      timestamp: timestamp + '',
    };
    //? sending message to user
    sendMessage(messageToSend);

    /*socket.emit(
      'chat message',
      {
        to: '816ccbc9-e281-40f8-a189-c82b79bedc5f',
        uuid: uuid,
        content: messageTxt,
        timestamp: timestamp,
      },
      //? update message status once server received it
      (res: any) => {
        db.table(`chat-${userId}`)
          .where('uuid')
          .equals(uuid)
          .modify({ status: 'sent' });
      }
    );*/
  };

  useEffectOnce(() => {
    (async () => {
      const keys = await generateKeyPair();
      const shared = await getSharedKey(keys.publicKeyJwk, keys.privateKeyJwk);
      console.log('SHARED', shared);
      const key = await window.crypto.subtle.importKey(
        'jwk',
        shared,
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
      const cipherText = await encrypt('ciao', key);
      console.log('ENCRYPT TEXT:', cipherText);
      const plainText = await decrypt(cipherText, key);
      console.log('PLAIN TEXT:', plainText);
    })();
  });

  //? Sending Ack on page mounts
  useEffectOnce(() => {
    const sendAcks = async () => {
      await (async () => await db.open())();

      const messages: Array<MessageData> = await db
        .table(`chat-${userId}`)
        .where('type')
        .equals('received')
        .and((msg: MessageData) => msg.status == 'to read')
        .toArray();

      const userRoomId = await db
        .table('friends')
        .where('_id')
        //@ts-ignore
        .equals(userId)
        .toArray()
        .then((res: Array<User>) => res[0].roomId);

      for (let msg of messages) {
        socket.emit(
          'messages ack',
          {
            uuid: msg.uuid,
            status: 'read',
            to: userRoomId,
          },
          (res: any) => {
            db.table(`chat-${userId}`)
              .where('uuid')
              .equals(msg.uuid)
              .modify({ status: 'read' });
          }
        );
      }
    };
    sendAcks();
  });

  //? Resending non delivered messages
  useEffectOnce(() => {
    const resendMessages = async () => {
      await (async () => await db.open())();
      const messages: Array<MessageData> = await db
        .table(`chat-${userId}`)
        .where('type')
        .equals('sent')
        .and(
          (msg: MessageData) =>
            (msg.status == 'sent' || msg.status == 'sending') &&
            (Date.now() - +msg.timestamp) / 1000 >= MESSAGE_TTL &&
            msg?.resent_timestamp == undefined
        )
        .toArray();

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

        //TODO Fux auto scrolling

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
