// import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DBController, Message as MessageData, User } from '../../util/db';
import styles from './Message.module.css';

const Message: React.FC<{ message: MessageData }> = ({ message }) => {
  const { userId } = useParams();
  const [name, setName] = useState('');

  const timeFormat = (date: Date) => {
    function formatTwoDigits(n: number) {
      return n < 10 ? '0' + n : n;
    }
    let hours = formatTwoDigits(date.getHours());
    let minutes = formatTwoDigits(date.getMinutes());
    return hours + ':' + minutes;
  };

  const getUserFromMessage = () => {
    if (message.type == 'sent') return setName('You');

    if (userId)
      DBController.getFriendById(userId!).then(friend => setName(friend.name));
  };
  useEffect(() => {
    getUserFromMessage();
  }, []);

  return (
    <div className={styles.container}>
      <img className={styles.profileImg} src="./../../../user.png" />
      <div>
        <div className={styles.header}>
          <span className={styles.username}>{name}</span>
          <div>
            {message.type == 'sent' && (
              <span className={styles.tick}>
                {message.status == 'to read' && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="15"
                    id="msg-dblcheck-ack"
                    x="2063"
                    y="2076"
                  >
                    <path
                      d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                      fill="#9a9a9ab6"
                    ></path>
                  </svg>
                )}
                {message.status == 'read' && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="15"
                    id="msg-dblcheck-ack"
                    x="2063"
                    y="2076"
                  >
                    <path
                      d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                      fill="#4fc3f7"
                      //fill="#9a9a9ab6"
                    ></path>
                  </svg>
                )}
                {
                  message.status == 'sending' && 'load' //TODO Add Loading icon (like WhatsApp)
                }
                {message.status == 'sent' && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="15"
                    id="msg-single-check-ack"
                    x="2063"
                    y="2076"
                  >
                    <path
                      d="M 15.01 3.316 z m -4.1 0 l -0.478 -0.372 a 0.365 0.365 0 0 0 -0.51 0.063 L 4.566 9.88 a 0.32 0.32 0 0 1 -0.484 0.032 L 1.892 7.77 a 0.366 0.366 0 0 0 -0.516 0.005 l -0.423 0.433 a 0.364 0.364 0 0 0 0.006 0.514 l 3.255 3.185 a 0.32 0.32 0 0 0 0.484 -0.033 l 6.272 -8.048 a 0.365 0.365 0 0 0 -0.063 -0.51 z"
                      //fill="#4fc3f7"
                      fill="#9a9a9ab6"
                    ></path>
                  </svg>
                )}
              </span>
            )}
            <span className={styles.timestamp}>{`${timeFormat(
              // new Date()
              new Date(+message.timestamp)
            )}`}</span>
          </div>
        </div>
        <p className={styles.content}>{message.content}</p>
      </div>
    </div>
  );
};

export default Message;
