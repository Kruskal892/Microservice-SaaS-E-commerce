import { ValidationError } from '@microservice-eshop/error-handler';
// import crypto from 'crypto';
// import { NextFunction } from 'express';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  userType: 'user' | 'seller',
) => {
  const { email, name, password, phone_number, country } = data;
  if (
    !name ||
    !email ||
    !password ||
    (userType === 'seller' && (!phone_number || !country))
  ) {
    throw new ValidationError('Missing required fields');
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

// export const checkOtpRestrictions = (email: string, next: NextFunction) => {
//   return null;
// };

// export const sendOtp = async (
//   name: string,
//   email: string,
//   template: string,
// ) => {
//   const otp = crypto.randomInt(1000, 9999).toString();
//   //
// };
