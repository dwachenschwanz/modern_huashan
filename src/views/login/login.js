/* Ported from loginController.ts + views/login.html. */
import { smartorg, SERVER_URL, TOKEN_KEY, INFO_KEY } from '../../core/config.js';
import { huashan } from '../../api/huashanClient.js';
import { session } from '../../core/session.js';
import { autoAuthService } from '../../core/auth.js';
import { getRouteSignal, navigate } from '../../core/router.js';
import { versionNavItemHtml, initVersionModal } from '../../components/versionModal.js';

function template() {
  return `
<nav class="navbar navbar-inverse navbar-static-top" role="navigation">
  <div class="container-fluid">
    <div class="navbar-header">
      <a class="navbar-brand" href="#">Huashan</a>
    </div>
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li class="active"><a href="#">Home</a></li>
        ${versionNavItemHtml()}
        <li><a href="#">Contact</a></li>
      </ul>
      <ul class="nav navbar-nav navbar-right">
        <li>
          <form name="loginForm" id="login-form" class="navbar-form navbar-left form-signin">
            <input id="login-username" class="form-control" placeholder="User Name" required autofocus>
            <input id="login-password" type="password" class="form-control" placeholder="Password" required>
            <button id="login-submit" class="btn btn-primary" type="submit">Sign in</button>
          </form>
        </li>
      </ul>
    </div>
    <div>
      <div class="navbar-form" style="color: #cc3333;" id="login-error-row" hidden>
        <center id="login-error-text"></center>
      </div>
    </div>
  </div>
</nav>

<div class="jumbotron">
  <h1>The Huashan Wizard</h1>
  <p>This service lets you convert an Excel file into a web application in a
    few minutes! You can deploy this to your friends or clients without ever
    needing them to touch Excel. Don't believe us, try it.</p>
</div>`;
}

export function mount(container) {
  container.innerHTML = template();

  const usernameEl = container.querySelector('#login-username');
  const passwordEl = container.querySelector('#login-password');
  const errorRow = container.querySelector('#login-error-row');
  const errorText = container.querySelector('#login-error-text');
  const aboutLink = container.querySelector('#huashan-about-link');

  function showError(message) {
    errorText.textContent = message;
    errorRow.hidden = false;
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
      console.log('Login failed. You cannot proceed.');
    }
  }

  async function login(evt) {
    evt.preventDefault();
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
