import type { Request, Response } from 'express';
import { ValidationError } from '@packages/error-handler';
import prisma from '@packages/libs/prisma';
import redis from '@packages/libs/redis';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { sendEmail } from '../mail';
import { resetUserPassword } from '../controller/auth.controller';
import { handleForgotPassword, verifyForgotPasswordOtp } from './auth.helper';
import {
  completePasswordReset,
  issuePasswordResetToken,
} from './password-reset';

jest.mock('@packages/libs/prisma', () => ({
  __esModule: true,
  default: {
    users: { findUnique: jest.fn(), updateMany: jest.fn() },
  },
}));
jest.mock('@packages/libs', () => ({
  prisma: jest.requireMock('@packages/libs/prisma').default,
}));
jest.mock('@packages/libs/redis', () => ({
  __esModule: true,
  default: {
    status: 'ready',
    get: jest.fn(),
    set: jest.fn(),
    eval: jest.fn(),
    ttl: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  },
}));
jest.mock('../mail', () => ({ sendEmail: jest.fn() }));
jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: { hash: jest.fn() },
}));

const email = 'alex@example.com';
const user = {
  id: '507f1f77bcf86cd799439011',
  name: 'Alex',
  email,
  password: 'old-password-hash',
  following: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};
const resetToken = 'a'.repeat(64);
const grant = crypto
  .createHash('sha256')
  .update(`${user.id}:${user.password}:${resetToken}`)
  .digest('hex');
const payload = {
  email: ' Alex@Example.com ',
  resetToken,
  newPassword: 'new secure password',
};

function response() {
  const res = { status: jest.fn(), json: jest.fn(), set: jest.fn() };
  res.status.mockReturnValue(res);
  res.set.mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(prisma.users.findUnique).mockResolvedValue(user);
  jest.mocked(prisma.users.updateMany).mockResolvedValue({ count: 1 });
  jest.mocked(redis.get).mockResolvedValue(grant);
  jest.mocked(redis.eval).mockResolvedValue(1);
  jest.mocked(redis.set).mockResolvedValue('OK');
  jest.mocked(redis.incr).mockResolvedValue(1);
  jest.mocked(redis.ttl).mockResolvedValue(60);
  (bcrypt.hash as jest.Mock).mockResolvedValue('new-password-hash');
  jest.mocked(sendEmail).mockResolvedValue(undefined);
});

test('recovery normalizes email, uses a purpose-specific code and returns cooldown', async () => {
  jest.mocked(redis.get).mockResolvedValue(null);
  const res = response();
  const next = jest.fn();
  await handleForgotPassword(
    { body: { email: payload.email } } as Request,
    res as unknown as Response,
    next,
    'user',
  );
  expect(prisma.users.findUnique).toHaveBeenCalledWith({ where: { email } });
  expect(sendEmail).toHaveBeenCalledWith(
    email,
    'Verify your email',
    'forgot-password-user-email',
    {
      name: 'Alex',
      otp: expect.stringMatching(/^[0-9]{4}$/),
    },
  );
  expect(redis.set).toHaveBeenCalledWith(
    `password_reset_otp:${email}`,
    expect.any(String),
    'EX',
    300,
  );
  expect(redis.set).not.toHaveBeenCalledWith(
    `otp:${email}`,
    expect.anything(),
    'EX',
    300,
  );
  expect(res.json).toHaveBeenCalledWith({
    message: 'OTP sent successfully. Please check your account.',
    retryAfterSeconds: 60,
  });
  expect(next).not.toHaveBeenCalled();
});

test('verification returns a random token and stores only its digest bound to the account', async () => {
  const authorization = await issuePasswordResetToken(email, '1234');
  expect(authorization).toEqual({
    resetToken: expect.stringMatching(/^[a-f0-9]{64}$/),
    expiresInSeconds: 300,
  });
  expect(redis.eval).toHaveBeenCalledWith(
    expect.any(String),
    4,
    `password_reset_otp:${email}`,
    `password_reset_otp_attempts:${email}`,
    `otp_lock:${email}`,
    `password_reset_grant:${email}`,
    '1234',
    crypto
      .createHash('sha256')
      .update(`${user.id}:${user.password}:${authorization.resetToken}`)
      .digest('hex'),
    300,
  );
  expect(JSON.stringify(jest.mocked(redis.eval).mock.calls)).not.toContain(
    authorization.resetToken,
  );
  expect(prisma.users.updateMany).not.toHaveBeenCalled();
});

test.each([
  [-1, 'Expired or invalid'],
  [-2, 'Account is locked'],
  [-3, 'Incorrect OTP'],
  [0, 'Expired or invalid'],
])(
  'does not authorize failed verification result %s',
  async (result, message) => {
    jest.mocked(redis.eval).mockResolvedValueOnce(result as number);
    await expect(issuePasswordResetToken(email, '1234')).rejects.toThrow(
      message as string,
    );
    expect(prisma.users.updateMany).not.toHaveBeenCalled();
  },
);

