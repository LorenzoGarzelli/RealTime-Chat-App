import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';

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

export type MessageStatus = 'read' | 'to read' | 'sent' | 'sending';

export type MessageType = 'received' | 'sent';

export { ControllerMiddleware, ErrorControllerMiddleware, Message, MessageAck };
