import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, useTransition } from "react";
import { User, DBController } from "../util/db";
import { Friend } from "./../types";
import { keyStore } from "../util/KeyStore";
import { useNavigate } from "react-router-dom";

export default function useFriends() {
  const navigate = useNavigate();
  const [friendsList, setFriendsList] = useState<Array<User>>([]);
  const url = "api/v1/users/friends";

  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const friends: User[] = await DBController.getFriends();

        setFriendsList(friends);
      } catch (err) {
        console.error(err);
      }
    };
    const updateLocalData = async () => {
      try {
        const response = await fetch(url, { credentials: "include" });
        const { data } = await response.json();
        const { friends } = data;
        const updatedFriendsList = [];

        for (let friend of friends as Friend[]) {
          if (friend.PBK)
            keyStore.storeReceivedKey(JSON.parse(friend.PBK), friend.user._id);
          updatedFriendsList.push(friend.user);
        }
        setFriendsList(updatedFriendsList);
      } catch (error) {
        console.error(error);
      }
    };
    loadLocalData();
    updateLocalData();
  }, []);

  //? Updating local friends data
  useEffect(() => {
    if (friendsList.length > 0) {
      friendsList.forEach((user: User) => {
        DBController.saveFriend(user);
        DBController.addChatStore(`chat-${user._id}`);
      });
    }
  }, [friendsList]);

  return friendsList;
}
