import { Link, useParams } from 'react-router-dom';
import UserBadge from './UserBadge';
import styles from './UserChat.module.css';
import { motion } from 'framer-motion';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import Message from './Message';
import { SocketContext } from '../../store/socket-context';
import useIndexDB from '../../hooks/use-indexDB';
import { db, Message as MessageData } from '../../util/db';
import { getFormSubmissionInfo } from 'react-router-dom/dist/dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { findNumbers } from 'libphonenumber-js';

const UserChat = () => {
  const { userId } = useParams();

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
    /*.then(res =>
        console.log(
          db
            .table('chat-635ae80c297c2c057ce2c495')
            .where('id')
            .equals(res)
            .toArray()
            .then(res => {
              console.log('STORE', res);
            })
        )
      );*/

    socket.emit(
      'chat message',
      {
        to: '816ccbc9-e281-40f8-a189-c82b79bedc5f',
        uuid: uuid,
        content: messageTxt,
        timestamp: timestamp,
      },
      (res: any) => {
        db.table(`chat-${userId}`)
          .where('uuid')
          .equals(uuid)
          .modify({ status: 'sent' });
      }
    );
  };

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
            // block: 'end',
          });

        //@ts-ignore

        // chatFeedRef.current?.scrollIntoView();
      }
    }
  }, [messagesList]);

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
