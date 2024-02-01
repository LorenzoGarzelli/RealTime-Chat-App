import { model } from 'mongoose';
import { User } from './users.types';
import UserSchema from './users.schema';

export const UserModel = model<User>('User', UserSchema);
