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
  try {
    const res = await fetch(`${DOMAIN}/${ENDPOINT}/framework/login/b`, {
      method: 'POST',
      headers: { Authorization: 'jwttoken ' + (localStorage.getItem(TOKEN_KEY) || '') },
    });
    const data = await res.json();
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

/*
 * Logging out is a route change, not a page unload, so the beforeunload
 * handler above does not run and this interval outlives the session that
 * started it - renewing the JWT, and writing a fresh token back into the
 * localStorage the logout just cleared. Clearing the handle (rather than only
 * the interval) lets startAutoAuth arm a new one on the next login.
 */
function stopAutoAuth() {
  isLogin = false;
  clearInterval(autoAuthInterval);
  autoAuthInterval = undefined;
}

export const autoAuthService = {
  startAutoAuth,
  stopAutoAuth,
};
