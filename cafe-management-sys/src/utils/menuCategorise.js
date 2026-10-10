// Category helpers for the Swiggy-style menu: group items by category and
// derive stable anchor ids so the category rail can scroll to each section.
export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'other';

export const groupByCategory = (items = []) => {
  const map = {};
  for (const item of items) {
    const category = item?.category || 'Other';
    (map[category] = map[category] || []).push(item);
  }
  return Object.keys(map)
    .sort((a, b) => a.localeCompare(b))
    .map((category) => ({ category, slug: slugify(category), items: map[category] }));
};

export const categoryIds = (items = []) => groupByCategory(items).map((g) => g.slug);