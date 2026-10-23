import prisma from '@packages/libs/prisma';
import { AuthError, ValidationError } from '@packages/error-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import {
  checkOtpRestrictions,
  handleForgotPassword,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyForgotPasswordOtp,
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
     #swagger.summary = 'Request a registration OTP'
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
       schema: { message: 'OTP sent. Please check your account' }
     }
  */
  try {
    const { name, email } = validateRegistrationData(req.body, 'user');

    const isExistingUser = await prisma.users.findUnique({ where: { email } });

    if (isExistingUser) {
      return next(new ValidationError('User already exist with this email'));
    }
    await checkOtpRestrictions(email);
    await trackOtpRequests(email);
    await sendOtp(name, email, 'user-activation-mail');

    res.status(200).json({
      message: 'OTP sent. Please check your account',
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
    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password || !name) {
      return next(new ValidationError('All fields are required!'));
    }
    const isExistingUser = await prisma.users.findUnique({ where: { email } });
    if (isExistingUser) {
      return next(new ValidationError('The user is already existed!'));
    }
    await verifyOtp(email, otp, next);

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.create({
      data: { name, email, password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: 'User registered successfully!',
    });
  } catch (error) {
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
// Verify forgot password otp
export const verifyUserForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await verifyForgotPasswordOtp(req, res, next);
};
// Reset password
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return next(new ValidationError('Email and new password are required!'));
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return next(new ValidationError('User not found'));
    }
    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return next(
          new ValidationError(
            'New password can not be the same as old password!',
          ),
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword },
    });
    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    return next(error);
  }
};
