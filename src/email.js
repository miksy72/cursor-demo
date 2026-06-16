import { isValidEmail } from './validator.js';

/**
 * 사용자 배열에서 email 필드를 추출한다.
 * @param {unknown} users - email 필드를 가진 객체 배열
 * @returns {string[]} 추출된 이메일 배열
 */
export function extractEmails(users) {
  if (!Array.isArray(users)) {
    return [];
  }
  return users.map((user) => user.email);
}

/**
 * 사용자 배열에서 유효한 이메일만 추출한다.
 * @param {unknown} users - email 필드를 가진 객체 배열
 * @returns {string[]} 유효한 이메일 배열
 */
export function getValidEmails(users) {
  return extractEmails(users).filter(isValidEmail);
}

/**
 * 유효한 이메일 중복을 제거한다.
 * @param {unknown} users - email 필드를 가진 객체 배열
 * @returns {string[]} 중복 제거된 유효 이메일 배열
 */
export function uniqueValidEmails(users) {
  return [...new Set(getValidEmails(users))];
}

export { isValidEmail };
