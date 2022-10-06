import { NextFunction, Request, Response } from 'express';

//TODO Add correct type
module.exports = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
