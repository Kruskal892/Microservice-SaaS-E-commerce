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
     #swagger.description = 'Sends a four-digit OTP using the recovery email template. The code expires after five minutes. Email is used unchanged and shares registration OTP keys and limits. Request counters are incremented before delivery, so failures may still consume a request. Password reset does not yet enforce verification proof.'
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
     #swagger.summary = 'Reset a user password (unsafe: no verification required)'
     #swagger.description = 'Critical limitation: this public handler accepts email and newPassword without an OTP, reset token, or authenticated session. Anyone knowing an existing email can change its password. Only field truthiness and reuse of the old password are checked; password length/type and email normalization are not enforced. Existing JWTs are not revoked.'
     #swagger.parameters['body'] = {
       in: 'body', required: true,
       schema: { $email: 'customer@example.com', $newPassword: 'new-example-password' }
     }
     #swagger.responses[200] = {
       description: 'Password hashed with bcrypt (10 rounds) and stored for the supplied email.',
       schema: { message: 'Password reset successfully' }
     }
     #swagger.responses[400] = {
       description: 'Missing fields, unknown user, or new password equals the old password.',
       schema: { status: 'error', message: 'Email and new password are required!' }
     }
     #swagger.responses[500] = {
       description: 'Unexpected body, database, or bcrypt failure.',
       schema: { error: 'Something went wrong please try again' }
     }
  */
  resetUserPassword,
);
router.post(
  '/verify-forgot-password-user',
  /* #swagger.auto = false
     #swagger.tags = ['Authentication']
     #swagger.summary = 'Verify a password-recovery OTP'
     #swagger.description = 'Awaits the shared OTP verification and consumes the code on success. No reset authorization is issued or stored, and the reset route does not require verification proof. The router calls the helper directly; verifyUserForgotPassword is unused.'
     #swagger.parameters['body'] = {
       in: 'body', required: true,
       schema: { $email: 'customer@example.com', $otp: '1234' }
     }
     #swagger.responses[200] = {
       description: 'OTP verified and consumed; no reset token is issued.',
       schema: { message: 'Verify OTP successfully. You can nơ reset your password' }
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
