import express, { Express, Router } from 'express';

import authController from '../controllers/authController';
import userController from '../controllers/userController';
const router: Router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/isLoggedIn', authController.isLoggedIn);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//? Only authenticated users
router.use(authController.protect);
router.patch('/account-activation', authController.accountActivation);

router.post(
  '/friendShips/:userId',
  //TODO Delete comment authController.restrictTo('user'),
  userController.sendFriendshipRequest
);
router.get('/friendShips/', userController.getFriendShipsRequests);
router.patch(
  '/friendShips/reply/:userId',
  userController.replyToFriendShipRequest
);

router.get('/friends', userController.getAllFriends);

//? Admin Only Actions
router.use(authController.restrictTo('admin'));
router.get('/', userController.getAllUsers);

module.exports = router;
