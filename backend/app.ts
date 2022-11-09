import express, { Express, Request, RequestHandler, Response } from 'express';
import morgan from 'morgan';

import AppError from './utils/appError';
import GlobalErrorHandler from './controllers/errorController';
const userRouter: RequestHandler = require('./routes/userRoutes');
const app: Express = express();

//TODO Add security packages
app.use(express.json({ limit: '10kb' }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// app.use('*', (req, res, next) => {
//   //@ts-ignore
//   req.timeStamp = Date.now();

//   next();
// });

app.get('/', (req: Request, res: Response) => {
  res.send('Express + Typescript 🍕');
});

app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error handling Middleware
app.use(GlobalErrorHandler);

export { app };
