import express, { Router } from 'express';
import {
  userForgotPassword,
  loginUser,
  resetUserPassword,
  userRegistration,
  userVerification,
  refreshToken,
  getLoggedInUser,
} from '../controller/auth.controller';
import { verifyForgotPasswordOtp } from '../utils/auth.helper';
import { isAuthenticated } from '@packages/middleware';

const router: Router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-registration', userVerification);
router.post('/login', loginUser);
router.post(
  '/forgot-password-user',
  /* #swagger.auto = false
     #swagger.tags = ['Authentication']
     #swagger.summary = 'Request a password-recovery OTP'
     #swagger.description = 'Validates and normalizes email, then sends a four-digit recovery OTP expiring after five minutes. Recovery codes and attempts are separate from registration; locks, request limits and cooldown remain shared. Failed delivery still consumes quota. Verify the code to obtain a single-use reset token.'
     #swagger.parameters['body'] = {
       in: 'body', required: true,
       schema: { $email: 'customer@example.com' }
     }
     #swagger.responses[200] = {
       description: 'SMTP accepted the recovery email and Redis OTP/cooldown writes completed; inbox delivery is not guaranteed.',
       schema: { message: 'OTP sent successfully. Please check your account.', retryAfterSeconds: 60 }
     }
     #swagger.responses[400] = {
       description: 'Invalid body/email, unknown user, or shared OTP restrictions.',
       schema: { status: 'error', message: 'Invalid email format' }
     }
     #swagger.responses[503] = {
       description: 'Redis unavailable or email delivery could not be confirmed.',
       schema: { status: 'error', message: 'Unable to confirm a verification code was sent. Check your email before trying again.' }
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
     #swagger.summary = 'Reset a password using single-use authorization'
     #swagger.description = 'Requires the resetToken from recovery OTP verification and the same normalized email. Validates an 8-128 character replacement password, hashes it with bcrypt, atomically consumes the five-minute token, then conditionally updates only the verified account with its original password hash. Replay, expiry and grants superseded by a password change are rejected. A database failure after consumption requires a new recovery request. Sends a best-effort change notification; no automatic login or JWT revocation is performed.'
     #swagger.parameters['body'] = {
       in: 'body', required: true,
       schema: {
         $email: 'customer@example.com',
         $resetToken: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
         $newPassword: 'new-example-password'
       }
     }
     #swagger.responses[200] = {
       description: 'Password changed; sign in with the new password.',
       schema: { message: 'Password reset successfully. Please sign in with your new password.' }
     }
     #swagger.responses[400] = {
       description: 'Invalid request/password or invalid, expired, consumed, wrong-account or superseded reset token.',
       schema: { status: 'error', message: 'Invalid or expired password reset token' }
     }
     #swagger.responses[500] = {
       description: 'Hashing, Redis or database failure. A token consumed before a database failure is not restored.',
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
     #swagger.description = 'Validates normalized email and a four-digit recovery code. Atomically checks locks, enforces three failed attempts, consumes the purpose-specific OTP, and creates a five-minute single-use reset grant. Returns a random 256-bit resetToken; Redis stores one SHA-256 digest bound to the account ID and current password hash. A new grant supersedes the previous grant for that email.'
     #swagger.parameters['body'] = {
       in: 'body', required: true,
       schema: { $email: 'customer@example.com', $otp: '1234' }
     }
     #swagger.responses[200] = {
       description: 'Recovery OTP consumed and single-use reset authorization issued.',
       schema: {
         message: 'OTP verified. You can now reset your password.',
         resetToken: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
         expiresInSeconds: 300
       }
     }
     #swagger.responses[400] = {
       description: 'Missing email or OTP, expired/invalid code, incorrect code, or attempt lockout.',
       schema: { status: 'error', message: 'Expired or invalid OTP!' }
     }
     #swagger.responses[500] = {
       description: 'Unexpected request handling or Redis failure.',
       schema: { error: 'Something went wrong please try again' }
     }
  */
  verifyForgotPasswordOtp,
);

router.post(
  '/refresh-token',
  /* #swagger.auto = false
     #swagger.tags = ['Authentication']
     #swagger.summary = 'Refresh the access-token cookie'
     #swagger.description = 'Requires the refresh_token cookie issued by login; no JSON body or Authorization-header fallback. Verifies the refresh JWT and checks that its user still exists. Sets a new 15-minute access JWT in an HttpOnly, Secure, SameSite=None cookie with seven-day retention. Does not rotate or extend the refresh token, revoke sessions, or return token values in JSON. Browser callers must include credentials.'
     #swagger.responses[201] = {
       description: 'Access token refreshed; access_token Set-Cookie header sent.',
       schema: { message: 'Access token refreshed successfully', success: true }
     }
     #swagger.responses[401] = {
       description: 'Refresh token missing, invalid, expired, not yet active, missing required claims, or associated user no longer exists.',
       schema: { status: 'error', message: 'Unauthorized: Invalid or expired refresh token' }
     }
     #swagger.responses[500] = {
       description: 'Unexpected database, JWT configuration, or signing failure.',
       schema: { error: 'Something went wrong please try again' }
     }
  */
  refreshToken,
);

router.get(
  '/logged-in-user',
  /* #swagger.auto = false
     #swagger.tags = ['Authentication']
     #swagger.summary = 'Get the authenticated user'
     #swagger.description = 'Requires an access_token cookie or Authorization header token. Shared middleware verifies the access JWT and loads the existing account. Returns only public id, email, and name fields with Cache-Control: no-store. Does not create a session or refresh tokens; the client may call the refresh endpoint after a 401 and retry once.'
     #swagger.responses[200] = {
       description: 'Authenticated account; no password hash or token values.',
       schema: { success: true, user: { id: '507f1f77bcf86cd799439011', email: 'customer@example.com', name: 'Example Customer' } }
     }
     #swagger.responses[401] = {
       description: 'Access token missing, invalid, expired, missing claims, or associated account deleted.',
       schema: { message: 'Unauthorized: Access token is missing' }
     }
     #swagger.responses[500] = {
       description: 'Unexpected database or JWT configuration failure.',
       schema: { error: 'Something went wrong please try again' }
     }
  */
  isAuthenticated,
  getLoggedInUser,
);
export default router;
