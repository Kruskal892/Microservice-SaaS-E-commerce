// Run explicitly: node --experimental-strip-types --test apps/client/src/schemas/auth.schema.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { otpCodeSchema, signUpSchema, verifyOtpSchema } from './auth.schema.ts';

const valid = {
  name: ' Alex Smith ',
  email: ' alex@example.com ',
  password: ' a safe password ',
  confirmPassword: ' a safe password ',
};

test('OTP submission requires exactly four digits and preserves leading zeros', () => {
  assert.equal(otpCodeSchema.parse('0012'), '0012');
  for (const code of ['', '123', '12345', '12a4', ' 1234', '1234\n']) {
    assert.equal(otpCodeSchema.safeParse(code).success, false);
  }
});

test('sign-up trims contact fields and preserves passwords', () => {
  const result = signUpSchema.parse(valid);
  assert.equal(result.name, 'Alex Smith');
  assert.equal(result.email, 'alex@example.com');
  assert.equal(result.password, valid.password);
});

test('sign-up rejects invalid details and mismatched passwords', () => {
  for (const values of [
    { ...valid, name: ' ' },
    { ...valid, name: 'a'.repeat(101) },
    { ...valid, email: 'invalid' },
    { ...valid, email: `${'a'.repeat(243)}@example.com` },
    { ...valid, confirmPassword: '' },
    { ...valid, password: 'short', confirmPassword: 'short' },
    { ...valid, password: 'a'.repeat(129), confirmPassword: 'a'.repeat(129) },
  ]) {
    assert.equal(signUpSchema.safeParse(values).success, false);
  }

  const mismatch = signUpSchema.safeParse({
    ...valid,
    confirmPassword: 'different',
  });
  assert.equal(mismatch.success, false);
  if (!mismatch.success) {
    assert.ok(
      mismatch.error.issues.some(
        (issue) => issue.path[0] === 'confirmPassword',
      ),
    );
  }
});

test('OTP verification sends complete registration details and matches normalized email keys', () => {
  assert.deepEqual(
    verifyOtpSchema.parse({
      ...valid,
      email: ' Alex@Example.com ',
      otp: '0012',
    }),
    {
      name: 'Alex Smith',
      email: 'alex@example.com',
      password: valid.password,
      otp: '0012',
    },
  );

  for (const values of [
    { ...valid, name: undefined, otp: '1234' },
    { ...valid, email: '', otp: '1234' },
    { ...valid, password: '', otp: '1234' },
    { ...valid, otp: '12a4' },
  ]) {
    assert.equal(verifyOtpSchema.safeParse(values).success, false);
  }
});
