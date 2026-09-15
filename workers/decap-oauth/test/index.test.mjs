import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import worker from '../src/index.js';

const handleRequest = worker.fetch;

const oauthOrigin = 'https://kinh-thanh-la-le-that-oauth.ctcm251010.workers.dev';
const cmsOrigin = 'https://kinh-thanh-la-le-that.ctcm251010.workers.dev';
const env = {
  CMS_ORIGIN: cmsOrigin,
  OAUTH_ORIGIN: oauthOrigin,
  GITHUB_REPOSITORY: 'ctcm251010/kinhthanhlalethat',
  GITHUB_SCOPE: 'public_repo',
  GITHUB_CLIENT_ID: 'client-id-for-test',
  GITHUB_CLIENT_SECRET: 'client-secret-for-test',
};

const originalFetch = globalThis.fetch;
const subtle = globalThis.crypto.subtle;

before(() => {
  Object.defineProperty(subtle, 'timingSafeEqual', {
    configurable: true,
    value(first, second) {
      const firstBytes = new Uint8Array(first.buffer ?? first, first.byteOffset ?? 0, first.byteLength);
      const secondBytes = new Uint8Array(second.buffer ?? second, second.byteOffset ?? 0, second.byteLength);
      if (firstBytes.byteLength !== secondBytes.byteLength) return false;

      let difference = 0;
      for (let index = 0; index < firstBytes.byteLength; index += 1) {
        difference |= firstBytes[index] ^ secondBytes[index];
      }
      return difference === 0;
    },
  });
});

after(() => {
  globalThis.fetch = originalFetch;
  delete subtle.timingSafeEqual;
});

function getSetCookies(headers) {
  return typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [headers.get('set-cookie') ?? ''];
}

function cookieHeaderFrom(response) {
  return getSetCookies(response.headers)
    .map((cookie) => cookie.split(';', 1)[0])
    .join('; ');
}

test('health endpoint không cần secrets', async () => {
  const response = await handleRequest(new Request(`${oauthOrigin}/health`), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'decap-github-oauth' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('auth tạo redirect có state, PKCE và cookie bảo mật', async () => {
  const response = await handleRequest(new Request(`${oauthOrigin}/auth?provider=github`), env);
  const location = new URL(response.headers.get('location'));

  assert.equal(response.status, 302);
  assert.equal(location.origin, 'https://github.com');
  assert.equal(location.pathname, '/login/oauth/authorize');
  assert.equal(location.searchParams.get('client_id'), env.GITHUB_CLIENT_ID);
  assert.equal(location.searchParams.get('redirect_uri'), `${oauthOrigin}/callback`);
  assert.equal(location.searchParams.get('scope'), 'public_repo');
  assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(location.searchParams.get('state')?.length >= 40);
  assert.ok(location.searchParams.get('code_challenge')?.length >= 40);

  const setCookies = getSetCookies(response.headers);
  assert.equal(setCookies.length, 2);
  assert.ok(setCookies.every((cookie) => cookie.includes('HttpOnly') && cookie.includes('Secure') && cookie.includes('SameSite=Lax')));
});

test('callback từ chối state không khớp trước khi gọi GitHub', async () => {
  let fetchWasCalled = false;
  globalThis.fetch = async () => {
    fetchWasCalled = true;
    throw new Error('Không được gọi');
  };

  const request = new Request(`${oauthOrigin}/callback?code=fake&state=wrong-state`, {
    headers: { Cookie: `${'__Host-decap_oauth_state'}=expected-state; __Host-decap_oauth_pkce=verifier` },
  });
  const response = await handleRequest(request, env);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /authorization:github:error:/u);
  assert.match(html, new RegExp(cmsOrigin.replaceAll('.', '\\.')));
  assert.equal(fetchWasCalled, false);
});

test('callback chỉ trả token khi GitHub xác nhận quyền push repository', async () => {
  const authResponse = await handleRequest(new Request(`${oauthOrigin}/auth?provider=github`), env);
  const authorizeUrl = new URL(authResponse.headers.get('location'));
  const state = authorizeUrl.searchParams.get('state');
  const calls = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });

    if (url === 'https://github.com/login/oauth/access_token') {
      return Response.json({ access_token: 'gho_test_token' });
    }

    if (url === 'https://api.github.com/repos/ctcm251010/kinhthanhlalethat') {
      return Response.json({ permissions: { push: true } });
    }

    return new Response('Unexpected URL', { status: 500 });
  };

  const callbackRequest = new Request(`${oauthOrigin}/callback?code=test-code&state=${state}`, {
    headers: { Cookie: cookieHeaderFrom(authResponse) },
  });
  const response = await handleRequest(callbackRequest, env);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /authorization:github:success:/u);
  assert.match(html, /gho_test_token/u);
  assert.doesNotMatch(html, /client-secret-for-test/u);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/u);
  assert.equal(calls.length, 2);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('callback không trả token cho tài khoản thiếu quyền push', async () => {
  const authResponse = await handleRequest(new Request(`${oauthOrigin}/auth?provider=github`), env);
  const authorizeUrl = new URL(authResponse.headers.get('location'));
  const state = authorizeUrl.searchParams.get('state');

  globalThis.fetch = async (input) => {
    if (String(input) === 'https://github.com/login/oauth/access_token') {
      return Response.json({ access_token: 'gho_token_must_not_leak' });
    }

    return Response.json({ permissions: { push: false } });
  };

  const callbackRequest = new Request(`${oauthOrigin}/callback?code=test-code&state=${state}`, {
    headers: { Cookie: cookieHeaderFrom(authResponse) },
  });
  const response = await handleRequest(callbackRequest, env);
  const html = await response.text();

  assert.match(html, /authorization:github:error:/u);
  assert.match(html, /chưa được cấp quyền xuất bản nội dung/u);
  assert.doesNotMatch(html, /gho_token_must_not_leak/u);
});

test('route lạ trả 404 và method khác GET trả 405', async () => {
  const notFound = await handleRequest(new Request(`${oauthOrigin}/khong-co`), env);
  const methodNotAllowed = await handleRequest(new Request(`${oauthOrigin}/auth`, { method: 'POST' }), env);

  assert.equal(notFound.status, 404);
  assert.equal(methodNotAllowed.status, 405);
});
