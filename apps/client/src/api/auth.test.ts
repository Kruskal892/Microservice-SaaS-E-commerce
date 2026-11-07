// Run explicitly: node node_modules/jest/bin/jest.js --config apps/client/jest.config.cts --runInBand
import assert from 'node:assert/strict';
import { afterEach, expect, jest, test } from '@jest/globals';
import { AxiosError, AxiosHeaders } from 'axios';
import {
  getApiErrorMessage,
  getApiErrorRetryAfterSeconds,
  getApiMessage,
  getApiRetryAfterSeconds,
  forgotPasswordMutation,
  verifyRecoveryOtpMutation,
  resetPasswordMutation,
} from './auth';
import { api } from './client';

afterEach(() => jest.restoreAllMocks());

const fallback = 'Unable to request a verification code. Please try again.';

test('OTP cooldown accepts non-negative integer seconds only', () => {
  for (const seconds of [0, 31, 60, 1800, 3600]) {
    assert.equal(
      getApiRetryAfterSeconds({ retryAfterSeconds: seconds }),
      seconds,
    );
  }
  for (const value of [
    null,
    undefined,
    {},
    { retryAfterSeconds: '60' },
    { retryAfterSeconds: -1 },
    { retryAfterSeconds: 1.5 },
    { retryAfterSeconds: Infinity },
    { retryAfterSeconds: NaN },
  ]) {
    assert.equal(getApiRetryAfterSeconds(value), undefined);
  }
});

test('OTP restriction errors expose a validated server cooldown', () => {
  const error = new AxiosError('Request failed');
  error.response = {
    data: { details: { retryAfterSeconds: 31 } },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  assert.equal(getApiErrorRetryAfterSeconds(error), 31);
  for (const data of [
    null,
    undefined,
    {},
    { details: null },
    { details: { retryAfterSeconds: '31' } },
  ]) {
    error.response.data = data;
    assert.equal(getApiErrorRetryAfterSeconds(error), undefined);
  }
  assert.equal(
    getApiErrorRetryAfterSeconds(new Error('Network error')),
    undefined,
  );
});

test('API success and error messages use non-empty strings only', () => {
  assert.equal(
    getApiMessage({ message: 'OTP sent. Please check your account' }, fallback),
    'OTP sent. Please check your account',
  );

  for (const data of [
    null,
    undefined,
    '',
    {},
    { message: '' },
    { message: ' ' },
    { message: 42 },
  ]) {
    assert.equal(getApiMessage(data, fallback), fallback);
  }
});

test('API errors preserve server messages and use a safe fallback otherwise', () => {
  const error = new AxiosError('Request failed');
  error.response = {
    data: { message: 'User already exists with this email' },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };

  assert.equal(
    getApiErrorMessage(error, fallback),
    'User already exists with this email',
  );
  error.response.data = { message: { unexpected: true } };
  assert.equal(getApiErrorMessage(error, fallback), fallback);
  assert.equal(
    getApiErrorMessage(new AxiosError('Network Error'), fallback),
    fallback,
  );
  assert.equal(
    getApiErrorMessage(new Error('Internal details'), fallback),
    fallback,
  );
});

test('both Axios timeout codes preserve the registration-specific guidance', () => {
  const timeoutMessage =
    'The registration request timed out. Check your email before trying again.';

  for (const code of ['ECONNABORTED', 'ETIMEDOUT']) {
    assert.equal(
      getApiErrorMessage(
        new AxiosError('timeout', code),
        fallback,
        timeoutMessage,
      ),
      timeoutMessage,
    );
  }

  assert.equal(
    getApiErrorMessage(new AxiosError('timeout', 'ECONNABORTED'), fallback),
    'The request timed out. It may still have completed. Check before trying again.',
  );
});

test('recovery delivery normalizes email and preserves the server cooldown', async () => {
  assert.ok(forgotPasswordMutation.mutationFn);
  const post = jest.spyOn(api, 'post').mockResolvedValueOnce({
    data: { message: 'Code sent', retryAfterSeconds: 31 },
  });
  const result = await forgotPasswordMutation.mutationFn(
    { email: ' Alex@Example.COM ' },
    undefined as never,
  );
  assert.deepEqual(result, { message: 'Code sent', retryAfterSeconds: 31 });
  expect(post.mock.calls).toEqual([
    ['/api/forgot-password-user', { email: 'alex@example.com' }],
  ]);
  assert.equal(forgotPasswordMutation.retry, false);
});

test('recovery verification preserves leading zeroes and validates authorization', async () => {
  assert.ok(verifyRecoveryOtpMutation.mutationFn);
  const authorization = { resetToken: 'a'.repeat(64), expiresInSeconds: 300 };
  const post = jest
    .spyOn(api, 'post')
    .mockResolvedValueOnce({ data: authorization });
  assert.deepEqual(
    await verifyRecoveryOtpMutation.mutationFn(
      { email: ' Alex@Example.COM ', otp: '0012' },
      undefined as never,
    ),
    authorization,
  );
  expect(post.mock.calls).toEqual([
    [
      '/api/verify-forgot-password-user',
      { email: 'alex@example.com', otp: '0012' },
    ],
  ]);
  post.mockResolvedValueOnce({
    data: { message: 'Verified', resetToken: undefined },
  });
  await assert.rejects(
    verifyRecoveryOtpMutation.mutationFn(
      { email: 'alex@example.com', otp: '0012' },
      undefined as never,
    ),
  );
  assert.equal(verifyRecoveryOtpMutation.retry, false);
  assert.equal(verifyRecoveryOtpMutation.gcTime, 0);
});

test('password reset sends authorization and password without confirmation fields', async () => {
  assert.ok(resetPasswordMutation.mutationFn);
  const post = jest
    .spyOn(api, 'post')
    .mockResolvedValueOnce({ data: { message: 'Password changed' } });
  const payload = {
    email: ' Alex@Example.COM ',
    resetToken: 'a'.repeat(64),
    newPassword: ' new safe password ',
    confirmPassword: ' new safe password ',
  };
  assert.deepEqual(
    await resetPasswordMutation.mutationFn(payload, undefined as never),
    { message: 'Password changed' },
  );
  expect(post.mock.calls).toEqual([
    [
      '/api/reset-password-user',
      {
        email: 'alex@example.com',
        resetToken: payload.resetToken,
        newPassword: payload.newPassword,
      },
    ],
  ]);
  assert.equal(resetPasswordMutation.retry, false);
  assert.equal(resetPasswordMutation.gcTime, 0);
});

test('invalid recovery payloads fail before sending HTTP requests', async () => {
  assert.ok(forgotPasswordMutation.mutationFn);
  assert.ok(verifyRecoveryOtpMutation.mutationFn);
  assert.ok(resetPasswordMutation.mutationFn);
  const post = jest.spyOn(api, 'post');
  await assert.rejects(
    forgotPasswordMutation.mutationFn({ email: 'invalid' }, undefined as never),
  );
  await assert.rejects(
    verifyRecoveryOtpMutation.mutationFn(
      { email: 'alex@example.com', otp: '123' },
      undefined as never,
    ),
  );
  await assert.rejects(
    resetPasswordMutation.mutationFn(
      {
        email: 'alex@example.com',
        resetToken: '',
        newPassword: 'safe password',
      },
      undefined as never,
    ),
  );
  assert.equal(post.mock.calls.length, 0);
});
