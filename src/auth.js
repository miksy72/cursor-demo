import crypto from 'node:crypto';
import { isValidEmail } from './validator.js';

const TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * 환경 변수에서 API 시크릿을 읽는다.
 * @returns {string} 토큰 서명에 사용할 시크릿
 */
function getApiSecret() {
  const secret = process.env.LOGIN_API_SECRET;
  if (!secret) {
    throw new Error('LOGIN_API_SECRET 환경 변수가 설정되지 않았습니다.');
  }
  return secret;
}

/**
 * 비밀번호를 scrypt로 해시한다.
 * @param {string} password - 평문 비밀번호
 * @param {string} salt - 솔트(hex)
 * @returns {string} 해시(hex)
 */
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * 데모 사용자 정보를 환경 변수에서 구성한다.
 * @returns {{ email: string, passwordHash: string, salt: string }}
 */
function getDemoUser() {
  const email = process.env.DEMO_USER_EMAIL ?? 'demo@example.com';
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password) {
    throw new Error('DEMO_USER_PASSWORD 환경 변수가 설정되지 않았습니다.');
  }
  const salt = process.env.DEMO_USER_SALT ?? 'cursor-demo-salt';
  return {
    email: email.toLowerCase(),
    passwordHash: hashPassword(password, salt),
    salt,
  };
}

/**
 * 이메일과 비밀번호가 일치하는지 검증한다.
 * @param {string} email - 로그인 이메일
 * @param {string} password - 로그인 비밀번호
 * @returns {boolean} 인증 성공 여부
 */
export function verifyCredentials(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    return false;
  }

  const demoUser = getDemoUser();
  if (email.trim().toLowerCase() !== demoUser.email) {
    return false;
  }

  const inputHash = hashPassword(password, demoUser.salt);
  const expected = Buffer.from(demoUser.passwordHash, 'hex');
  const actual = Buffer.from(inputHash, 'hex');

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}

/**
 * 인증된 사용자용 액세스 토큰을 발급한다.
 * @param {string} email - 사용자 이메일
 * @returns {string} 서명된 액세스 토큰
 */
export function createAccessToken(email) {
  const payload = JSON.stringify({
    sub: email.toLowerCase(),
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const signature = crypto
    .createHmac('sha256', getApiSecret())
    .update(payload)
    .digest('hex');
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${signature}`;
}

/**
 * 로그인 요청을 처리하고 토큰 또는 오류를 반환한다.
 * @param {{ email?: unknown, password?: unknown }} body - 요청 본문
 * @returns {{ ok: true, token: string, email: string } | { ok: false, status: number, message: string }}
 */
export function login(body) {
  const email = body?.email;
  const password = body?.password;

  if (typeof email !== 'string' || email.trim() === '') {
    return { ok: false, status: 400, message: '이메일이 필요합니다.' };
  }
  if (!isValidEmail(email.trim())) {
    return { ok: false, status: 400, message: '이메일 형식이 올바르지 않습니다.' };
  }
  if (typeof password !== 'string' || password === '') {
    return { ok: false, status: 400, message: '비밀번호가 필요합니다.' };
  }

  if (!verifyCredentials(email, password)) {
    return { ok: false, status: 401, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  return {
    ok: true,
    token: createAccessToken(normalizedEmail),
    email: normalizedEmail,
  };
}
