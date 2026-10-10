// Reorder suggestions. `reorderQty` is the target on-hand level: when on-hand
// drops below it, the suggested purchase is the difference.
export const suggestedPurchase = (item = {}) => {
  const reorder = item.reorderQty != null ? Number(item.reorderQty) : NaN;
  if (!Number.isFinite(reorder) || reorder <= 0) return null;
  const qty = Number(item.quantity ?? 0);
  if (qty >= reorder) return null;
  return reorder - qty;
};

export const reorderItems = (items = []) =>
  items
    .map((item) => ({ item, suggested: suggestedPurchase(item) }))
    .filter((r) => r.suggested != null && r.suggested > 0);