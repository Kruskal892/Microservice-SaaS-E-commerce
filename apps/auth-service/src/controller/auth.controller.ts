import prisma from '@microservice-eshop/libs/prisma';
import { ValidationError } from '@microservice-eshop/error-handler';
import { NextFunction, Request, Response } from 'express';
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
} from '../utils/auth.helper';

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    validateRegistrationData(req.body, 'user');
    const { name, email } = req.body;

    const isExistingUser = await prisma.users.findUnique({ where: { email } });

    if (isExistingUser) {
      return next(new ValidationError('User already exist with this email'));
    }
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, 'user-activation-mail');

    res.status(200).json({
      message: 'OTP sent. Please check your account',
    });
  } catch (error) {
    console.log('Error register a new user', error);
    return next(error);
  }
};
