import { model } from 'mongoose';
import { FriendShips } from './friendships.types';
import FriendShipsSchema from './friendships.schema';

export const FriendShipsModel = model<FriendShips>(
  'FriendShips',
  FriendShipsSchema
);
