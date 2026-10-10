// Pure cart logic — extracted from CartContext so it can be unit-tested.
// Money here is display-level (rupees, major units); the server recomputes the
// authoritative totals from menu prices on order placement.

export const normalizeSize = (size) =>
  String(size || '').toLowerCase() === 'large' ? 'large' : 'medium';

/** Which size label to use for an item (flexible sizes[] or legacy medium/large). */
export const resolveSize = (item, selectedSize) => {
  const sizes = item?.sizes || [];
  if (sizes.length) {
    if (selectedSize && sizes.some((s) => s.label === selectedSize)) return selectedSize;
    const def = sizes.find((s) => s.isDefault) || sizes[0];
    return def?.label || null;
  }
  return normalizeSize(selectedSize);
};

/** Sum of modifier price deltas stored as selectedOptions values. */
export const optionDelta = (selectedOptions) =>
  Object.values(selectedOptions || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);

/** Unit base price for the item's currently selected size. */
export const unitPrice = (item) => {
  const sizes = item?.sizes || [];
  if (sizes.length) {
    const match =
      sizes.find((s) => s.label === item.selectedSize) ||
      sizes.find((s) => s.isDefault) ||
      sizes[0];
    return Number(match?.price || 0);
  }
  return Number(item?.price?.[normalizeSize(item?.selectedSize)] || 0);
};

/** (unit price + modifier deltas) × quantity. */
export const lineTotal = (item) =>
  (unitPrice(item) + optionDelta(item?.selectedOptions)) * (item?.quantity || 1);

/** Cart-wide subtotal, total prep time (minutes) and item count. */
export const cartTotals = (items = []) =>
  items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + lineTotal(item),
      totalPrepTime: acc.totalPrepTime + Number(item?.preparationTime || 0) * (item?.quantity || 1),
      count: acc.count + (item?.quantity || 1),
    }),
    { subtotal: 0, totalPrepTime: 0, count: 0 }
  );

/** Client-side estimate at checkout (GST in basis points + optional tip). */
export const estimateTotals = (items = [], { tipAmount = 0, taxBps = 500 } = {}) => {
  const { subtotal, totalPrepTime, count } = cartTotals(items);
  const taxAmount = Math.round(((subtotal * (Number(taxBps) || 0)) / 10000) * 100) / 100;
  const tip = Number(tipAmount) || 0;
  const total = Math.round((subtotal + taxAmount + tip) * 100) / 100;
  return { subtotal, taxAmount, tipAmount: tip, total, totalPrepTime, count };
};

/** Stable de-dupe key: same item + size + options merges into one line. */
export const generateCartItemId = (id, size, options) =>
  `${id}-${size}-${Object.entries(options || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')}`;

/** Shape cart lines into the server's `POST /orders` item contract. */
export const buildOrderItems = (items = []) =>
  items.map((item) => ({
    menuItem: item._id,
    size: resolveSize(item, item.selectedSize),
    quantity: item.quantity || 1,
    options: Object.entries(item.selectedOptions || {}).map(([name, value]) => ({
      name: typeof value === 'string' ? value : name,
      priceDelta: Number(value) || 0,
    })),
    specialInstructions: item.specialInstructions || '',
  }));
