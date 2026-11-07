import { AppError, ValidationError } from '@packages/error-handler';
import redis from '@packages/libs/redis';
import { prisma } from '@packages/libs';
import crypto from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { sendEmail } from '../mail';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (
  data: unknown,
  userType: 'user' | 'seller',
) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Request body must be an object');
  }
  const { email, name, password, phone_number, country } = data as Record<
    string,
    unknown
  >;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    throw new ValidationError('Name must contain between 1 and 100 characters');
  }
  if (
    typeof email !== 'string' ||
    email.trim().length > 254 ||
    !emailRegex.test(email.trim())
  ) {
    throw new ValidationError('Invalid email format');
  }
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new ValidationError(
      'Password must contain between 8 and 128 characters',
    );
  }
  if (userType === 'seller') {
    for (const [field, value, max] of [
      ['phone_number', phone_number, 32],
      ['country', country, 100],
    ] as const) {
      if (
        typeof value !== 'string' ||
        !value.trim() ||
        value.trim().length > max
      ) {
        throw new ValidationError(`Invalid ${field}`);
      }
    }
  }
  return { name: name.trim(), email: email.trim().toLowerCase(), password };
};

async function checkOtpRestrictions(email: string) {
  if (redis.status !== 'ready') {
    throw new AppError(
      'Email verification is temporarily unavailable. Please try again later.',
      503,
    );
  }
  for (const [key, message] of [
    [`otp_lock:${email}`, 'Account is locked. Try again after 30 minutes'],
    [`otp_spam_lock:${email}`, 'Too many OTP requests. Try again after 1 hour'],
  ]) {
    if (await redis.get(key)) {
      throw new ValidationError(message, {
        retryAfterSeconds: Math.max(1, await redis.ttl(key)),
      });
    }
  }
  const cooldownKey = `otp_cooldown:${email}`;
  if (!(await redis.set(cooldownKey, 'true', 'EX', 60, 'NX'))) {
    throw new ValidationError('Please wait before requesting another OTP', {
      retryAfterSeconds: Math.max(1, await redis.ttl(cooldownKey)),
    });
  }
}

async function trackOtpRequests(email: string) {
  const key = `otp_request_count:${email}`;
  const requests = await redis.incr(key);
  await redis.expire(key, 3600);
  if (requests > 2) {
    await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600);
    throw new ValidationError('Too many OTP requests. Try again after 1 hour', {
      retryAfterSeconds: 3600,
    });
  }
}

export const sendOtp = async (
  name: string,
  email: string,
  template: string,
) => {
  await checkOtpRestrictions(email);
  await trackOtpRequests(email);
  const otp = crypto.randomInt(1000, 10000).toString();
  try {
    await sendEmail(email, 'Verify your email', template, { name, otp });
    // shortcut: sending must finish within the 60-second cooldown; add ownership checks for slower jobs.
    await redis.set(`otp:${email}`, otp, 'EX', 300);
    await redis.expire(`otp_cooldown:${email}`, 60);
  } catch {
    const remaining = await redis.ttl(`otp_cooldown:${email}`).catch(() => 60);
    throw new AppError(
      'Unable to confirm a verification code was sent. Check your email before trying again.',
      503,
      true,
      { retryAfterSeconds: Math.max(0, remaining) },
    );
  }
  return { retryAfterSeconds: 60 };
};

export const verifyOtp = async (email: string, otp: unknown) => {
  if (typeof otp !== 'string' || otp.length !== 4 || !/^[0-9]+$/.test(otp)) {
    throw new ValidationError('Enter the four-digit code');
  }
  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError('Account is locked. Try again after 30 minutes');
  }
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) {
    throw new ValidationError('Expired or invalid OTP!');
  }

  const failedAttemptKey = `otp_attempts:${email}`;
  const failedAttempt = parseInt((await redis.get(failedAttemptKey)) || '0');

  if (storedOtp !== otp) {
    if (failedAttempt >= 2) {
      await redis.set(`otp_lock:${email}`, 'locked', 'EX', 1800);
      await redis.del(`otp:${email}`, failedAttemptKey);

      throw new ValidationError(
        'Too many failed attempts. Your account is locked for 30 minutes',
      );
    }
    await redis.set(failedAttemptKey, failedAttempt + 1, 'EX', 300);
    throw new ValidationError(
      `Incorrect OTP. ${2 - failedAttempt} attempts left`,
    );
  }
};

export const consumeOtp = async (email: string, otp: string) => {
  // Compare and delete atomically so a newer code cannot be removed.
  await redis.eval(
    `if redis.call('GET', KEYS[1]) == ARGV[1] then
       return redis.call('DEL', KEYS[1], KEYS[2])
     end
     return 0`,
    2,
    `otp:${email}`,
    `otp_attempts:${email}`,
    otp,
  );
};

export const handleForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: 'user' | 'seller',
) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required!');
    }
    // Find user/seller in the db
    const user =
      userType === 'user' &&
      (await prisma.users.findUnique({ where: { email } }));
    if (!user) throw new ValidationError(`${userType} not found`);

    await sendOtp(user.name, email, 'forgot-password-user-email');

    res.status(200).json({
      message: 'OTP sent successfully. Please check your account.',
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyForgotPasswordOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new ValidationError('Email and otp are required!');
    }

    await verifyOtp(email, otp);
    await consumeOtp(email, otp);
    res.status(200).json({
      message: 'OTP verified. Password reset is not available yet.',
    });
  } catch (error) {
    return next(error);
  }
};
