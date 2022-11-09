import { NextFunction, Request, Response } from 'express';

//TODO Add correct type
export = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
