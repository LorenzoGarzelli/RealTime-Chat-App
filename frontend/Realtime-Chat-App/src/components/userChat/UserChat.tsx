import { Link } from 'react-router-dom';
import UserBadge from './UserBadge';
import styles from './UserChat.module.css';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';

const UserChat = () => {
  //TODO IMPLEMENT index DB

  const messageInput = useRef<HTMLInputElement>(null);
  const [isSendable, setIsSendable] = useState(false);

  const inputChangeHandler = () => {
    if (messageInput.current?.value.length) return setIsSendable(true);

    setIsSendable(false);
  };

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
      <main></main>
      <div className={styles['input-bar']}>
        <i className="input-bar__paper-clip-icon uil uil-paperclip"></i>
        <form>
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
