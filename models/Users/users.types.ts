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
  role: string;
  //friends?: ObjectId[];
}

export interface User {}
