/*
 * Ported from the `scrollIf` directive and the `$(scrollTo).position().top` /
 * `$(listName).scrollTop(...)` pattern used in appStructureController /
 * portfolioStructureController to scroll a list to a newly-added item.
 */
export function scrollElementIntoView(listEl, targetEl, duration = 300) {
  if (!listEl || !targetEl) return;
  const startTop = listEl.scrollTop;
  const endTop = targetEl.offsetTop - listEl.offsetTop;
  const change = endTop - startTop;
  const startTime = performance.now();

  function step(now) {
    const elapsed = Math.min(1, (now - startTime) / duration);
    listEl.scrollTop = startTop + change * elapsed;
    if (elapsed < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
