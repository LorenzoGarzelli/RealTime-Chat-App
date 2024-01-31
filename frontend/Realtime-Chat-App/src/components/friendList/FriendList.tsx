import Friend from "../friend/Friend";
import classes from "./FriendList.module.css";
import { Link } from "react-router-dom";
import React, { memo, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { SocketContext } from "../../store/socket-context";
import useFriends from "../../hooks/use-friends";

const FriendList: React.FC<{}> = memo((props) => {
  const socket = useContext(SocketContext);
  const [friendsLinks, setFriendsLinks] = useState<JSX.Element[]>([]);

  const friends = useFriends();

  useEffect(() => {
    if (friends.length < 1) return;

    setFriendsLinks(
      friends.map((user) => (
        <Link
          to={`/chats/${user._id}`}
          key={user._id}
          className={classes["user-link"]}
        >
          <Friend user={user} />
        </Link>
      ))
    );
  }, [friends]);

  return (
    <div className={classes.container}>
      <ul className={classes["user-list"]}>
        <li>{friendsLinks}</li>
      </ul>
    </div>
  );
});

export default FriendList;
