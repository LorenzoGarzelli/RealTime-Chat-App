import { ObjectId } from 'mongoose';

interface FriendShip {
  _id: ObjectId;
  from: ObjectId;
  status: string;
}

export interface FriendShips {
  user: ObjectId;
  friends: Array<FriendShip>;
}
