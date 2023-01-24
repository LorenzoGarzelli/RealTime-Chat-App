import { NextFunction, Request, Response } from 'express';

import { ControllerMiddleware } from '../types/types';
import { UserModel as User } from '../models/Users/users.model';

import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import { FriendShipsModel } from '../models/FriendShips/friendships.model';

interface UserControllerType {
  getAllUsers: ControllerMiddleware;
  sendFriendshipRequest: ControllerMiddleware;
  getFriendShipsRequests: ControllerMiddleware;
  replyToFriendShipRequest: ControllerMiddleware;
  getAllFriends: ControllerMiddleware;
}

class UserController implements UserControllerType {
  getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const doc = await User.find({}).select('-password');

      res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
          doc,
        },
      });
    }
  );

  sendFriendshipRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      //@ts-ignore
      if (req.params.userId && req.user.id !== req.params.userId) {
        const user = await User.findById(req.params.userId);
        if (!user) return next(new AppError('No user found with that Id', 404));

        /*
         //@ts-ignore
        const result = await User.findById(req.user.id).update(
          //@ts-ignore
          { _id: req.user.id },
          {
            $addToSet: {
              friends: { _id: req.params.userId, status: 'pending' },
            },
          }
        );

        if (!result.modifiedCount) {
          return next(new AppError('Friend request already forwarded', 409));
        }*/

        await FriendShipsModel.findById(user._id).updateOne({
          //@ts-ignore
          $addToSet: { friends: { from: req.user.id } },
        });

        //TODO Add functionality
        return res.status(201).json({
          status: 'success',
        });
      }
      return next(new AppError('User Id field incorrect or empty ', 400));
    }
  );
  getFriendShipsRequests = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const friendShipsRequests = await FriendShipsModel.find({
        //@ts-ignore
        _id: req.user.id,
        'friends.status': { $ne: 'bonded' },
      });

      return res.status(200).json({
        status: 'success',
        data: friendShipsRequests,
      });
    }
  );

  replyToFriendShipRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.params.userId) {
        //@ts-ignore
        const { accepted } = req.query;
        const friendShipRequest = await FriendShipsModel.find(
          {
            //@ts-ignore
            _id: req.user.id,
            'friends.from': req.params.userId,
            'friends.status': { $ne: 'bonded' },
          },
          { _id: 0, friends: { $elemMatch: { from: req.params.userId } } }
        );

        if (!friendShipRequest.length)
          return next(
            new AppError('No friendShip request found with that userId', 404)
          );

        //@ts-ignore

        if (accepted == 'true') {
          const updateFriendShipQueries = [];

          updateFriendShipQueries.push(
            FriendShipsModel.updateOne(
              //@ts-ignore
              { _id: req.user.id, 'friends.from': req.params.userId },
              {
                $set: {
                  'friends.$.status': 'bonded',
                  'friends.$.user': req.params.userId,
                  // 'friends.$from': null,
                },
                $unset: {
                  'friends.$.from': '',
                },
              }
            )
          );

          updateFriendShipQueries.push(
            new Promise((resolve, reject) => {
              //? Check if a friendShip request send from this user already exist
              FriendShipsModel.updateOne(
                {
                  _id: req.params.userId,
                  //@ts-ignore
                  'friends.from': req.user.id,
                },
                {
                  $set: {
                    'friends.$.status': 'bonded',
                    //@ts-ignore
                    'friends.$.user': req.user.id,
                    // 'friends.$from': null,
                  },

                  $unset: {
                    'friends.$.from': '',
                  },
                }
              ).then((res: any) => {
                if (res.modifiedCount) return resolve(res);
                FriendShipsModel.updateOne(
                  {
                    _id: req.params.userId,
                  },

                  {
                    $addToSet: {
                      //@ts-ignore
                      friends: { user: req.user.id, status: 'bonded' },
                    },
                  }
                ).then(res => resolve(res));
              });
            })
          );

          await Promise.all(updateFriendShipQueries);
        } else if (accepted == 'false') {
          //? delete the friendShip request

          await FriendShipsModel.updateOne(
            //@ts-ignore
            { _id: req.user.id },
            {
              $pull: { friends: { from: req.params.userId } },
            }
          );
        }
        return res.status(200).end();
      }
      return next(new AppError('User Id field is empty', 400));
    }
  );

  getAllFriends = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const friends = await FriendShipsModel.find(
        {
          //@ts-ignore
          _id: req.user.id,
        },
        { _id: 0, friends: { $elemMatch: { status: 'bonded' } } }
      );

      res.status(200).json({
        status: 'success',
        data: friends,
      });
    }
  );
}

const userController = new UserController();
export default userController as UserControllerType;
