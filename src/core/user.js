/* The signed-in user's record, as login stores it: the `data` object that
 * SmartOrg's authenticate() returns, base64-encoded JSON under INFO. Reading
 * it has to stay total - the value is whatever was in storage when the tab
 * opened, and may be absent, stale or not ours at all. */
import { INFO_KEY } from './config.js';

export function getUserInfo() {
  try {
    const stored = localStorage.getItem(INFO_KEY);
    return stored ? JSON.parse(atob(stored)) : null;
  } catch (error) {
    return null;
  }
}

/* The record's name field is not consistent across deployments, so try the
 * spellings it has been seen under and let the caller decide what to show
 * when none of them is present. */
export function getUserName() {
  const info = getUserInfo();
  if (!info) return '';
  return info.username || info.user_name || info.name || info.email || '';
}

export function getIsAdmin() {
  return !!(getUserInfo() || {}).is_admin;
}
