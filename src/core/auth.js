/*
 * Ported from the `autoAuthService` in app.ts: periodically renews the JWT
 * while the user has an active session, and redirects to /login if renewal
 * fails.
 */
import { DOMAIN, ENDPOINT, TOKEN_KEY } from './config.js';

const RENEW_TIMEOUT = 30 * 60 * 1000;

let autoAuthInterval;
let isLogin = false;

window.addEventListener('beforeunload', () => {
  clearInterval(autoAuthInterval);
});

async function autoAuth() {
  console.log('Auto auth!');
  try {
    const res = await fetch(`${DOMAIN}/${ENDPOINT}/framework/login/b`, {
      method: 'POST',
      headers: { Authorization: 'jwttoken ' + (localStorage.getItem(TOKEN_KEY) || '') },
    });
    const data = await res.json();
    console.log('Auto auth success!', data);
    if (data && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    } else {
      throw new Error('No token found!');
    }
  } catch (err) {
    console.error(err);
    if (isLogin) {
      isLogin = false;
      alert('Your session has timed out! Please login again!');
      window.location.hash = '#/login';
    }
  }
}

function startAutoAuth() {
  isLogin = true;
  if (typeof autoAuthInterval === 'undefined') {
    autoAuthInterval = setInterval(autoAuth, RENEW_TIMEOUT);
  }
}

export const autoAuthService = {
  // NOTE: the legacy app.ts left this call commented out ("//startAutoAuth();"),
  // so the periodic re-auth interval never actually ran in production. Kept
  // inert here to match existing behavior; call startAutoAuth() above to enable it.
  startAutoAuth() {},
};
