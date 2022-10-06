import mongoose, { Schema } from 'mongoose';
import { User } from './users.types';
import validator from 'validator';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema<User>(
  {
    name: String,
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      //TODO Add email Validation
    },

    phoneNumber: {
      type: String,
      required: [true, 'Please provide your phone number'],
      unique: true,
      validate: [
        validator.isMobilePhone,
        'Please provide a valid mobileNumber phone',
      ],
      //TODO Add phoneNumber Validation
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

    //TODO  friends: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  }
  //TODO { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//? Password Hashing
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password!.toString(), 12);

  //@ts-ignore
  this.passwordConfirm = undefined;

  next();
});

//? Password Modification detection
//@ts-ignore
UserSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  //@ts-ignore
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

//? Query middleware for showing up only active users
UserSchema.pre(/^find/, function (next) {
  //@ts-ignore
  this.find({ active: { $ne: 'disabled' } });
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
//TODO CreatePhoneNumberVerificationCode entry

export default UserSchema;

// const User = mongoose.model('User', UserSchema);
// module.exports = User;
