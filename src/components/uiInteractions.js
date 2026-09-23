/*
 * Framework-free interactions for modals, dropdowns, tooltips, popovers,
 * and transient alerts.
 */

// ---- Modal ---------------------------------------------------------------

const modalPlaceholders = new WeakMap();
const modalReturnFocus = new WeakMap();

function getBackdrop() {
  let backdrop = document.querySelector('.modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade';
    document.body.appendChild(backdrop);
    // force reflow so the 'in' transition class takes effect
    void backdrop.offsetWidth;
  }
  return backdrop;
}

export function showModal(idOrEl, triggerEl) {
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return;
  const activeElement = triggerEl || document.activeElement;
  const returnFocus = activeElement && activeElement.id
    ? document.getElementById(activeElement.id) || activeElement
    : activeElement;
  if (returnFocus) modalReturnFocus.set(el, returnFocus);
  if (el.parentNode !== document.body) {
    const placeholder = document.createComment(`modal:${el.id || 'anonymous'}`);
    el.parentNode.insertBefore(placeholder, el);
    modalPlaceholders.set(el, placeholder);
    document.body.appendChild(el);
  }
  el.inert = false;
  el.style.display = 'block';
  el.removeAttribute('aria-hidden');
  el.setAttribute('aria-modal', 'true');
  document.body.classList.add('modal-open');
  const backdrop = getBackdrop();
  requestAnimationFrame(() => {
    el.classList.add('in');
    backdrop.classList.add('in');
  });
  el.dispatchEvent(new CustomEvent('shown.bs.modal', { bubbles: true }));
}

export function hideModal(idOrEl) {
  const el = typeof idOrEl === 'string'
    ? [...document.querySelectorAll('.modal.in')].find((modal) => modal.id === idOrEl) || document.getElementById(idOrEl)
    : idOrEl;
  if (!el) return;
  el.classList.remove('in');
  const focusedElement = document.activeElement;
  if (focusedElement && el.contains(focusedElement)) focusedElement.blur();
  const returnFocus = modalReturnFocus.get(el);
  if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === 'function') {
    returnFocus.focus({ preventScroll: true });
  }
  modalReturnFocus.delete(el);
  el.inert = true;
  el.setAttribute('aria-hidden', 'true');
  el.removeAttribute('aria-modal');
  document.body.classList.remove('modal-open');
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) backdrop.remove();
  window.setTimeout(() => {
    el.style.display = 'none';
    el.dispatchEvent(new CustomEvent('hidden.bs.modal', { bubbles: true }));
    const placeholder = modalPlaceholders.get(el);
    if (placeholder) {
      if (placeholder.isConnected) placeholder.replaceWith(el);
      else el.remove();
      modalPlaceholders.delete(el);
    }
  }, 150);
}

export function onModalShown(idOrEl, handler) {
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return () => {};
  el.addEventListener('shown.bs.modal', handler);
  return () => el.removeEventListener('shown.bs.modal', handler);
}

/** Wire up `data-toggle="modal" data-target="#id"` triggers and
 * `data-dismiss="modal"` close buttons within `root` (defaults to document). */
export function initModals(root = document) {
  root.addEventListener('click', (evt) => {
    const trigger = evt.target.closest('[data-toggle="modal"]');
    if (trigger) {
      const targetSel = trigger.getAttribute('data-target') || trigger.getAttribute('href');
      if (targetSel) {
        evt.preventDefault();
        showModal(targetSel.replace('#', ''), trigger);
      }
      return;
    }
    const dismiss = evt.target.closest('[data-dismiss="modal"]');
    if (dismiss) {
      const modalEl = dismiss.closest('.modal');
      if (modalEl) hideModal(modalEl);
      return;
    }
    if (evt.target.classList && evt.target.classList.contains('modal')) {
      hideModal(evt.target);
    }
  });
  root.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') {
      const openModal = document.querySelector('.modal.in');
      if (openModal) hideModal(openModal);
    }
  });
}

// ---- Dropdown --------------------------------------------------------------

