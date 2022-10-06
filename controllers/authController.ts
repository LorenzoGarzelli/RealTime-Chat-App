import { NextFunction, Request, Response } from 'express';

//@ts-ignore
import { UserModel as User } from '../models/Users/users.model';
import { User as UserType } from '../models/Users/users.types';

import jwt, { Jwt } from 'jsonwebtoken';
import { Sms } from './../utils/sms';
import AppError from './../utils/appError';
import { promisify } from 'util';

const catchAsync = require('../utils/catchAsync');

type ControllerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => any;

interface AuthControllerType {
  signup: ControllerMiddleware;
  accountActivation: ControllerMiddleware;
  protect: ControllerMiddleware;
  login: ControllerMiddleware;
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

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  cookieOptions.secure =
    req.secure || req.headers['x-forwareded-proto'] === 'https';

  res.cookie('jwt', token, cookieOptions);
  //@ts-ignore

  //?Sanitize User Object before sending it
  user.password = undefined;
  user.phoneNumberVerificationCode = undefined;

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
}

const authController = new AuthController();
export default authController as AuthControllerType;
