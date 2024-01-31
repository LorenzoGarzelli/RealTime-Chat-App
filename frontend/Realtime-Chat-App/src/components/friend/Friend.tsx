import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import classes from "./Friend.module.css";
import { DBController, Message, User } from "../../util/db";
import MultipleGrayTick from "../../assets/MultipleGrayTick";
import MultipleBlueTick from "../../assets/MultipleBlueTick";
import SingleGrayTick from "../../assets/SingleGrayTick";

const Friend: React.FC<{ user: User }> = (props) => {
  //TODO add last message Preview
  const { user } = props;

  const [lastMessageSent, setLastMessageSent] = useState<Message>();
  const [lastMessageTime, setLastMessageTime] = useState("");

  const getLastMessageDate = (message: Message) => {
    let date = new Date(Number(message.timestamp));
    date.setDate(date.getDate());

    if (isToday(date)) {
      const time = date.toLocaleTimeString(navigator.language, {
        hour: "2-digit",
        minute: "2-digit",
      });
      return time;
    } else if (isDateInCurrentWeek(date)) {
      const weekDay = date.toLocaleDateString(navigator.language, {
        weekday: "long",
      });
      return weekDay;
    } else {
      const dateString = date.toLocaleDateString(navigator.language, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });

      return dateString;
    }
  };

  const isDateInCurrentWeek = (date: Date) => {
    const currentDate = new Date();

    const firstDayOfWeek = new Date(
      currentDate.setDate(currentDate.getDate() - (currentDate.getDay() - 1))
    );
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(0, 0, 0, 0);

    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  };
  const isToday = (date: Date) => {
    const today = new Date();

    if (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    ) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    const updateLastMessage = async () => {
      const message = await DBController.getLastChatMessage(user._id);
      setLastMessageSent(message);
    };

    updateLastMessage();
  }, []);

  return (
    <div className={classes.container}>
      <img
        src="./../../../user.png"
        alt=""
        className={`${classes["profile-img"]} skeleton`}
      />
      <div className={classes["contact-box"]}>
        <h2 className={classes["contact-name"] + "skeleton"}>{user.name}</h2>
        <span className={classes["last-message-preview"]}>
          {lastMessageSent && lastMessageSent.content}
        </span>
        {lastMessageSent && lastMessageSent.type == "sent" && (
          <span className={classes.tick}>
            {lastMessageSent.status == "to read" && MultipleGrayTick()}
            {lastMessageSent.status == "read" && MultipleBlueTick()}
            {
              lastMessageSent.status == "sending" && "load" //TODO Add Loading icon (like WhatsApp)
            }
            {lastMessageSent.status == "sent" && SingleGrayTick()}
          </span>
        )}
      </div>
      <span className={classes["last-message-timestamp"]}>
        {lastMessageSent && getLastMessageDate(lastMessageSent)}
      </span>
    </div>
  );
};

export default Friend;
