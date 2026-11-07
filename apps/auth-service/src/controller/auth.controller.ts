import prisma from '@packages/libs/prisma';
import { AppError, AuthError, ValidationError } from '@packages/error-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import {
  consumeOtp,
  handleForgotPassword,
  sendOtp,
  validateRegistrationData,
  verifyOtp,
} from '../utils/auth.helper';
import { setCookie } from '../utils/cookies/setCookies';

// Register a new user
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  /* #swagger.tags = ['Authentication']
     #swagger.summary = 'Request or resend a registration OTP'
     #swagger.description = 'Uses the same endpoint for initial delivery and resend. Validates registration details and rejects existing accounts. Redis SET NX enforces the 60-second cooldown and INCR tracks the two-request quota. After SMTP acceptance the code is stored for five minutes and cooldown is refreshed. SMTP failure preserves the previous code and still consumes quota; storage timeouts can leave delivery unconfirmed. Sending is expected to finish within the cooldown.'
     #swagger.parameters['body'] = {
       in: 'body',
       required: true,
       schema: {
         $name: 'Example Customer',
         $email: 'customer@example.com',
         $password: 'example-password'
       }
     }
     #swagger.responses[200] = {
       description: 'OTP sent to the supplied email address.',
        schema: { message: 'OTP sent. Please check your account', retryAfterSeconds: 60 }
     }
     #swagger.responses[400] = {
       description: 'Invalid details, existing account, or OTP request restrictions. Restrictions include details.retryAfterSeconds.',
       schema: { status: 'error', message: 'Please wait before requesting another OTP', details: { retryAfterSeconds: 60 } }
     }
     #swagger.responses[503] = {
       description: 'Redis is not ready or delivery could not be confirmed. A delivery failure includes details.retryAfterSeconds when available.',
       schema: { status: 'error', message: 'Unable to confirm a verification code was sent. Check your email before trying again.', details: { retryAfterSeconds: 60 } }
     }
  */
  try {
    const { name, email } = validateRegistrationData(req.body, 'user');

    const isExistingUser = await prisma.users.findUnique({ where: { email } });

    if (isExistingUser) {
      return next(new ValidationError('User already exist with this email'));
    }
    const cooldown = await sendOtp(name, email, 'user-activation-mail');

    res.status(200).json({
      message: 'OTP sent. Please check your account',
      ...cooldown,
    });
  } catch (error) {
    console.log('Error register a new user', error);
    return next(error);
  }
};
// Verify a new user with OTP
export const userVerification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  /* #swagger.tags = ['Authentication']
     #swagger.summary = 'Verify the OTP and create a user account'
     #swagger.parameters['body'] = {
       in: 'body',
       required: true,
       schema: {
         $name: 'Example Customer',
         $email: 'customer@example.com',
         $otp: '1234',
         $password: 'example-password'
       }
     }
     #swagger.responses[200] = {
       description: 'User account created.',
       schema: {
         success: true,
         message: 'User registered successfully!'
       }
     }
  */
  try {
    const { email, password, name } = validateRegistrationData(
      req.body,
      'user',
    );
    const { otp } = req.body;
    const isExistingUser = await prisma.users.findUnique({ where: { email } });
    if (isExistingUser) {
      return next(new ValidationError('The user is already existed!'));
    }
    await verifyOtp(email, otp);

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.create({
      data: { name, email, password: hashedPassword },
    });
    // Account creation is committed; cleanup failure must not report it as failed.
    await consumeOtp(email, otp).catch(() => {
      console.error(
        'Unable to clean up registration OTP after account creation',
      );
    });

    res.status(200).json({
      success: true,
      message: 'User registered successfully!',
    });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return next(new ValidationError('The user is already existed!'));
    }
    return next(error);
  }
};
// Login user
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  /* #swagger.tags = ['Authentication']
     #swagger.summary = 'Log in and set access and refresh cookies'
     #swagger.parameters['body'] = {
       in: 'body',
       required: true,
       schema: {
         $email: 'customer@example.com',
         $password: 'example-password'
       }
     }
     #swagger.responses[200] = {
       description: 'Login succeeded; access_token and refresh_token cookies set.',
       schema: {
         message: 'Login success',
         user: {
           id: '507f1f77bcf86cd799439011',
           email: 'customer@example.com',
           name: 'Example Customer'
         }
       }
     }
  */
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError('Email and password are required!'));
    }
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return next(new ValidationError("User doesn't exist"));
    if (!user.password) return next(new AuthError('Invalid email or password'));

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(new AuthError('Invalid email or password'));

    // Generate access and refresh token
    const accessToken = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.JWT_ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: '15m',
      },
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.JWT_REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: '7d',
      },
    );
    setCookie(res, 'access_token', accessToken);
    setCookie(res, 'refresh_token', refreshToken);

    res.status(200).json({
      message: 'Login success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return next(error);
  }
};
// Forgot password
export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await handleForgotPassword(req, res, next, 'user');
};
// Reset password
export const resetUserPassword = (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  return next(
    new AppError(
      'Password reset is unavailable until secure verification is implemented.',
      503,
    ),
  );
};
