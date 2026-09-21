/*
 * Ported from the `fixedHeader` directive (datastructure view): once a
 * table's <tbody> becomes visible, measure each column's width, then switch
 * <thead>/<tbody> to `display: block` with a scrollable body so the header
 * stays pinned while the body scrolls. No jQuery.
 */
export function applyFixedHeader(tableEl) {
  const tbody = tableEl.querySelector('tbody');
  if (!tbody || tbody.offsetParent === null) return;

  tableEl.querySelectorAll('thead, tbody').forEach((el) => {
    el.style.display = '';
  });

  requestAnimationFrame(() => {
    const ths = Array.from(tableEl.querySelectorAll('th'));
    const firstRow = tbody.querySelector('tr');
    if (!firstRow) return;
    const tds = Array.from(firstRow.children);

    ths.forEach((th, i) => {
      const td = tds[i];
      if (!td) return;
      const columnWidth = td.getBoundingClientRect().width;
      th.style.width = `${columnWidth}px`;
      td.style.width = `${columnWidth}px`;
    });

    const thead = tableEl.querySelector('thead');
    thead.style.display = 'block';
    tbody.style.display = 'block';
    tbody.style.height = '520px';
    tbody.style.overflow = 'auto';

    const scrollBarWidth = thead.getBoundingClientRect().width - tbody.clientWidth;
    if (scrollBarWidth > 0) {
      const adjust = scrollBarWidth - 2;
      const lastCell = firstRow.lastElementChild;
      if (lastCell) {
        lastCell.style.width = `${lastCell.getBoundingClientRect().width - adjust}px`;
      }
    }
  });
}

/** Observes `tableEl` and (re)applies the fixed header once its <tbody>
 * becomes visible/populated. Returns a disconnect function. */
export function watchFixedHeader(tableEl) {
  const observer = new MutationObserver(() => applyFixedHeader(tableEl));
  observer.observe(tableEl, { childList: true, subtree: true, attributes: true });
  applyFixedHeader(tableEl);
  return () => observer.disconnect();
}
