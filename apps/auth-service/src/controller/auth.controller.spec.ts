import type { Request, Response } from 'express';
import { ValidationError } from '@packages/error-handler';
import prisma from '@packages/libs/prisma';
import redis from '@packages/libs/redis';
import bcrypt from 'bcryptjs';
import { resetUserPassword, userVerification } from './auth.controller';
import { verifyForgotPasswordOtp, verifyOtp } from '../utils/auth.helper';

jest.mock('@packages/libs/prisma', () => ({
  __esModule: true,
  default: {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock('@packages/libs', () => ({
  prisma: jest.requireMock('@packages/libs/prisma').default,
}));
jest.mock('@packages/libs/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    eval: jest.fn(),
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
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
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
  jest.mocked(redis.get).mockResolvedValueOnce(null);
  await expect(verifyOtp(user.email, '1234')).rejects.toThrow(
    'Expired or invalid OTP!',
  );
  jest
    .mocked(redis.get)
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

test('recovery verification still consumes a valid code', async () => {
  const res = response();
  const next = jest.fn();
  await verifyForgotPasswordOtp(
    { body: { email: user.email, otp: '1234' } } as Request,
    res as unknown as Response,
    next,
  );
  expect(redis.eval).toHaveBeenCalledTimes(1);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(next).not.toHaveBeenCalled();
});

test('password reset fails closed without reading or changing an account', () => {
  const next = jest.fn();
  resetUserPassword(
    {
      body: { email: user.email, newPassword: 'attacker-password' },
    } as Request,
    response() as unknown as Response,
    next,
  );
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({ statusCode: 503 }),
  );
  expect(prisma.users.findUnique).not.toHaveBeenCalled();
  expect(prisma.users.update).not.toHaveBeenCalled();
  expect(bcrypt.hash).not.toHaveBeenCalled();
});
