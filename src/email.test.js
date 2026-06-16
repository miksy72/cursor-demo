import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractEmails, isValidEmail, getValidEmails, uniqueValidEmails } from './email.js';

test('extractEmails returns email strings from members', () => {
  const members = [{ email: 'a@b.com' }, { email: 'c@d.com' }];
  assert.deepEqual(extractEmails(members), ['a@b.com', 'c@d.com']);
});

test('extractEmails returns empty array for non-array input', () => {
  assert.deepEqual(extractEmails(null), []);
  assert.deepEqual(extractEmails('not-an-array'), []);
});

test('isValidEmail validates email format', () => {
  assert.equal(isValidEmail('alice@example.com'), true);
  assert.equal(isValidEmail('user+tag@example.com'), true);
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail(null), false);
  assert.equal(isValidEmail('a'.repeat(64) + '@example.com'), true);
  assert.equal(isValidEmail('a'.repeat(65) + '@example.com'), false);
  assert.equal(isValidEmail('a'.repeat(243) + '@example.com'), false);
});

test('getValidEmails returns only valid emails', () => {
  const members = [
    { email: 'good@example.com' },
    { email: 'bad-email' },
    { email: 'also@valid.org' },
  ];
  assert.deepEqual(getValidEmails(members), ['good@example.com', 'also@valid.org']);
});

test('getValidEmails returns empty array for non-array input', () => {
  assert.deepEqual(getValidEmails(undefined), []);
});

test('uniqueValidEmails removes duplicate valid emails', () => {
  const members = [
    { email: 'a@example.com' },
    { email: 'a@example.com' },
    { email: 'b@example.com' },
  ];
  assert.deepEqual(uniqueValidEmails(members), ['a@example.com', 'b@example.com']);
});