test.each([undefined, null, 1234, '', '123', '12345', '12a4', '1234\n'])(
  'rejects malformed recovery OTP before infrastructure access: %p',
  async (otp) => {
    await expect(issuePasswordResetToken(email, otp)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(prisma.users.findUnique).not.toHaveBeenCalled();
    expect(redis.eval).not.toHaveBeenCalled();
  },
);

test.each([undefined, null, [], { email: 'invalid', otp: '1234' }])(
  'verification rejects malformed request bodies: %p',
  async (body) => {
    const next = jest.fn();
    await verifyForgotPasswordOtp(
      { body } as Request,
      response() as unknown as Response,
      next,
    );
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(prisma.users.findUnique).not.toHaveBeenCalled();
    expect(redis.eval).not.toHaveBeenCalled();
  },
);

test('a successful reset consumes the grant before a conditional, hashed password write', async () => {
  const res = response();
  const next = jest.fn();
  await resetUserPassword(
    { body: payload } as Request,
    res as unknown as Response,
    next,
  );
  expect(redis.get).toHaveBeenCalledWith(`password_reset_grant:${email}`);
  expect(bcrypt.hash).toHaveBeenCalledWith(payload.newPassword, 10);
  expect(redis.eval).toHaveBeenCalledWith(
    expect.any(String),
    3,
    `password_reset_grant:${email}`,
    `password_reset_otp:${email}`,
    `password_reset_otp_attempts:${email}`,
    grant,
  );
  expect(prisma.users.updateMany).toHaveBeenCalledWith({
    where: { id: user.id, email, password: user.password },
    data: { password: 'new-password-hash' },
  });
  expect(jest.mocked(redis.eval).mock.invocationCallOrder[0]).toBeLessThan(
    jest.mocked(prisma.users.updateMany).mock.invocationCallOrder[0],
  );
  expect(res.status).toHaveBeenCalledWith(200);
  expect(sendEmail).toHaveBeenCalledWith(
    email,
    'Your Eshop password was changed',
    'password-reset-success-email',
    {},
  );
  expect(next).not.toHaveBeenCalled();
});

test.each([
  undefined,
  null,
  [],
  { ...payload, email: 'invalid' },
  { ...payload, resetToken: undefined },
  { ...payload, resetToken: 'a'.repeat(63) },
  { ...payload, resetToken: resetToken + '\n' },
  { ...payload, newPassword: 'short' },
  { ...payload, newPassword: 'a'.repeat(129) },
])(
  'rejects invalid reset payloads before Redis or hashing: %p',
  async (body) => {
    await expect(completePasswordReset(body)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(redis.get).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(prisma.users.updateMany).not.toHaveBeenCalled();
  },
);

test.each([null, '0'.repeat(64), '{}'])(
  'rejects expired, wrong-account, or mismatched grants: %p',
  async (stored) => {
    jest.mocked(redis.get).mockResolvedValueOnce(stored);
    await expect(completePasswordReset(payload)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(redis.eval).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(prisma.users.updateMany).not.toHaveBeenCalled();
  },
);

test('a token cannot be used for another email', async () => {
  jest
    .mocked(redis.get)
    .mockImplementation(async (key) =>
      key === `password_reset_grant:${email}` ? grant : null,
    );
  await expect(
    completePasswordReset({ ...payload, email: 'other@example.com' }),
  ).rejects.toThrow('Invalid or expired');
  expect(prisma.users.updateMany).not.toHaveBeenCalled();
});

test('concurrent submissions can update the account only once', async () => {
  jest.mocked(redis.eval).mockResolvedValueOnce(1).mockResolvedValueOnce(0);
  const results = await Promise.allSettled([
    completePasswordReset(payload),
    completePasswordReset(payload),
  ]);
  expect(results.map((result) => result.status).sort()).toEqual([
    'fulfilled',
    'rejected',
  ]);
  expect(prisma.users.updateMany).toHaveBeenCalledTimes(1);
});

test('expiration or replacement during hashing prevents a write', async () => {
  jest.mocked(redis.eval).mockResolvedValueOnce(0);
  await expect(completePasswordReset(payload)).rejects.toThrow(
    'Invalid or expired',
  );
  expect(prisma.users.updateMany).not.toHaveBeenCalled();
});

test('a grant issued before a different password change cannot overwrite it', async () => {
  jest
    .mocked(prisma.users.findUnique)
    .mockResolvedValueOnce({ ...user, password: 'changed-hash' });
  await expect(completePasswordReset(payload)).rejects.toThrow(
    'Invalid or expired',
  );
  expect(sendEmail).not.toHaveBeenCalled();
  expect(prisma.users.updateMany).not.toHaveBeenCalled();
});

test('a password change between token validation and persistence rejects the write', async () => {
  jest.mocked(prisma.users.updateMany).mockResolvedValueOnce({ count: 0 });
  await expect(completePasswordReset(payload)).rejects.toThrow(
    'Invalid or expired',
  );
  expect(sendEmail).not.toHaveBeenCalled();
});

test.each(['hash', 'redis', 'database'])(
  'fails closed after a %s failure',
  async (failure) => {
    const error = new Error('Temporary failure');
    if (failure === 'hash')
      (bcrypt.hash as jest.Mock).mockRejectedValueOnce(error);
    if (failure === 'redis')
      jest.mocked(redis.eval).mockRejectedValueOnce(error);
    if (failure === 'database')
      jest.mocked(prisma.users.updateMany).mockRejectedValueOnce(error);
    await expect(completePasswordReset(payload)).rejects.toBe(error);
    if (failure !== 'database')
      expect(prisma.users.updateMany).not.toHaveBeenCalled();
    if (failure === 'hash') expect(redis.eval).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  },
);

test('notification failure does not report a committed reset as failed', async () => {
  jest.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP unavailable'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    await expect(completePasswordReset(payload)).resolves.toBeUndefined();
    expect(prisma.users.updateMany).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledTimes(1);
  } finally {
    log.mockRestore();
  }
});
