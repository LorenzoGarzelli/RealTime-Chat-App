import { Link, useParams } from "react-router-dom";
import UserBadge from "./UserBadge";
import styles from "./UserChat.module.css";
import { motion } from "framer-motion";
import { useContext, useEffect, useId, useRef, useState } from "react";
import Message from "./Message";
import { SocketContext } from "../../store/socket-context";
import { DBController, Message as MessageData } from "../../util/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffectOnce } from "../../hooks/use-effect-once";
import { MessageSent } from "../../types";
import { keyStore } from "../../util/KeyStore";

const UserChat = () => {
  const { userId } = useParams<string>();
  const socket = useContext(SocketContext);
  const messageInput = useRef<HTMLInputElement>(null);
  const [isSendable, setIsSendable] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [messagesList, setMessagesList] = useState<JSX.Element[]>([]);
  const chatFeedRef = useRef<HTMLDivElement>(null);

  useLiveQuery(async () => {
    try {
      const res: MessageData[] = await DBController.getChatMessagesByFriendId(
        userId!
      );

      if (res.length > 0) {
        setMessagesList(
          res.map((message) => <Message message={message} key={message.id} />)
        );
      }
    } catch (err) {
      console.log("THIS", err);
    }
  }, []);

  const inputChangeHandler = () => {
    if (
      messageInput.current?.value.length &&
      messageInput.current?.value.trim().length > 0
    )
      return setIsSendable(true);

    setIsSendable(false);
  };

  const sendMessage = (message: MessageSent, resent = false) => {
    socket.emit("chat message", message, (res: any) => {
      //? update message status once server received it
      DBController.updateChatMessageStatus(userId!, message.uuid, {
        status: "sent",
        resent_timestamp: resent ? Date.now() + "" : undefined,
      });
    });
  };

  const handleMessageSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();
    if (!isSendable) return;

    const messageTxt = messageInput.current!.value;
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();

    const message: MessageData = {
      uuid: uuid,
      timestamp: timestamp + "",
      content: messageTxt,
      type: "sent",
      status: "sending",
    };

    await DBController.saveMessage(message, userId!);
    const roomId = (await DBController.getFriendById(userId!)).roomId;

    const encryptedMessage = await keyStore.encrypt(messageTxt, userId!);

    const messageToSend: MessageSent = {
      to: roomId,
      uuid: uuid,
      content: encryptedMessage,
      timestamp: timestamp + "",
    };

    sendMessage(messageToSend);
  };

  useEffectOnce(() => {
    const sendAcks = async () => {
      const messages: Array<MessageData> = await DBController.getMessagesToRead(
        userId!
      );

      const userRoomId = (await DBController.getFriendById(userId!)).roomId;

      for (let msg of messages) {
        socket.emit(
          "messages ack",
          {
            uuid: msg.uuid,
            status: "read",
            to: userRoomId,
          },
          (res: any) => {
            DBController.updateChatMessageStatus(userId!, msg.uuid, {
              status: "read",
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
      const messages: Array<MessageData> =
        await DBController.getMessagesToResend(userId!);
      console.log("TO RESEND", messages);
      messages?.forEach((msg) => sendMessage({ ...msg, to: "" }, true));
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
        //? Element is in the viewport
      } else {
        //? Element is NOT in the viewport
        if (!isMounted) {
          chatFeedRef.current?.scrollIntoView();
          setIsMounted(true);
        } else
          chatFeedRef.current?.scrollIntoView({
            behavior: "smooth",
          });
      }
    }
  }, [messagesList, chatFeedRef]);

  return (
    <motion.div
      className={styles["container"]}
      initial={{ x: window.innerWidth }}
      animate={{ x: 0, transition: { duration: 0.1 } }}
      exit={{ x: window.innerWidth, transition: { duration: 0.1 } }}
    >
      <div className={styles["header"]}>
        <Link to="/chats">
          <i className="back-btn uil uil-angle-left-b"></i>
        </Link>
        <UserBadge />
      </div>
      <main className={styles.messagesContainer}>
        {messagesList}
        <div className="FEED" ref={chatFeedRef} />
      </main>
      <div className={styles["input-bar"]}>
        {/* <i className="input-bar__paper-clip-icon uil uil-paperclip"></i> */}
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
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <i className={"input-bar__send-msg-icon uil uil-message"}></i>
              </motion.div>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default UserChat;
