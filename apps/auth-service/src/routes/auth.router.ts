import express, { Router } from 'express';
import {
  loginUser,
  userRegistration,
  userVerification,
} from '../controller/auth.controller';

const router: Router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-registration', userVerification);
router.post('/login', loginUser);

export default router;
