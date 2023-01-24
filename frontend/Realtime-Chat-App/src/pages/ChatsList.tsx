import React, {
  memo,
  Suspense,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useLocation } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import DummyFriend from '../components/friend/DummyFriend';
// import FriendList from '../components/friendList/FriendList';
//import FriendList from '../components/friendList/FriendList';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import useUser from '../hooks/use-user';
const FriendList = React.lazy(
  () => import('../components/friendList/FriendList')
);

const ChatsList = () => {
  const { currentUser: user, isLoggedIn } = useUser({ redirectTo: '/login' });

  return (
    <>
      <Suspense fallback={<DummyFriend />}>
        <FriendList />
      </Suspense>
    </>
  );
};

export default ChatsList;
