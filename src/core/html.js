/* Small HTML-escaping helper shared by every view's template rendering. */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/*
 * Ported from the `tablePreviewHtml` Angular filter (app.ts): the REST
 * CalcEngine returns table/range previews as a full HTML document string
 * (`HtmlPreview`). This extracts just the `<body>` contents (or, absent a
 * body tag, strips any `<style>` blocks) so it can be dropped straight into
 * a container's innerHTML. Used by dataStructure/appStructure/
 * portfolioStructure views wherever the legacy view did
 * `ng-bind-html="... | tablePreviewHtml"`. Unlike the Angular filter this
 * doesn't need an $sce-trust step or a memoization cache - there's no digest
 * loop to protect here.
 */
export function extractTablePreviewHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const match = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html) || /<body[^>]*>([\s\S]*)/i.exec(html);
  return match ? match[1].trim() : html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
}
