import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@packages/libs';
import { isAuthenticated } from '@packages/middleware';

jest.mock('@packages/libs', () => ({
  prisma: { users: { findUnique: jest.fn() } },
}));

const secret = 'test-access-secret';
const user = { id: '507f1f77bcf86cd799439011' };
const claims = { id: user.id, role: 'user' };
let originalSecret: string | undefined;

beforeEach(() => {
  jest.resetAllMocks();
  originalSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
  process.env.JWT_ACCESS_TOKEN_SECRET = secret;
  (prisma.users.findUnique as jest.Mock).mockResolvedValue(user);
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_ACCESS_TOKEN_SECRET;
  } else {
    process.env.JWT_ACCESS_TOKEN_SECRET = originalSecret;
  }
});

async function authenticate(token?: string) {
  const req = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    user: undefined,
  };
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  const next = jest.fn();
  await isAuthenticated(req, res as unknown as Response, next);
  return { req, res, next };
}

test('forwards the original database failure without sending a 401 response', async () => {
  const error = new Error('Database unavailable');
  jest.mocked(prisma.users.findUnique).mockRejectedValue(error);
  const { res, next } = await authenticate(jwt.sign(claims, secret));
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(error);
  expect(res.status).not.toHaveBeenCalled();
  expect(res.json).not.toHaveBeenCalled();
});

test('forwards missing server configuration without rejecting the credentials', async () => {
  delete process.env.JWT_ACCESS_TOKEN_SECRET;
  const { res, next } = await authenticate(jwt.sign(claims, secret));
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'JWT access token secret is not configured',
    }),
  );
  expect(prisma.users.findUnique).not.toHaveBeenCalled();
  expect(res.status).not.toHaveBeenCalled();
});

test.each([
  ['missing', () => undefined],
  ['malformed', () => 'invalid'],
  ['expired', () => jwt.sign(claims, secret, { expiresIn: -1 })],
  ['wrong signature', () => jwt.sign(claims, 'another-secret')],
  ['not yet active', () => jwt.sign(claims, secret, { notBefore: '1h' })],
  ['missing claims', () => jwt.sign({ id: user.id }, secret)],
])('returns 401 for a %s token', async (_name, token) => {
  const { res, next } = await authenticate(token());
  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
  expect(prisma.users.findUnique).not.toHaveBeenCalled();
});

test('attaches the account and continues for a valid token', async () => {
  const { req, res, next } = await authenticate(jwt.sign(claims, secret));
  expect(req.user).toEqual(user);
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith();
  expect(res.status).not.toHaveBeenCalled();
});

test('returns 401 if the authenticated account no longer exists', async () => {
  jest.mocked(prisma.users.findUnique).mockResolvedValue(null);
  const { res, next } = await authenticate(jwt.sign(claims, secret));
  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});
