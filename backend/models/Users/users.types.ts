import { ObjectId } from 'mongoose';

export interface User {
  _id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  phoneNumberVerificationCode?: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordChangedAt?: Date;
  accountStatus: string;
  passwordResetToken: string | undefined;
  passwordResetExpires: Date | undefined;
  role: string;
  roomId: string;
}

export interface User {}
