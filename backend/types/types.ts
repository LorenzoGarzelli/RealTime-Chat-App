import { NextFunction, Request, Response } from 'express';
import { type } from 'os';
import AppError from '../utils/appError';
import { Socket } from 'socket.io';

type ControllerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => any;

type ErrorControllerMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => any;

type Message = {
  uuid: string;
  content: string;
  to: string;
  from: string;
  timestamp: string;
  status?: MessageStatus;
};

type MessageAck = {
  uuid: string;
  to: string;
  from: string;
  status: MessageStatus;
};

type KeysSharing = {
  PBK: JsonWebKey;
  to: string;
  from?: string;
};

export type MessageStatus = 'read' | 'to read' | 'sent' | 'sending';

export type MessageType = 'received' | 'sent';

export {
  ControllerMiddleware,
  ErrorControllerMiddleware,
  Message,
  MessageAck,
  KeysSharing,
};

export interface ClientSocket extends Socket {
  roomId: string;
}

export interface User {
  _id: string;
  name: string;
  roomId: string;
}

enum FriendStatus {
  bonded = 'bonded',
  pending = 'pending',
}
export type Friend = {
  status: FriendStatus;
  user: User;
  PBK: string;
};
