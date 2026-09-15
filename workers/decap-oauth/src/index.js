const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2026-03-10';
const COOKIE_MAX_AGE_SECONDS = 600;
const STATE_COOKIE = '__Host-decap_oauth_state';
const PKCE_COOKIE = '__Host-decap_oauth_pkce';

class PublicOAuthError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'PublicOAuthError';
  }
}

/** @param {number} byteLength */
function randomBase64Url(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

/** @param {ArrayBuffer} value */
function arrayBufferToBase64Url(value) {
  const bytes = new Uint8Array(value);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

/** @param {string} verifier */
async function createPkceChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return arrayBufferToBase64Url(digest);
}

/** @param {string | null} cookieHeader */
function parseCookies(cookieHeader) {
  /** @type {Map<string, string>} */
  const cookies = new Map();

  for (const part of cookieHeader?.split(';') ?? []) {
    const separator = part.indexOf('=');
    if (separator < 1) continue;

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    cookies.set(name, value);
  }

  return cookies;
}

/** @param {string} name @param {string} value @param {number} maxAge */
function serializeCookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

/** @param {string | null} first @param {string | undefined} second */
function timingSafeStringEqual(first, second) {
  if (!first || !second) return false;

  const firstBytes = new TextEncoder().encode(first);
  const secondBytes = new TextEncoder().encode(second);
  if (firstBytes.byteLength !== secondBytes.byteLength) return false;

  return crypto.subtle.timingSafeEqual(firstBytes, secondBytes);
}

/** @param {string} value @param {string} variableName */
function parseOrigin(value, variableName) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} không phải URL hợp lệ.`);
  }

  const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !localHttp) || url.origin !== value || url.pathname !== '/') {
    throw new Error(`${variableName} phải là origin HTTPS, không có path hoặc query.`);
  }

  return url.origin;
}

/** @param {Env} env */
function readConfig(env) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    throw new Error('Thiếu GitHub OAuth credentials trong Worker secrets.');
  }

  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(env.GITHUB_REPOSITORY)) {
    throw new Error('GITHUB_REPOSITORY không hợp lệ.');
  }

  if (!['public_repo', 'repo'].includes(env.GITHUB_SCOPE)) {
    throw new Error('GITHUB_SCOPE không hợp lệ.');
  }

  return {
    cmsOrigin: parseOrigin(env.CMS_ORIGIN, 'CMS_ORIGIN'),
    oauthOrigin: parseOrigin(env.OAUTH_ORIGIN, 'OAUTH_ORIGIN'),
    repository: env.GITHUB_REPOSITORY,
    scope: env.GITHUB_SCOPE,
  };
}

function secureHeaders() {
  return {
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  };
}

/** @param {string} message @param {number} [status] */
function textResponse(message, status = 200) {
  return new Response(message, {
    status,
    headers: {
      ...secureHeaders(),
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

/** @param {string} value */
function jsonForInlineScript(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
}

/**
 * @param {'success' | 'error'} status
 * @param {{ token?: string, provider?: string, message?: string }} payload
 * @param {string} cmsOrigin
 */
function callbackResponse(status, payload, cmsOrigin) {
  const nonce = randomBase64Url(18);
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const scriptMessage = jsonForInlineScript(message);
  const scriptOrigin = jsonForInlineScript(cmsOrigin);
  const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Đăng nhập Decap CMS</title>
  </head>
  <body>
    <p>Đang hoàn tất đăng nhập Decap CMS…</p>
    <script nonce="${nonce}">
      (() => {
        const cmsOrigin = ${scriptOrigin};
        const result = ${scriptMessage};

        if (!window.opener) {
          document.body.textContent = 'Không tìm thấy cửa sổ Decap CMS. Hãy đóng cửa sổ này và thử lại.';
          return;
        }

        const receiveMessage = (event) => {
          if (event.origin !== cmsOrigin || event.source !== window.opener) return;
          window.opener.postMessage(result, cmsOrigin);
          window.removeEventListener('message', receiveMessage);
          window.close();
        };

        window.addEventListener('message', receiveMessage);
        window.opener.postMessage('authorizing:github', cmsOrigin);
      })();
    </script>
  </body>
</html>`;

  const headers = new Headers({
    ...secureHeaders(),
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
    'Content-Type': 'text/html; charset=utf-8',
  });
  headers.append('Set-Cookie', serializeCookie(STATE_COOKIE, '', 0));
  headers.append('Set-Cookie', serializeCookie(PKCE_COOKIE, '', 0));

  return new Response(html, { status: 200, headers });
}

