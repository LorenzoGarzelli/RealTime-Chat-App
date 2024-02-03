// import moment from 'moment';
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DBController, Message as MessageData, User } from "../../util/db";
import styles from "./Message.module.css";
import MultipleBlueTick from "../../assets/MultipleBlueTick";
import SingleGrayTick from "../../assets/SingleGrayTick";
import MultipleGrayTick from "../../assets/MultipleGrayTick";
import PendingMessageIcon from "../../assets/PendingMessageIcon";

const Message: React.FC<{ message: MessageData }> = ({ message }) => {
  const { userId } = useParams();
  const [name, setName] = useState("");

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString(navigator.language, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
                {message.status == "sending" && PendingMessageIcon()}
                {message.status == "sent" && SingleGrayTick()}
              </span>
            )}
            <span className={styles.timestamp}>{`${formatDateTime(
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
