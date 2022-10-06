import express, { Express, Router } from 'express';

import authController from '../controllers/authController';
const router: Router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.patch(
  '/account-activation',
  authController.protect,
  authController.accountActivation
);
router.post('/login');

module.exports = router;
