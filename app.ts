import express, { Express, Request, RequestHandler, Response } from 'express';
import morgan from 'morgan';
import AppError from './utils/appError';

const userRouter: RequestHandler = require('./routes/userRoutes');
const app: Express = express();

app.use(express.json({ limit: '10kb' }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/', (req: Request, res: Response) => {
  res.send('Express + Typescript 🍕');
});

app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error handling Middleware

export { app };
