/* Ported from logic/common.ts */

export function isActionIDDuplicate(id, menu) {
  const displayIDArray = menu.map((item) => item.ID);
  return displayIDArray.indexOf(id) !== -1;
}

export function makeActionIDFrom(display, menu) {
  let id = display.split(' ').join('');
  id = id.split('/').join('_');

  while (isActionIDDuplicate(id, menu)) {
    id = id + '0';
  }
  return id;
}
