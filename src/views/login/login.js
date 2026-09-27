/* Ported from loginController.ts + views/login.html. */
import { smartorg, SERVER_URL, TOKEN_KEY, INFO_KEY } from '../../core/config.js';
import { huashan } from '../../api/huashanClient.js';
import { session } from '../../core/session.js';
import { autoAuthService } from '../../core/auth.js';
import { getRouteSignal, navigate } from '../../core/router.js';
import { versionNavItemHtml, initVersionModal } from '../../components/versionModal.js';

function template() {
  return `
<div class="login-page">
  <div class="login-card-wrap">
    <div class="login-card">
      <div class="login-logo">
        <img src="/images/smartorg-icon.png" alt="" class="login-logo-icon">
        <img src="/images/smartorg-wordmark.png" alt="SmartOrg" class="login-logo-word">
      </div>

      <div class="login-heading">
        <h1>Huashan Wizard</h1>
        <p>Turn an Excel workbook into a web app your team can use &mdash; no spreadsheets required.</p>
      </div>

      <div class="alert alert-danger login-error" role="alert" id="login-error-row" hidden>
        <span id="login-error-text"></span>
      </div>

      <form id="login-form" class="login-form">
        <div class="login-field">
          <label for="login-username">Username</label>
          <input id="login-username" class="login-input" required autofocus autocomplete="username">
        </div>
        <div class="login-field">
          <label for="login-password">Password</label>
          <input id="login-password" type="password" class="login-input" required autocomplete="current-password">
        </div>
        <button id="login-submit" class="btn login-submit" type="submit" data-idle-label="Sign in" data-busy-label="Signing in&hellip;">Sign in</button>
      </form>
    </div>

    <div class="login-footer">
      <span class="login-footer-text">Powered by</span>
      <img src="/images/smartorg-wordmark.png" alt="SmartOrg" class="login-footer-logo">
      <span class="login-footer-sep">&middot;</span>
      <ul class="nav login-about">${versionNavItemHtml()}</ul>
    </div>
  </div>
</div>`;
}

export function mount(container) {
  container.innerHTML = template();

  const usernameEl = container.querySelector('#login-username');
  const passwordEl = container.querySelector('#login-password');
  const errorRow = container.querySelector('#login-error-row');
  const errorText = container.querySelector('#login-error-text');
  const aboutLink = container.querySelector('#huashan-about-link');
  const submitEl = container.querySelector('#login-submit');

  function setSubmitting(isSubmitting) {
    submitEl.disabled = isSubmitting;
    usernameEl.disabled = isSubmitting;
    passwordEl.disabled = isSubmitting;
    submitEl.textContent = isSubmitting ? submitEl.dataset.busyLabel : submitEl.dataset.idleLabel;
  }

  function showError(message) {
    errorText.textContent = message;
    errorRow.hidden = false;
    setSubmitting(false);
  }

  function loginSuccess(response) {
    if (response.status) {
      autoAuthService.startAutoAuth();
      session.create(response.credentials);
      document.cookie = `huashansession=${encodeURIComponent(session.getCredentials())}; path=/`;
      navigate('/selectTemplate');
    } else {
      navigate('/login');
      showError('Login Failed. You cannot proceed.');
    }
  }

  async function login(evt) {
    evt.preventDefault();
    errorRow.hidden = true;
    setSubmitting(true);
    const userName = usernameEl.value;
    const password = passwordEl.value;
    localStorage.clear();

    let userInfo;
    try {
      userInfo = await smartorg.authenticate({ username: userName, password });
    } catch (err) {
      showError('Username or password is not correct.');
      console.error(err);
      return;
    }

    localStorage.setItem(TOKEN_KEY, userInfo.token);
    localStorage.setItem(INFO_KEY, btoa(JSON.stringify(userInfo.data)));

    if (userInfo.data.is_admin) {
      const response = await huashan.auth(userName, password);
      loginSuccess(response);
      return;
    }

    try {
      const res = await fetch(`${SERVER_URL}/framework/config`, { signal: getRouteSignal() });
      const data = await res.json();
      if (data.wizardUserAccess) {
        const response = await huashan.auth(userName, password);
        loginSuccess(response);
      } else {
        showError('Please Use Admin Username To Login');
        console.warn('Please login with admin username');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      showError('Please Use Admin Username To Login');
      console.warn('Please login with admin username');
    }
  }

  container.querySelector('#login-form').addEventListener('submit', login);
  const cleanupVersion = aboutLink ? initVersionModal(aboutLink) : () => {};

  return () => {
    cleanupVersion();
  };
}
