import React, { Suspense } from "react";
import DummyFriend from "../components/friend/DummyFriend";
import useUser from "../hooks/use-user";
const FriendList = React.lazy(
  () => import("../components/friendList/FriendList")
);

const ChatsList = () => {
  const { currentUser: user, isLoggedIn } = useUser({ redirectTo: "/login" });

  return (
    <>
      <Suspense fallback={<DummyFriend />}>
        <FriendList />
      </Suspense>
    </>
  );
};

export default ChatsList;
