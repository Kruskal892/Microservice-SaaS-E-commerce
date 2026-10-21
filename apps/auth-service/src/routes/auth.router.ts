import express, { Router } from 'express';
import {
  userRegistration,
  userVerification,
} from '../controller/auth.controller';

const router: Router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-registration', userVerification);

export default router;
