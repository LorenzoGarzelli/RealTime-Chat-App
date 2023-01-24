import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState, useTransition } from 'react';
import { User, db } from '../util/db';
import { Friend } from './../types';
//import useIndexDB from './use-indexDB';

export default function useFriends() {
  const [isLoading, setIsLoading] = useState(true);
  const [friendsList, setFriendsList] = useState<Array<User>>([]);
  const url = 'api/v1/users/friends';
  // const [isPending, startTransition] = useTransition();

  //const db = useIndexDB();
  useEffect(() => {
    const loadLocalData = async () => {
      // useLiveQuery(async () => {
      try {
        //const friends: User[] = await db.friends.toArray();
        const friends: User[] = await db.table('friends').toArray();
        setFriendsList(friends);
      } catch (err) {
        // console.error(err);
      }
    };
    const updateLocalData = async () => {
      try {
        const response = await fetch(url, { credentials: 'include' });
        const { data } = await response.json();
        let { friends } = data[0];
        friends = friends.map((friend: Friend) => friend.user);
        setFriendsList(friends);
      } catch (error) {
        //TODO Manage Error
      }
    };
    loadLocalData();
    // startTransition(() => {
    updateLocalData();
    // });
  }, []);

  //? Updating local friends data
  useEffect(() => {
    if (friendsList.length > 0) {
      //friendsList.forEach((user: User) => db.friends.add(user));
      friendsList.forEach((user: User) => db.table('friends').add(user));
      friendsList.forEach(user => db.addChatStore(`chat-${user._id}`));
    }
  }, [friendsList]);

  return friendsList;
}
