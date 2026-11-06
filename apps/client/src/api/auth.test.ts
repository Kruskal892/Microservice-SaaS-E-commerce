// Run explicitly: node node_modules/jest/bin/jest.js --config apps/client/jest.config.cts --runInBand
import assert from 'node:assert/strict';
import { test } from '@jest/globals';
import { AxiosError, AxiosHeaders } from 'axios';
import {
  getApiErrorMessage,
  getApiErrorRetryAfterSeconds,
  getApiMessage,
  getApiRetryAfterSeconds,
} from './auth';

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
