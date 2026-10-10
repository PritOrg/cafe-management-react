const isNumeric = (v) => v != null && v !== '' && !Number.isNaN(Number(v));

export const compareValues = (a, b) => {
  const an = isNumeric(a);
  const bn = isNumeric(b);
  if (an && bn) return Number(a) - Number(b);
  if (a == null || a === '') return 1; // sort empties last
  if (b == null || b === '') return -1;
  return String(a).localeCompare(String(b));
};

export const sortRows = (rows = [], key, dir = 'asc') => {
  if (!key) return [...rows];
  const factor = dir === 'desc' ? -1 : 1;
  const isEmpty = (v) => v == null || v === '';
  return [...rows].sort((x, y) => {
    const a = x?.[key];
    const b = y?.[key];
    if (isEmpty(a) !== isEmpty(b)) return isEmpty(a) ? 1 : -1; // empties last always
    return factor * compareValues(a, b);
  });
};

export const toggleSort = (current, key) =>
  current && current.key === key && current.dir === 'asc'
    ? { key, dir: 'desc' }
    : { key, dir: 'asc' };