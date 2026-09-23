/* Ported from huashan.authentication.ts. Holds the "kreds" credentials
 * string returned by the Auth command for the lifetime of the tab.
 * `credentials` is a plain public field (some legacy controllers read
 * `session.credentials` directly instead of calling `getCredentials()`). */
import { getCookie } from './cookies.js';
import { navigate } from './router.js';
import { smartorg } from './config.js';
import { TheUte } from './textUtils.js';

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

export function restoreSmartOrgCredentials(kreds) {
  if (!kreds || !smartorg.protocols) return false;
  try {
    const unpacked = TheUte.unravel(kreds);
    const separator = unpacked.lastIndexOf('_');
    const username = unpacked.slice(0, separator);
    const secret = unpacked.slice(separator + 1);
    if (!username || !/^[a-f0-9]{32}$/i.test(secret)) return false;
    smartorg.protocols.credentials = { username, secret };
    return true;
  } catch (error) {
    console.warn('Could not restore SmartOrg credentials from the current session.', error);
    return false;
  }
}

/**
 * Every authenticated view calls this on mount: it mirrors the guard the
 * legacy controllers repeated in their constructors (`if (session or cookie)
 * restore from cookie; else redirect to /login`), since a full page reload
 * (bookmarked deep link, refresh) resets in-memory session state.
 * Returns true if the view should proceed, false if it redirected to /login.
 */
export function restoreSession() {
  const cookieValue = getCookie(SESSION_COOKIE);
  const credentials = session.getCredentials() || cookieValue;
  if (credentials) {
    session.create(credentials);
    restoreSmartOrgCredentials(credentials);
    return true;
  }
  navigate('/login');
  return false;
}
