import mongoose, { Schema } from 'mongoose';
import { User } from './users.types';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import { FriendShipsModel } from '../FriendShips/friendships.model';
import crypto, { randomUUID } from 'crypto';

const UserSchema = new Schema<User>(
  {
    name: String,
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },

    phoneNumber: {
      type: String,
      required: [true, 'Please provide your phone number'],
      unique: true,
      validate: [
        validator.isMobilePhone,
        'Please provide a valid mobileNumber phone',
      ],
    },
    phoneNumberVerificationCode: {
      type: String,
      required: false,
      select: false,
    },

    password: {
      type: String,
      required: [true, 'Please provide a password'],
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (el: String): boolean {
          //@ts-ignore
          return el == this.password;
        },
        message: 'Password are not the same!',
      },
    },

    passwordChangedAt: Date,
    accountStatus: {
      type: String,
      enum: ['active', 'underVerification', 'disabled'],
      default: 'underVerification',
      select: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    roomId: {
      type: String,
      unique: true,
      default: randomUUID(),
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//? Password Hashing
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password!.toString(), 12);

  //@ts-ignore
  this.passwordConfirm = undefined;

  next();
});

//? Password Modification detection Middleware
//@ts-ignore
UserSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  //@ts-ignore
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

UserSchema.pre('save', async function (next) {
  if (this.isNew) {
    await FriendShipsModel.create({ _id: this.id });
  }
  next();
});

//? Query middleware for showing up only active users
UserSchema.pre(/^find/, function (next) {
  //@ts-ignore
  this.find({ accountStatus: { $ne: 'disabled' } });
  next();
});

//? Verify if the password is the same as the hashed one
UserSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//? Verify if the password is changed
UserSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      //@ts-ignore
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

UserSchema.methods.createPhoneNumberVerificationCode = function (otp: string) {
  if (otp) this.phoneNumberVerificationCode = otp;
};

UserSchema.methods.checkOtpCode = function (otp: string) {
  return this.phoneNumberVerificationCode === otp;
};

UserSchema.methods.activateAccount = function () {
  this.phoneNumberVerificationCode = undefined;
  this.accountStatus = 'active';
};

//TODO CreatePasswordResetToken
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

export default UserSchema;
