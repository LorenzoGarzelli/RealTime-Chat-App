import { model } from 'mongoose';
import { User } from './users.types';
import UserSchema from './users.schema';

export const UserModel = model<User>('User', UserSchema);

// //TODO https://www.geeksforgeeks.org/how-to-make-mongo-schema-from-pure-typescript-classes/