/** @param {Request} request @param {Env} env */
async function handleAuth(request, env) {
  const config = readConfig(env);
  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== config.oauthOrigin) {
    return textResponse('OAuth origin không hợp lệ.', 421);
  }

  const provider = requestUrl.searchParams.get('provider');
  if (provider && provider !== 'github') {
    return textResponse('OAuth provider không được hỗ trợ.', 400);
  }

  const state = randomBase64Url(32);
  const verifier = randomBase64Url(32);
  const challenge = await createPkceChallenge(verifier);
  const callbackUrl = `${config.oauthOrigin}/callback`;
  const authorizeUrl = new URL(AUTHORIZE_URL);
  authorizeUrl.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: callbackUrl,
    scope: config.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();

  const headers = new Headers({
    ...secureHeaders(),
    Location: authorizeUrl.toString(),
  });
  headers.append('Set-Cookie', serializeCookie(STATE_COOKIE, state, COOKIE_MAX_AGE_SECONDS));
  headers.append('Set-Cookie', serializeCookie(PKCE_COOKIE, verifier, COOKIE_MAX_AGE_SECONDS));

  return new Response(null, { status: 302, headers });
}

/** @param {Response} response @param {string} context */
async function readJson(response, context) {
  if (!response.ok) {
    throw new Error(`${context} trả về HTTP ${response.status}.`);
  }

  const contentLength = Number(response.headers.get('Content-Length') ?? 0);
  if (contentLength > 64 * 1024) {
    throw new Error(`${context} trả về response quá lớn.`);
  }

  return response.json();
}

/** @param {string} code @param {string} verifier @param {Env} env @param {ReturnType<typeof readConfig>} config */
async function exchangeCode(code, verifier, env, config) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${config.oauthOrigin}/callback`,
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await readJson(response, 'GitHub token endpoint');

  if (
    !payload ||
    typeof payload !== 'object' ||
    !('access_token' in payload) ||
    typeof payload.access_token !== 'string' ||
    payload.access_token.length < 1
  ) {
    throw new PublicOAuthError('GitHub không trả về access token hợp lệ.');
  }

  return payload.access_token;
}

/** @param {string} token @param {string} repository */
async function assertRepositoryPushAccess(token, repository) {
  const response = await fetch(`${GITHUB_API_URL}/repos/${repository}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'kinh-thanh-la-le-that-oauth',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (response.status === 404 || response.status === 403) {
    throw new PublicOAuthError('Tài khoản GitHub này không có quyền truy cập repository.');
  }

  const payload = await readJson(response, 'GitHub repository endpoint');
  const canPush =
    payload &&
    typeof payload === 'object' &&
    'permissions' in payload &&
    payload.permissions &&
    typeof payload.permissions === 'object' &&
    'push' in payload.permissions &&
    payload.permissions.push === true;

  if (!canPush) {
    throw new PublicOAuthError('Tài khoản GitHub này chưa được cấp quyền xuất bản nội dung.');
  }
}

/** @param {Request} request @param {Env} env */
async function handleCallback(request, env) {
  const config = readConfig(env);
  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== config.oauthOrigin) {
    return textResponse('OAuth origin không hợp lệ.', 421);
  }

  const cookies = parseCookies(request.headers.get('Cookie'));
  const returnedState = requestUrl.searchParams.get('state');
  const storedState = cookies.get(STATE_COOKIE);
  const verifier = cookies.get(PKCE_COOKIE);

  if (!timingSafeStringEqual(returnedState, storedState) || !verifier) {
    return callbackResponse('error', { message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' }, config.cmsOrigin);
  }

  const githubError = requestUrl.searchParams.get('error');
  if (githubError) {
    return callbackResponse('error', { message: 'Bạn đã hủy hoặc GitHub từ chối yêu cầu đăng nhập.' }, config.cmsOrigin);
  }

  const code = requestUrl.searchParams.get('code');
  if (!code) {
    return callbackResponse('error', { message: 'GitHub không trả về authorization code.' }, config.cmsOrigin);
  }

  try {
    const token = await exchangeCode(code, verifier, env, config);
    await assertRepositoryPushAccess(token, config.repository);
    return callbackResponse('success', { token, provider: 'github' }, config.cmsOrigin);
  } catch (error) {
    const message = error instanceof PublicOAuthError ? error.message : 'Không thể hoàn tất đăng nhập GitHub. Hãy thử lại.';
    return callbackResponse('error', { message }, config.cmsOrigin);
  }
}

/** @param {Request} request @param {Env} env */
async function handleRequest(request, env) {
  if (request.method !== 'GET') {
    return textResponse('Method not allowed.', 405);
  }

  const url = new URL(request.url);

  try {
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'decap-github-oauth' }), {
        headers: {
          ...secureHeaders(),
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    if (url.pathname === '/auth') return handleAuth(request, env);
    if (url.pathname === '/callback') return handleCallback(request, env);
    return textResponse('Not found.', 404);
  } catch {
    return textResponse('OAuth Worker chưa được cấu hình đầy đủ.', 503);
  }
}

export default {
  /** @param {Request} request @param {Env} env */
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