export function initDropdowns(root = document) {
  root.addEventListener('click', (evt) => {
    const toggle = evt.target.closest('[data-toggle="dropdown"]');
    document.querySelectorAll('.dropdown.open, .btn-group.open').forEach((openEl) => {
      if (!toggle || openEl !== toggle.closest('.dropdown, .btn-group')) {
        openEl.classList.remove('open');
      }
    });
    if (toggle) {
      evt.preventDefault();
      const parent = toggle.closest('.dropdown, .btn-group');
      if (parent) parent.classList.toggle('open');
    }
  });
}

// ---- Tooltip / popover (lightweight) ---------------------------------------

function positionFloating(trigger, el) {
  const rect = trigger.getBoundingClientRect();
  el.style.position = 'absolute';
  el.style.top = `${window.scrollY + rect.top - el.offsetHeight - 8}px`;
  el.style.left = `${window.scrollX + rect.left + rect.width / 2 - el.offsetWidth / 2}px`;
}

export function dismissFloatingUi() {
  document.querySelectorAll('.tooltip.in, .popover.in').forEach((element) => element.remove());
}

export function initTooltips(root = document) {
  dismissFloatingUi();
  root.querySelectorAll('[data-toggle="tooltip"]').forEach((trigger) => {
    if (trigger.dataset.tooltipBound) return;
    trigger.dataset.tooltipBound = '1';
    let tipEl = null;
    trigger.addEventListener('mouseenter', () => {
      dismissFloatingUi();
      const text = trigger.getAttribute('title') || trigger.getAttribute('data-original-title');
      if (!text) return;
      trigger.setAttribute('data-original-title', text);
      trigger.removeAttribute('title');
      tipEl = document.createElement('div');
      tipEl.className = 'tooltip in top';
      tipEl.setAttribute('role', 'tooltip');
      tipEl.innerHTML = `<div class="tooltip-arrow"></div><div class="tooltip-inner"></div>`;
      tipEl.querySelector('.tooltip-inner').textContent = text;
      document.body.appendChild(tipEl);
      positionFloating(trigger, tipEl);
    });
    trigger.addEventListener('mouseleave', () => {
      if (tipEl) {
        tipEl.remove();
        tipEl = null;
      }
    });
  });
}

export function initPopovers(root = document) {
  dismissFloatingUi();
  root.querySelectorAll('[data-toggle="popover"]').forEach((trigger) => {
    if (trigger.dataset.popoverBound) return;
    trigger.dataset.popoverBound = '1';
    let popEl = null;
    const close = () => {
      if (popEl) {
        popEl.remove();
        popEl = null;
      }
    };
    trigger.addEventListener('click', (evt) => {
      evt.stopPropagation();
      if (popEl && !popEl.isConnected) popEl = null;
      if (popEl) {
        close();
        return;
      }
      dismissFloatingUi();
      const title = trigger.getAttribute('title') || trigger.getAttribute('data-original-title');
      const content = trigger.getAttribute('data-content') || '';
      popEl = document.createElement('div');
      popEl.className = 'popover in top';
      popEl.setAttribute('role', 'tooltip');
      popEl.innerHTML = `<div class="arrow"></div>${
        title ? `<h3 class="popover-title"></h3>` : ''
      }<div class="popover-content"></div>`;
      if (title) popEl.querySelector('.popover-title').textContent = title;
      popEl.querySelector('.popover-content').textContent = content;
      document.body.appendChild(popEl);
      positionFloating(trigger, popEl);
      document.addEventListener('click', close, { once: true });
    });
  });
}

// ---- fadeIn().delay(ms).fadeOut() alert flash -------------------------------

const FAST_MS = 200;

/** Mirrors `$('#id').fadeIn('fast').delay(delayMs).fadeOut('fast')`. */
export function flashAlert(idOrEl, delayMs = 3000) {
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return;
  el.style.transition = `opacity ${FAST_MS}ms linear`;
  el.style.display = 'block';
  el.style.opacity = '0';
  requestAnimationFrame(() => {
    el.style.opacity = '1';
  });
  window.setTimeout(() => {
    el.style.opacity = '0';
    window.setTimeout(() => {
      el.style.display = 'none';
    }, FAST_MS);
  }, FAST_MS + delayMs);
}
