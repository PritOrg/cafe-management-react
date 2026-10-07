/** Client-side CSV helpers for order/invoice export */

export const escapeCsv = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const ordersToCsv = (orders = []) => {
    const header = [
        'orderNumber', 'status', 'customerName', 'customerPhone',
        'items', 'totalAmount', 'finalAmount', 'paymentMethod', 'placedAt',
    ];
    const lines = [header.join(',')];
    for (const o of orders) {
        const customer = o.customer || {};
        const items = (o.items || [])
            .map((it) => `${it.quantity}x ${it.name || it.menuItem?.title || 'item'}`)
            .join('; ');
        lines.push([
            o.orderNumber,
            o.status,
            customer.name || '',
            customer.phone || '',
            items,
            o.totalAmount ?? o.total ?? '',
            o.finalAmount ?? '',
            o.paymentMethod || '',
            o.placedAt || o.createdAt || '',
        ].map(escapeCsv).join(','));
    }
    return lines.join('\n');
};

export const downloadCsv = (filename, csv) => {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
