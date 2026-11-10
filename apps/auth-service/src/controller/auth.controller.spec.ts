import type { Request, Response } from 'express';
import { AuthError, ValidationError } from '@packages/error-handler';
import prisma from '@packages/libs/prisma';
import redis from '@packages/libs/redis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  refreshToken,
  resetUserPassword,
  userRegistration,
  userVerification,
} from './auth.controller';
import {
  sendOtp,
  verifyForgotPasswordOtp,
  verifyOtp,
} from '../utils/auth.helper';
import { sendEmail } from '../mail';

jest.mock('@packages/libs/prisma', () => ({
  __esModule: true,
  default: {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
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
    del: jest.fn(),
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

const registration = {
  name: ' Alex Smith ',
  email: ' Alex@Example.com ',
  password: 'a safe password',
  otp: '1234',
};
const user = {
  id: 'user-id',
  name: 'Alex Smith',
  email: 'alex@example.com',
  password: 'hashed-password',
  following: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

function response() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    set: jest.fn(),
    cookie: jest.fn(),
  };
  res.status.mockReturnValue(res);
  res.set.mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(prisma.users.findUnique).mockResolvedValue(null);
  jest.mocked(prisma.users.create).mockResolvedValue(user);
  (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  jest
    .mocked(redis.get)
    .mockImplementation(async (key) =>
      key === 'otp:alex@example.com' ? '1234' : null,
    );
  jest.mocked(redis.eval).mockResolvedValue(2);
  jest.mocked(redis.ttl).mockResolvedValue(45);
  jest.mocked(redis.set).mockResolvedValue('OK');
  jest.mocked(redis.incr).mockResolvedValue(1);
  jest.mocked(redis.expire).mockResolvedValue(1);
});

describe('refreshToken', () => {
  const refreshSecret = 'test-refresh-secret';
  const accessSecret = 'test-access-secret';
  const claims = { id: user.id, role: 'user' };
  let originalRefreshSecret: string | undefined;
  let originalAccessSecret: string | undefined;

  beforeEach(() => {
    originalRefreshSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
    originalAccessSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
    process.env.JWT_REFRESH_TOKEN_SECRET = refreshSecret;
    process.env.JWT_ACCESS_TOKEN_SECRET = accessSecret;
    jest.mocked(prisma.users.findUnique).mockResolvedValue(user);
  });

  afterEach(() => {
    if (originalRefreshSecret === undefined) {
      delete process.env.JWT_REFRESH_TOKEN_SECRET;
    } else {
      process.env.JWT_REFRESH_TOKEN_SECRET = originalRefreshSecret;
    }
    if (originalAccessSecret === undefined) {
      delete process.env.JWT_ACCESS_TOKEN_SECRET;
    } else {
      process.env.JWT_ACCESS_TOKEN_SECRET = originalAccessSecret;
    }
  });

  test.each([
    ['missing', () => ({})],
    ['malformed', () => ({ refresh_token: 'invalid' })],
    [
      'expired',
      () => ({
        refresh_token: jwt.sign(claims, refreshSecret, { expiresIn: -1 }),
      }),
    ],
    [
      'wrong signature',
      () => ({ refresh_token: jwt.sign(claims, 'another-secret') }),
    ],
    [
      'not yet active',
      () => ({
        refresh_token: jwt.sign(claims, refreshSecret, { notBefore: '1h' }),
      }),
    ],
    [
      'missing claims',
      () => ({ refresh_token: jwt.sign({ id: user.id }, refreshSecret) }),
    ],
  ])(
    'returns an authentication error for a %s token',
    async (_name, cookies) => {
      const next = jest.fn();
      const res = response();
      await refreshToken(
        { cookies: cookies() } as Request,
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(AuthError));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(prisma.users.findUnique).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    },
  );

  test('issues a verifiable access cookie for a valid refresh token', async () => {
    const next = jest.fn();
    const res = response();
    await refreshToken(
      {
        cookies: { refresh_token: jwt.sign(claims, refreshSecret) },
      } as Request,
      res as unknown as Response,
      next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
    const decoded = jwt.verify(res.cookie.mock.calls[0][1], accessSecret);
    expect(decoded).toMatchObject(claims);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('rejects a refresh token whose account no longer exists', async () => {
    jest.mocked(prisma.users.findUnique).mockResolvedValue(null);
    const next = jest.fn();
    await refreshToken(
      {
        cookies: { refresh_token: jwt.sign(claims, refreshSecret) },
      } as Request,
      response() as unknown as Response,
      next,
    );
    expect(next).toHaveBeenCalledWith(expect.any(AuthError));
  });

  test.each(['database', 'configuration'])(
    'preserves %s failures as server errors',
    async (failure) => {
      const databaseError = new Error('Database unavailable');
      if (failure === 'database') {
        jest.mocked(prisma.users.findUnique).mockRejectedValue(databaseError);
      } else {
        delete process.env.JWT_REFRESH_TOKEN_SECRET;
      }
      const next = jest.fn();
      await refreshToken(
        {
          cookies: { refresh_token: jwt.sign(claims, refreshSecret) },
        } as Request,
        response() as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0]).not.toBeInstanceOf(AuthError);
      if (failure === 'database') {
        expect(next).toHaveBeenCalledWith(databaseError);
      }
    },
  );
});

test('registration and resend send to the normalized submitted email and return cooldown', async () => {
  const res = response();
  const next = jest.fn();
  await userRegistration(
    { body: registration } as Request,
    res as unknown as Response,
    next,
  );
  expect(sendEmail).toHaveBeenCalledWith(
    'alex@example.com',
    'Verify your email',
    'user-activation-mail',
    { name: 'Alex Smith', otp: expect.stringMatching(/^[0-9]{4}$/) },
  );
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ retryAfterSeconds: 60 }),
  );
  expect(prisma.users.create).not.toHaveBeenCalled();
  expect(redis.set).toHaveBeenCalledWith(
    'otp_cooldown:alex@example.com',
    'true',
    'EX',
    60,
    'NX',
  );
  expect(redis.set).toHaveBeenCalledWith(
    'otp:alex@example.com',
    expect.stringMatching(/^[0-9]{4}$/),
    'EX',
    300,
  );
  expect(jest.mocked(sendEmail).mock.invocationCallOrder[0]).toBeLessThan(
    jest.mocked(redis.set).mock.invocationCallOrder[1],
  );
  expect(next).not.toHaveBeenCalled();
});

test.each([
  ['otp_lock:alex@example.com', 1800, 'Account is locked'],
  ['otp_spam_lock:alex@example.com', 3600, 'Too many OTP requests'],
])(
  'lock %s prevents delivery and supplies the server wait',
  async (key, seconds, message) => {
    jest
      .mocked(redis.get)
      .mockImplementation(async (requestedKey) =>
        requestedKey === key ? 'locked' : null,
      );
    jest.mocked(redis.ttl).mockResolvedValueOnce(seconds as number);
    await expect(
      sendOtp(user.name, user.email, 'user-activation-mail'),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining(message as string),
      details: { retryAfterSeconds: seconds },
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(redis.incr).not.toHaveBeenCalled();
  },
);

test('a concurrent resend rejected by SET NX cannot deliver another code', async () => {
  (redis.set as jest.Mock)
    .mockResolvedValueOnce('OK')
    .mockResolvedValueOnce(null);
  const results = await Promise.allSettled([
    sendOtp(user.name, user.email, 'user-activation-mail'),
    sendOtp(user.name, user.email, 'user-activation-mail'),
  ]);
  expect(results.map((result) => result.status)).toEqual([
    'fulfilled',
    'rejected',
  ]);
  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(redis.incr).toHaveBeenCalledTimes(1);
  expect(results[1]).toMatchObject({
    reason: { details: { retryAfterSeconds: 45 } },
  });
});

test('the third request sets the spam lock without sending email', async () => {
  jest.mocked(redis.incr).mockResolvedValueOnce(3);
  await expect(
    sendOtp(user.name, user.email, 'user-activation-mail'),
  ).rejects.toMatchObject({
    statusCode: 400,
    details: { retryAfterSeconds: 3600 },
  });
  expect(redis.set).toHaveBeenCalledWith(
    'otp_spam_lock:alex@example.com',
    'locked',
    'EX',
    3600,
  );
  expect(sendEmail).not.toHaveBeenCalled();
});

test('delivery failure preserves the previous code and returns the remaining cooldown', async () => {
  jest.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP failed'));
  await expect(
    sendOtp(user.name, user.email, 'user-activation-mail'),
  ).rejects.toMatchObject({
    statusCode: 503,
    details: { retryAfterSeconds: 45 },
  });
  expect(redis.set).toHaveBeenCalledTimes(1);
  expect(redis.expire).not.toHaveBeenCalledWith(
    'otp_cooldown:alex@example.com',
    60,
  );
  expect(redis.del).not.toHaveBeenCalled();
});

test('OTP storage failure cannot report a successful resend', async () => {
  jest
    .mocked(redis.set)
    .mockResolvedValueOnce('OK')
    .mockRejectedValueOnce(new Error('Redis failed'));
  await expect(
    sendOtp(user.name, user.email, 'user-activation-mail'),
  ).rejects.toMatchObject({ statusCode: 503 });
});

test.each([
  undefined,
  null,
  [],
  { ...registration, name: ' ' },
  { ...registration, name: 'a'.repeat(101) },
  { ...registration, email: 'invalid' },
  { ...registration, password: 'x' },
  { ...registration, password: 'a'.repeat(129) },
])(
  'rejects invalid registration details before database access: %p',
  async (body) => {
    const next = jest.fn();
    await userVerification(
      { body } as Request,
      response() as unknown as Response,
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(prisma.users.findUnique).not.toHaveBeenCalled();
    expect(redis.get).not.toHaveBeenCalled();
  },
);

test('normalizes details and consumes the code only after account creation', async () => {
  const res = response();
  const next = jest.fn();
  await userVerification(
    { body: registration } as Request,
    res as unknown as Response,
    next,
  );
  expect(prisma.users.create).toHaveBeenCalledWith({
    data: { name: user.name, email: user.email, password: user.password },
  });
  expect(redis.eval).toHaveBeenCalledWith(
    expect.any(String),
    2,
    'otp:alex@example.com',
    'otp_attempts:alex@example.com',
    '1234',
  );
  expect(
    jest.mocked(prisma.users.create).mock.invocationCallOrder[0],
  ).toBeLessThan(jest.mocked(redis.eval).mock.invocationCallOrder[0]);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(next).not.toHaveBeenCalled();
});

test.each(['database', 'hashing'])(
  'keeps the valid OTP after a %s failure',
  async (failure) => {
    const error = new Error('Temporary failure');
    if (failure === 'database') {
      jest.mocked(prisma.users.create).mockRejectedValueOnce(error);
    } else {
      (bcrypt.hash as jest.Mock).mockRejectedValueOnce(error);
    }
    const res = response();
    const next = jest.fn();
    await userVerification(
      { body: registration } as Request,
      res as unknown as Response,
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
    expect(redis.del).not.toHaveBeenCalled();
    expect(redis.eval).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  },
);

test.each([undefined, null, 1234, '', '123', '12345', '12a4', '1234\n'])(
  'rejects malformed OTPs before Redis access: %p',
  async (otp) => {
    await expect(verifyOtp(user.email, otp)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(redis.get).not.toHaveBeenCalled();
  },
);

test('forwards an incorrect OTP error exactly once and does not create an account', async () => {
  const next = jest.fn();
  await userVerification(
    { body: { ...registration, otp: '9999' } } as Request,
    response() as unknown as Response,
    next,
  );
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Incorrect OTP. 2 attempts left' }),
  );
  expect(prisma.users.create).not.toHaveBeenCalled();
});

test('rejects expired codes and locks the third failed attempt', async () => {
  jest
    .mocked(redis.get)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(null);
  await expect(verifyOtp(user.email, '1234')).rejects.toThrow(
    'Expired or invalid OTP!',
  );
  jest
    .mocked(redis.get)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce('1234')
    .mockResolvedValueOnce('2');
  await expect(verifyOtp(user.email, '9999')).rejects.toThrow(
    'Too many failed attempts',
  );
  expect(redis.set).toHaveBeenCalledWith(
    'otp_lock:alex@example.com',
    'locked',
    'EX',
    1800,
  );
  expect(redis.del).toHaveBeenCalledWith(
    'otp:alex@example.com',
    'otp_attempts:alex@example.com',
  );
});

test('a verification lock rejects even a matching code issued by an overlapping resend', async () => {
  jest
    .mocked(redis.get)
    .mockImplementation(async (key) =>
      key === 'otp_lock:alex@example.com' ? 'locked' : '1234',
    );
  await expect(verifyOtp(user.email, '1234')).rejects.toThrow(
    'Account is locked',
  );
  expect(redis.del).not.toHaveBeenCalled();
});

test('handles a concurrent duplicate without consuming the code twice', async () => {
  jest.mocked(prisma.users.create).mockRejectedValueOnce({ code: 'P2002' });
  const next = jest.fn();
  const res = response();
  await Promise.all([
    userVerification(
      { body: registration } as Request,
      res as unknown as Response,
      next,
    ),
    userVerification(
      { body: registration } as Request,
      res as unknown as Response,
      next,
    ),
  ]);
  expect(redis.eval).toHaveBeenCalledTimes(1);
  expect(res.json).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
});

test('still reports success if OTP cleanup fails after the account is committed', async () => {
  jest.mocked(redis.eval).mockRejectedValueOnce(new Error('Redis unavailable'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    const res = response();
    const next = jest.fn();
    await userVerification(
      { body: registration } as Request,
      res as unknown as Response,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(1);
  } finally {
    log.mockRestore();
  }
});

test('recovery verification consumes a valid code and returns reset authorization', async () => {
  jest.mocked(prisma.users.findUnique).mockResolvedValueOnce(user);
  jest.mocked(redis.eval).mockResolvedValueOnce(1);
  const res = response();
  const next = jest.fn();
  await verifyForgotPasswordOtp(
    { body: { email: user.email, otp: '1234' } } as Request,
    res as unknown as Response,
    next,
  );
  expect(redis.eval).toHaveBeenCalledTimes(1);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({
    message: 'OTP verified. You can now reset your password.',
    resetToken: expect.stringMatching(/^[a-f0-9]{64}$/),
    expiresInSeconds: 300,
  });
  expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
  expect(next).not.toHaveBeenCalled();
});

test('password reset rejects requests without authorization before account access', async () => {
  const next = jest.fn();
  await resetUserPassword(
    {
      body: { email: user.email, newPassword: 'attacker-password' },
    } as Request,
    response() as unknown as Response,
    next,
  );
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({ statusCode: 400 }),
  );
  expect(prisma.users.findUnique).not.toHaveBeenCalled();
  expect(prisma.users.update).not.toHaveBeenCalled();
  expect(prisma.users.updateMany).not.toHaveBeenCalled();
  expect(bcrypt.hash).not.toHaveBeenCalled();
});
