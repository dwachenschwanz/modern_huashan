/*
 * Minimal replacement for angular-ui-bootstrap's <accordion>/<accordion-group>,
 * used by the JSON and Revisions views. Panels toggle independently
 * (close-others="false" in every usage), each starting open.
 */
export function accordionGroupHtml({ id, heading, bodyHtml, open = true }) {
  return `
<div class="panel panel-default" data-accordion-group="${id}">
  <div class="panel-heading" data-accordion-toggle="${id}" style="cursor:pointer;">
    ${heading}
    <i class="pull-right glyphicon ${open ? 'glyphicon-chevron-down' : 'glyphicon-chevron-left'}"></i>
  </div>
  <div class="panel-collapse" data-accordion-body="${id}" ${open ? '' : 'style="display:none;"'}>
    <div class="panel-body">${bodyHtml}</div>
  </div>
</div>`;
}

export function initAccordions(root) {
  root.querySelectorAll('[data-accordion-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const id = toggle.getAttribute('data-accordion-toggle');
      const body = root.querySelector(`[data-accordion-body="${id}"]`);
      const icon = toggle.querySelector('.glyphicon');
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : '';
      if (icon) {
        icon.classList.toggle('glyphicon-chevron-down', !isOpen);
        icon.classList.toggle('glyphicon-chevron-left', isOpen);
      }
    });
  });
}
