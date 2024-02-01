//import { SigningKeyCallback } from 'jsonwebtoken';

import { User } from '../models/Users/users.types';

export {};

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}

// declare global {
//   namespace jwt {
//     export interface SigningKeyCallback {
//       id: string;
//     }
//   }
// }
