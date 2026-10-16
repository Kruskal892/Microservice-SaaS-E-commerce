import prisma from '@microservice-eshop/libs/prisma';
import { ValidationError } from '@microservice-eshop/error-handler';
import { NextFunction, Request, Response } from 'express';
import {
  // checkOtpRestrictions,
  validateRegistrationData,
} from '../utils/auth.helper';

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  validateRegistrationData(req.body, 'user');
  const { email } = req.body;

  const isExistingUser = await prisma.users.findUnique({ where: email });

  if (isExistingUser) {
    return next(new ValidationError('User already exist with this email'));
  }
  // await checkOtpRestrictions(email, next);
};
