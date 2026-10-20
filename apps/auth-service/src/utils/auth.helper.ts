import { ValidationError } from '@packages/error-handler';
import redis from '@packages/libs/redis';
import crypto from 'node:crypto';
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

// shortcut: OTP counters are sequential; make admission atomic before concurrent public traffic.
export const checkOtpRestrictions = async (email: string) => {
  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError('Account is locked. Try again after 30 minutes');
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError('Too many OTP requests. Try again after 1 hour');
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError(
      'Please wait 1 minute before requesting another OTP',
    );
  }
};

export const trackOtpRequests = async (email: string) => {
  const key = `otp_request_count:${email}`;
  const requests = parseInt((await redis.get(key)) || '0', 10);
  if (requests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600);
    throw new ValidationError('Too many OTP requests. Try again after 1 hour');
  }
  await redis.set(key, requests + 1, 'EX', 3600);
};

export const sendOtp = async (
  name: string,
  email: string,
  template: string,
) => {
  const otp = crypto.randomInt(1000, 10000).toString();
  await sendEmail(email, 'Verify your email', template, { name, otp });
  await redis.set(`otp:${email}`, otp, 'EX', 300);
  await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60);
};
