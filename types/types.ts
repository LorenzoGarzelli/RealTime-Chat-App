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

export { ControllerMiddleware, ErrorControllerMiddleware };
