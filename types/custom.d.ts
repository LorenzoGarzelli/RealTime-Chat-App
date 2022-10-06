import { User } from '../models/Users/users.types';

declare namespace Express {
  interface Request {
    user?: User;
  }
}
