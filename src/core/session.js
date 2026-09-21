/* Ported from huashan.authentication.ts. Holds the "kreds" credentials
 * string returned by the Auth command for the lifetime of the tab.
 * `credentials` is a plain public field (some legacy controllers read
 * `session.credentials` directly instead of calling `getCredentials()`). */
import { getCookie } from './cookies.js';
import { navigate } from './router.js';

const SESSION_COOKIE = 'huashansession';

class Session {
  credentials = null;

  create(credentials) {
    this.credentials = credentials;
  }

  destroy() {
    this.credentials = null;
  }

  getCredentials() {
    return this.credentials;
  }
}

export const session = new Session();

/**
 * Every authenticated view calls this on mount: it mirrors the guard the
 * legacy controllers repeated in their constructors (`if (session or cookie)
 * restore from cookie; else redirect to /login`), since a full page reload
 * (bookmarked deep link, refresh) resets in-memory session state.
 * Returns true if the view should proceed, false if it redirected to /login.
 */
export function restoreSession() {
  const cookieValue = getCookie(SESSION_COOKIE);
  if (session.getCredentials() || cookieValue) {
    session.create(cookieValue);
    return true;
  }
  navigate('/login');
  return false;
}
