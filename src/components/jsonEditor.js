import { basicSetup } from 'codemirror';
import { indentWithTab } from '@codemirror/commands';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { indentUnit } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

function syntaxStatus(doc) {
  try {
    JSON.parse(doc);
    return { valid: true, message: 'Valid JSON' };
  } catch (error) {
    return { valid: false, message: error.message || 'Invalid JSON' };
  }
}

export function createJsonEditor(host, { value, label, onChange }) {
  const status = document.createElement('div');
  status.className = 'json-editor-status';
  status.setAttribute('aria-live', 'polite');

  function updateStatus(doc) {
    const result = syntaxStatus(doc);
    status.classList.toggle('is-valid', result.valid);
    status.classList.toggle('is-invalid', !result.valid);
    status.textContent = result.message;
  }

  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        json(),
        linter(jsonParseLinter()),
        lintGutter(),
        indentUnit.of('  '),
        EditorState.tabSize.of(2),
        keymap.of([indentWithTab]),
        EditorView.contentAttributes.of({
          'aria-label': label,
          spellcheck: 'false',
          autocapitalize: 'off',
          autocomplete: 'off',
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const doc = update.state.doc.toString();
          updateStatus(doc);
          onChange(doc);
        }),
      ],
    }),
  });

  host.append(status);
  updateStatus(value);

  return {
    destroy() {
      view.destroy();
      status.remove();
    },
  };
}
