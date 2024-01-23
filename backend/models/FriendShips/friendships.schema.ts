import { Schema } from 'mongoose';
import { FriendShips } from './friendships.types';

const FriendShipsSchema = new Schema<FriendShips>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
    friends: [
      {
        type: {
          from: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            unique: false,
            sparse: true,
          },
          user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            unique: false,
            sparse: true,
          },
          PBK: Object,

          status: {
            type: String,
            enum: ['bonded', 'pending'],
            default: 'pending',
          },
        },

        default: [],
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

FriendShipsSchema.pre(/^find/, function (next) {
  //@ts-ignore
  this.populate({ path: 'friends.user', select: 'roomId name' });
  next();
});

export default FriendShipsSchema;
