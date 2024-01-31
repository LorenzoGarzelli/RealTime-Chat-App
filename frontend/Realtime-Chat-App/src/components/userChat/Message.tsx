// import moment from 'moment';
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DBController, Message as MessageData, User } from "../../util/db";
import styles from "./Message.module.css";
import MultipleBlueTick from "../../assets/MultipleBlueTick";
import SingleGrayTick from "../../assets/SingleGrayTick";
import MultipleGrayTick from "../../assets/MultipleGrayTick";

const Message: React.FC<{ message: MessageData }> = ({ message }) => {
  const { userId } = useParams();
  const [name, setName] = useState("");

  const timeFormat = (date: Date) => {
    function formatTwoDigits(n: number) {
      return n < 10 ? "0" + n : n;
    }
    let hours = formatTwoDigits(date.getHours());
    let minutes = formatTwoDigits(date.getMinutes());
    return hours + ":" + minutes;
  };

  const getUserFromMessage = () => {
    if (message.type == "sent") return setName("You");

    if (userId)
      DBController.getFriendById(userId!).then((friend) =>
        setName(friend.name)
      );
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
            {message.type == "sent" && (
              <span className={styles.tick}>
                {message.status == "to read" && MultipleGrayTick()}
                {message.status == "read" && MultipleBlueTick()}
                {
                  message.status == "sending" && "load" //TODO Add Loading icon (like WhatsApp)
                }
                {message.status == "sent" && SingleGrayTick()}
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
