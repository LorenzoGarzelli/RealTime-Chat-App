import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { promisify } from 'util';
import { UserModel as User } from '../models/Users/users.model';
import AppError from '../utils/appError';

const authenticationMiddleware = async (socket: Socket, next: any) => {
  //TODO replace with handshake.auth

  const token = socket.handshake.headers.token;

  if (!token)
    return next(new AppError('Token header parameter is missing', 400));

  //@ts-ignore
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //@ts-ignore
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );

  //@ts-ignore
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );

  //@ts-ignore
  socket.roomId = currentUser.roomId;

  next();
};

const middlewareList = [authenticationMiddleware];

export default middlewareList;
