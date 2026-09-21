/* Server configuration, ported from app.ts / huashan.service.ts.
 * The legacy app kept two copies of this (one per file) that had to be kept
 * in sync by hand; this is now the single source of truth. */

export const DOMAIN = 'https://qa.smartorg.com';
export const ENDPOINT = 'kirk';
export const SERVER_URL = `${DOMAIN}/${ENDPOINT}`;
export const WIZARD_URL = `${SERVER_URL}/wizard/main?`;
export const FILE_UPLOAD_URL = `${SERVER_URL}/fileD`;

// `SmartOrg` is a vendored global script (public/vendor/smartorg.js), loaded
// before this module via a plain <script> tag in index.html.
export const smartorg = new window.SmartOrg(DOMAIN, ENDPOINT);

export const TOKEN_KEY = 'JWT-TOKEN';
export const INFO_KEY = 'INFO';
