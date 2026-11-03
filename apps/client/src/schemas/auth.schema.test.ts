// Run explicitly: node --experimental-strip-types --test apps/client/src/schemas/auth.schema.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { signUpSchema } from './auth.schema.ts';

const valid = {
  name: ' Alex Smith ',
  email: ' alex@example.com ',
  password: ' a safe password ',
  confirmPassword: ' a safe password ',
};

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
