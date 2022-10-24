import { Schema } from 'mongoose';
import { FriendShips } from './friendships.types';

const FriendShipsSchema = new Schema<FriendShips>({
  user: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  friends: [
    {
      type: {
        from: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          unique: true,
          sparse: true,
        },
        status: {
          type: String,
          enum: ['bonded', 'pending'],
          default: 'pending',
        },
      },
      default: [],
    },
  ],
});

export default FriendShipsSchema;
