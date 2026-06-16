## 모듈 개요

| 항목 | 값 |
|------|-----|
| 파일 경로 | `src/validator.js` |
| 모듈 형식 | ES Module (`export`) |
| 외부 의존성 | 없음 (npm 패키지 사용 금지) |
| 책임 | 이메일 형식 검증 |

## API

### `isValidEmail(email)`

이메일 문자열이 RFC 5322 형식과 RFC 3696 길이 제한을 만족하는지 검증한다.

| 항목 | 내용 |
|------|------|
| 입력 | `email: string` |
| 출력 | `boolean` — 유효하면 `true`, 아니면 `false` |
| JSDoc | 필수 (한국어) |

#### 검증 규칙 (순서대로 적용)

1. `typeof email !== 'string'` → `false`
2. `@` 위치(`lastIndexOf('@')`)가 `0` 이하 → `false` (로컬 파트 없음)
3. `@` 위치가 `64` 초과 → `false` (로컬 파트 RFC 3696 한도)
4. 전체 길이가 `254` 초과 → `false` (RFC 3696 한도)
5. RFC 5322 정규식 통과 → `true`, 실패 → `false`

#### 상수

| 이름 | 값 | 근거 |
|------|-----|------|
| `MAX_LOCAL_PART_LENGTH` | `64` | RFC 3696 |
| `MAX_EMAIL_LENGTH` | `254` | RFC 3696 |

#### 정규식

- RFC 5322 기반 패턴 (emailregex.com, IP 옥텟 버그 수정)
- 참고: https://stackoverflow.com/questions/201323/what-is-the-best-regular-expression-for-validating-email-addresses
- 플래그: `'i'` (대소문자 무시)

#### 예시

| 입력 | 결과 |
|------|------|
| `'alice@example.com'` | `true` |
| `'user+tag@example.com'` | `true` |
| `'invalid-email'` | `false` |
| `''` | `false` |
| `null` | `false` |
| `'a'.repeat(64) + '@example.com'` | `true` |
| `'a'.repeat(65) + '@example.com'` | `false` |
| `'a'.repeat(243) + '@example.com'` | `false` |

---

## 연동 모듈

### `src/email.js`

| 함수 | 역할 | validator.js 사용 |
|------|------|-------------------|
| `extractEmails(users)` | 사용자 배열에서 `email` 필드 추출 | 사용 안 함 |
| `getValidEmails(users)` | 유효한 이메일만 필터링 | `isValidEmail` 사용 |
| `uniqueValidEmails(users)` | 유효 이메일 중복 제거 | `getValidEmails` 경유 |

#### `getValidEmails` 구현 패턴 (필수)

```js
import { isValidEmail } from './validator.js';

export function getValidEmails(users) {
  return extractEmails(users).filter(isValidEmail);
}
```

- `extractEmails`는 `email.js`에 유지한다.
- 검증 로직은 `validator.js`에만 둔다.
- `email.js`는 `isValidEmail`을 re-export할 수 있다 (하위 호환).

### `src/auth.js`

- `login()`에서 이메일 형식 검증 시 `validator.js`의 `isValidEmail`을 직접 import한다.
- `email.js`를 거치지 않는다.

```js
import { isValidEmail } from './validator.js';
```

---

## 리팩터링 규칙

AI가 이 스펙을 기준으로 코드를 수정할 때 지켜야 할 사항:

1. `isValidEmail` 로직은 `src/validator.js`에만 존재해야 한다.
2. `getValidEmails`는 `extractEmails(users).filter(isValidEmail)` 패턴을 유지한다.
3. 외부 npm 패키지(예: `validator`)를 추가하지 않는다.
4. `src/email.test.js`의 기존 테스트가 모두 통과해야 한다.
5. 주석과 JSDoc은 한국어로 작성한다.

---

## Cursor에서 참조하는 방법

### 로컬 스펙 (권장)

```
@docs/validator.md @src/email.js
getValidEmails가 validator.md 스펙을 따르는지 확인하고, 어긋나면 수정해줘.
```

### Cursor Docs (URL 등록 시)

1. 이 파일을 Gist 등 공개 URL에 호스팅
2. Cursor Settings → Indexing & Docs → Add new doc
3. Name: `validator.js`
4. 프롬프트:

```
@src/email.js @Docs validator.js
getValidEmails를 validator.js 스펙에 맞게 리팩터링해줘.
```
