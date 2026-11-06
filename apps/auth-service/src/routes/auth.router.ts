import express, { Router } from 'express';
import {
  userForgotPassword,
  loginUser,
  resetUserPassword,
  userRegistration,
  userVerification,
} from '../controller/auth.controller';
import { verifyForgotPasswordOtp } from '../utils/auth.helper';

const router: Router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-registration', userVerification);
router.post('/login', loginUser);
router.post(
  '/forgot-password-user',
  /* #swagger.auto = false
     #swagger.tags = ['Authentication']
     #swagger.summary = 'Request a password-recovery OTP'
     #swagger.description = 'Sends a four-digit OTP using the recovery email template. The code expires after five minutes. Email is used unchanged and shares registration OTP keys and limits. sendOtp checks locks, acquires cooldown with SET NX, and counts requests with INCR before delivery. Failures still consume quota. Password reset is disabled until secure verification is implemented.'
     #swagger.parameters['body'] = {
       in: 'body', required: true,
       schema: { $email: 'customer@example.com' }
     }
     #swagger.responses[200] = {
       description: 'SMTP accepted the recovery email and Redis OTP/cooldown writes completed; inbox delivery is not guaranteed.',
       schema: { message: 'OTP sent successfully. Please check your account.' }
     }
     #swagger.responses[400] = {
       description: 'Missing email, unknown user, or shared OTP restrictions.',
       schema: { status: 'error', message: 'Email is required!' }
     }
     #swagger.responses[500] = {
       description: 'Unexpected body, database, Redis, template, or SMTP failure.',
       schema: { error: 'Something went wrong please try again' }
     }
  */
  userForgotPassword,
);
router.post(
  '/reset-password-user',
  /* #swagger.auto = false
     #swagger.tags = ['Authentication']
     #swagger.summary = 'Password reset is temporarily unavailable'
     #swagger.description = 'Always rejects requests without reading or updating an account. Secure single-use reset authorization must be implemented before this endpoint is enabled.'
     #swagger.responses[503] = {
       description: 'Password reset is disabled.',
       schema: { status: 'error', message: 'Password reset is unavailable until secure verification is implemented.' }
     }
  */
  resetUserPassword,
);
router.post(
  '/verify-forgot-password-user',
  /* #swagger.auto = false
     #swagger.tags = ['Authentication']
     #swagger.summary = 'Verify a password-recovery OTP'
     #swagger.description = 'Awaits shared OTP validation and then consumes the matching code. No reset authorization is issued or stored. Password reset remains disabled.'
     #swagger.parameters['body'] = {
       in: 'body', required: true,
       schema: { $email: 'customer@example.com', $otp: '1234' }
     }
     #swagger.responses[200] = {
       description: 'OTP verified and consumed; no reset token is issued.',
       schema: { message: 'OTP verified. Password reset is not available yet.' }
     }
     #swagger.responses[400] = {
       description: 'Missing email or OTP, expired/invalid code, incorrect code, or attempt lockout.',
       schema: { status: 'error', message: 'Email and otp are required!' }
     }
     #swagger.responses[500] = {
       description: 'Unexpected request handling or Redis failure.',
       schema: { error: 'Something went wrong please try again' }
     }
  */
  verifyForgotPasswordOtp,
);

export default router;
