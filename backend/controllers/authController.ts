import { NextFunction, Request, Response } from 'express';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { UserModel as User } from '../models/Users/users.model';
import { User as UserType } from '../models/Users/users.types';
import { ControllerMiddleware } from '../types/types';

import { Sms } from './../utils/sms';
import AppError from './../utils/appError';

import catchAsync from '../utils/catchAsync';
import { decode } from 'punycode';

interface AuthControllerType {
  signup: ControllerMiddleware;
  accountActivation: ControllerMiddleware;
  protect: ControllerMiddleware;
  login: ControllerMiddleware;
  isLoggedIn: ControllerMiddleware;
  logout: ControllerMiddleware;
  forgotPassword: ControllerMiddleware;
  resetPassword: ControllerMiddleware;
  restrictTo: (...roles: [string]) => any;
}

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (
  user: UserType,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const token = signToken(user._id!);

  const cookieOptions = {
    expires: new Date(
      Date.now() + +process.env.JWT_COOKIE_EXPIRES_IN! * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,

    secure: false,
  };

  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  cookieOptions.secure =
    req.secure || req.headers['x-forwareded-proto'] === 'https';

  res.cookie('jwt', token, cookieOptions);
  //@ts-ignore

  //?Sanitize User Object before sending it
  user.password = undefined;
  user.phoneNumberVerificationCode = undefined;
  user.passwordChangedAt = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

class AuthController implements AuthControllerType {
  signup = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
      });

      //? Send Sms Verification Code
      const otp = await new Sms(newUser.phoneNumber).sendVerificationCode();

      //@ts-ignore
      newUser.createPhoneNumberVerificationCode(otp);
      await newUser.save({ validateBeforeSave: false });

      createSendToken(newUser, 201, req, res);
    }
  );

  login = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { phoneNumber, password } = req.body;

      if (!phoneNumber || !password)
        return next(
          new AppError('Please provide phoneNumber and password', 400)
        );

      const user = await User.findOne({ phoneNumber }).select('+password');

      //@ts-ignore
      if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect phoneNumber or password', 401));
      }

      createSendToken(user, 200, req, res);
    }
  );

  logout = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      res.cookie('jwt', 'null', {
        expires: new Date(Date.now() - 10 * 1000),
        httpOnly: true,
      });

      res.status(200).end();
    }
  );
  isLoggedIn = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      let token = undefined;
      if (req.headers.authorization?.startsWith('Bearer'))
        token = req.headers.authorization.split(' ')[1];
      else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
      }

      if (!token) {
        return res.status(200).json({ isLoggedIn: false });
      }

      const decoded = await promisify(jwt.verify)(
        token,
        // @ts-ignore
        process.env.JWT_SECRET
      );

      // Check if user still exists

      //@ts-ignore
      const currentUser = await User.findById(decoded.id)
        .select('-password')
        .select('-passwordChangedAt');
      if (!currentUser) return next();

      // 3) Check if user changed password after the token was issued
      //@ts-ignore
      if (currentUser.changedPasswordAfter(decoded.iat)) return next();

      res.status(200).json({ currentUser, isLoggedIn: true });
    }
  );
  accountActivation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      //@ts-ignore
      const user = await User.findById(req.user.id)
        .select('+phoneNumberVerificationCode')
        .select('+accountStatus');

      if (user?.accountStatus === 'active')
        return next(new AppError('Account already activated', 409));

      //@ts-ignore
      const result = user.checkOtpCode(req.body.otp);

      if (!result)
        return next(
          new AppError('Invalid Otp verification Code, try again', 401)
        );

      //@ts-ignore //TODO Fix methods snippet
      user.activateAccount();

      await user?.save({ validateBeforeSave: false });

      res.status(200).json({
        status: 'success',
      });
    }
  );

  protect = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      // 1) Getting token from request

      let token: string | null = null;
      if (req.headers.authorization?.startsWith('Bearer'))
        token = req.headers.authorization.split(' ')[1];
      else if (req.cookies.jwt) {
        token = req.cookies.jwt;
      }
      if (!token)
        new AppError('You are not logged in! Please log in to get access', 401);

      //2) Token verification

      const decoded = await promisify(jwt.verify)(
        token as string,
        //@ts-ignore
        process.env.JWT_SECRET
      );

      // 3) Check if user still exist

      //@ts-ignore
      const currentUser = await User.findById(decoded.id);
      if (!currentUser)
        return next(
          new AppError(
            'The user belonging to this token does no longer exist',
            401
          )
        );

      // 4) Check if user changed password after the token was issued

      //@ts-ignore
      if (currentUser.changedPasswordAfter(decoded.iat))
        return next(
          new AppError(
            'User recently changed password! Please log in again',
            401
          )
        );

      //@ts-ignore
      req.user = currentUser;
      res.locals.user = currentUser;

      next();
    }
  );

  forgotPassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await User.findOne({ phoneNumber: req.body.phoneNumber });
      if (!user /*|| user.accountStatus !== 'active'*/)
        return next(new AppError('There is no user with phone number', 404));
      //@ts-ignore
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      //? Send sms to user

      const url = await new Sms(user.phoneNumber).sendPassWordResetToken(
        resetToken
      );
      res.status(200).json({
        message: 'Url sended to phone number',
        url,
      });
    }
  );

  resetPassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token.trim())
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user)
        return next(new AppError('Token is invalid or has expired', 400));

      //TODO make body validation
      user.password = req.body.password;
      user.passwordConfirm = req.body.passwordConfirm;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();
      createSendToken(user, 200, req, res);
    }
  );
  restrictTo = (...roles: [string]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      req.user;

      //@ts-ignore
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError('You do not have permission to perform this action', 403)
        );
      }
      next();
    };
  };
}

const authController = new AuthController();
export default authController as AuthControllerType;
