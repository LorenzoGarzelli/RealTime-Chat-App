import { NextFunction, Request, Response } from 'express';
import { type } from 'os';
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
  id: string;
  content: string;
  to: string;
  from: string;
  timestamp: string;
};

export { ControllerMiddleware, ErrorControllerMiddleware, Message };
