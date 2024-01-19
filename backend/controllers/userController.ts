import { NextFunction, Request, Response } from 'express';

import { ControllerMiddleware } from '../types/types';
import { UserModel as User } from '../models/Users/users.model';

import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import { FriendShipsModel } from '../models/FriendShips/friendships.model';
import mongoose from 'mongoose';

interface UserControllerType {
  getAllUsers: ControllerMiddleware;
  sendFriendshipRequest: ControllerMiddleware;
  getFriendShipsRequests: ControllerMiddleware;
  replyToFriendShipRequest: ControllerMiddleware;
  getAllFriends: ControllerMiddleware;
  shareKeysRequest: ControllerMiddleware;
}

class UserController implements UserControllerType {
  getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const users = await User.find({}).select('-password');

      res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
          users,
        },
      });
    }
  );

  sendFriendshipRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId: friendShipReceiverUserId } = req.params;
      //@ts-ignore
      const { id: friendShipRequestInitiatorUserId } = req.user;

      if (!friendShipReceiverUserId)
        return next(new AppError('User Id field is empty', 400));

      if (
        friendShipReceiverUserId &&
        friendShipRequestInitiatorUserId !== friendShipReceiverUserId
      ) {
        const user = await User.findById(friendShipReceiverUserId);
        if (!user) return next(new AppError('No user found with that Id', 404));

        await FriendShipsModel.findById(user._id).updateOne({
          $addToSet: { friends: { from: friendShipRequestInitiatorUserId } },
        });

        return res.status(201).json({
          status: 'success',
        });
      } else
        return next(new AppError('User Id field incorrect or empty ', 400));
    }
  );
  getFriendShipsRequests = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const friendShipsRequests = await FriendShipsModel.aggregate([
        {
          $match: {
            //@ts-ignore
            _id: mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $project: {
            _id: 0,
            friends: {
              $filter: {
                input: '$friends',
                as: 'friend',
                cond: { $eq: ['$$friend.status', 'pending'] },
              },
            },
          },
        },
      ]);

      return res.status(200).json({
        status: 'success',
        data: friendShipsRequests,
      });
    }
  );

  replyToFriendShipRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId: friendShipRequestInitiatorUserId } = req.params;
      if (!friendShipRequestInitiatorUserId)
        return next(new AppError('User Id field is empty', 400));

      //@ts-ignore
      const { id: friendShipReceiverUserId } = req.user;

      const { accepted } = req.query;

      const friendShipRequest = await FriendShipsModel.findOne(
        {
          _id: friendShipReceiverUserId,
          'friends.from': friendShipRequestInitiatorUserId,
          'friends.status': { $eq: 'pending' },
        },
        {
          _id: 0,
          friends: { $elemMatch: { from: friendShipRequestInitiatorUserId } },
        }
      );

      if (!friendShipRequest)
        return next(
          new AppError('No friendShip request found with that userId', 404)
        );

      if (accepted == 'true') {
        const updateFriendShipQuery = FriendShipsModel.updateOne(
          {
            _id: friendShipReceiverUserId,
            'friends.from': friendShipRequestInitiatorUserId,
          },
          {
            $set: {
              'friends.$.status': 'bonded',
              'friends.$.user': friendShipRequestInitiatorUserId,
            },
            $unset: {
              'friends.$.from': '',
            },
          }
        );

        const addFriendShipQuery = new Promise((resolve, reject) => {
          //? Check if a friendShip request send from this user already exist
          FriendShipsModel.updateOne(
            {
              _id: friendShipRequestInitiatorUserId,
              'friends.from': friendShipReceiverUserId,
            },
            {
              $set: {
                'friends.$.status': 'bonded',
                'friends.$.user': friendShipReceiverUserId,
              },

              $unset: {
                'friends.$.from': '',
              },
            }
          ).then((res: any) => {
            if (res.modifiedCount) return resolve(res);
            FriendShipsModel.updateOne(
              {
                _id: friendShipRequestInitiatorUserId,
              },

              {
                $addToSet: {
                  friends: { user: friendShipReceiverUserId, status: 'bonded' },
                },
              }
            ).then(res => resolve(res));
          });
        });

        await Promise.all([updateFriendShipQuery, addFriendShipQuery]);
      } else if (accepted == 'false') {
        //? delete the friendShip request

        await FriendShipsModel.updateOne(
          { _id: friendShipReceiverUserId },
          {
            $pull: { friends: { from: friendShipRequestInitiatorUserId } },
          }
        );
      }
      return res.status(200).end();
    }
  );

  getAllFriends = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const friends = await FriendShipsModel.aggregate([
        {
          $match: {
            //@ts-ignore
            _id: mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $project: {
            _id: 0,
            friends: {
              $filter: {
                input: '$friends',
                as: 'friend',
                cond: { $eq: ['$$friend.status', 'bonded'] },
              },
            },
          },
        },
      ]);

      res.status(200).json({
        status: 'success',
        data: friends,
      });
    }
  );
  shareKeysRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId: friendId } = req.params;
      if (!friendId) return next(new AppError('User Id field is empty', 400));

      const user = await User.findById(friendId);
      if (!user) return next(new AppError('No user found with that Id', 404));

      const friendShip = (
        await FriendShipsModel.find({
          _id: user.id,
          //@ts-ignore
          'friends.user': req.user.id,
          'friends.status': 'bonded',
        })
      )[0];

      if (!friendShip)
        return next(new AppError('No friendShip found with that userId', 404));
      const result = await FriendShipsModel.updateOne(
        {
          _id: user.id,
          //@ts-ignore
          'friends.user': req.user.id,
        },
        {
          $set: {
            'friends.$.PBK': JSON.stringify(req.body.PBK),
          },
        }
      );
      return res.status(200).end();
    }
  );
}

const userController = new UserController();
export default userController as UserControllerType;
