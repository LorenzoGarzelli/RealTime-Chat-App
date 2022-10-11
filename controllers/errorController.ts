import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';

const sendErrorProd = (err: AppError, req: Request, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // 1) Log unknown error
  console.error('ERROR ❌', err);

  // 2) send generic message

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
};
const sendErrorDev = (err: AppError, req: Request, res: Response) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const handleDuplicateFieldsDB = (err: AppError) => {
  const value = err.message.match(/(["'])(?:\\.|[^\\])*?\1 /)![0];
  const message = `Duplicate field value: ${value} Please use another value!`;
  console.log('Here');

  return new AppError(message, 400);
};

export = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') sendErrorDev(err, req, res);
  else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.code === 11000) error = handleDuplicateFieldsDB(err);

    sendErrorProd(error, req, res);
  }
};
