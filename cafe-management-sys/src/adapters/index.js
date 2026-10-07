// View-model adapters: API payloads → UI shapes.
// Phase I (Postgres) column renames should land here, not in pages.

export const adaptOrder = (o) => {
  if (!o) return o;
  const customer = o.placedByCustomer || o.placedByStaff || {};
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Walk-in';
  return {
    ...o,
    orderNumber: o.orderNumber || String(o._id || '').slice(-6).toUpperCase(),
    customer: {
      name,
      email: customer.email || '—',
    },
    total: Number(o.finalAmount ?? o.totalAmount ?? 0),
    createdAt: o.placedAt || o.createdAt,
    items: (o.items || []).map((it) => ({
      ...it,
      name: it.menuItem?.title || it.name || 'Item',
      price: Number(it.itemPrice ?? it.price ?? 0),
    })),
  };
};

export const adaptMenuItem = (m) => {
  if (!m) return m;
  return {
    ...m,
    id: m._id,
    priceMedium: m.price?.medium,
    priceLarge: m.price?.large,
  };
};

export default { adaptOrder, adaptMenuItem };
