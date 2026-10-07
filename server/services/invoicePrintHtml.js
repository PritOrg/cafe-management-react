/** Server-side HTML print views (Tier 1) — A4 + thermal widths, browser print */

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const inr = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

const layoutCss = (mode) => {
    const page = mode === 'thermal' ? '@page { size: 80mm auto; margin: 4mm; }' : '@page { size: A4; margin: 12mm; }';
    const bodyW = mode === 'thermal' ? '72mm' : 'auto';
    const font = mode === 'thermal' ? '11pt/1.4' : '10pt/1.45';
    return `
${page}
* { box-sizing: border-box; }
body { font-family: Georgia, 'Times New Roman', serif; font-size: ${font}; color: #111; margin: 0; background: #fff; }
.wrap { width: ${bodyW}; margin: 0 auto; padding: 8px; }
h1 { font-size: ${mode === 'thermal' ? '14pt' : '16pt'}; text-align: center; margin: 0 0 6px; letter-spacing: 0.04em; }
.brand { text-align: center; margin-bottom: 8px; }
.brand .name { font-weight: 700; font-size: ${mode === 'thermal' ? '12pt' : '13pt'}; }
.meta { margin: 6px 0; }
.meta div { margin: 2px 0; }
table { width: 100%; border-collapse: collapse; margin: 8px 0; }
th, td { border-bottom: 1px solid #ccc; padding: 4px 2px; text-align: left; vertical-align: top; }
th { border-bottom: 2px solid #222; font-size: ${mode === 'thermal' ? '8pt' : '9pt'}; text-transform: uppercase; letter-spacing: 0.03em; }
td.num, th.num { text-align: right; white-space: nowrap; }
.totals { margin-top: 8px; }
.totals div { display: flex; justify-content: space-between; margin: 3px 0; }
.grand { font-weight: 700; font-size: ${mode === 'thermal' ? '13pt' : '13pt'}; border-top: 2px solid #222; padding-top: 6px; }
.words { margin-top: 8px; font-style: italic; }
.sig { margin-top: 28px; text-align: right; }
@media print {
  .no-print { display: none !important; }
  body { background: #fff; }
}
.toolbar { margin: 12px auto; width: ${bodyW}; text-align: center; }
`;
};

const renderInvoiceHtml = (inv, { mode = 'a4' } = {}) => {
    const brand = inv.brandSnapshot?.brand || {};
    const gst = inv.brandSnapshot?.gst || {};
    const isThermal = mode === 'thermal' || mode === 'thermal80' || mode === 'thermal58' || mode === '80mm';

    const header = `
      <div class="brand">
        <div class="name">${esc(brand.title || 'Cafe')}</div>
        ${gst.legalName ? `<div>${esc(gst.legalName)}</div>` : ''}
        ${gst.legalAddress ? `<div>${esc(gst.legalAddress)}</div>` : ''}
        ${gst.gstin ? `<div><strong>GSTIN:</strong> ${esc(gst.gstin)}</div>` : ''}
      </div>
      <h1>TAX INVOICE</h1>
      <div class="meta">
        <div><strong>Invoice:</strong> ${esc(inv.invoiceNumber)}</div>
        <div><strong>Date:</strong> ${esc(inv.issuedAt ? new Date(inv.issuedAt).toLocaleString('en-IN') : '')}</div>
        <div><strong>FY:</strong> ${esc(inv.fiscalYear)}</div>
        <div><strong>Place of supply:</strong> ${esc(inv.placeOfSupply || '—')}</div>
      </div>`;

    const items = (inv.lineItems || []).map((li) => `
      <tr>
        <td>${esc(li.description)}</td>
        ${isThermal ? '' : `<td>${esc(li.hsnSac || '')}</td>`}
        <td class="num">${esc(li.quantity)}</td>
        <td class="num">${inr(li.taxable)}</td>
        <td class="num">${inr(li.taxAmount)}</td>
        <td class="num">${inr(li.amount)}</td>
      </tr>`).join('');

    const headRow = `
      <tr>
        <th>Item</th>
        ${isThermal ? '' : '<th>HSN/SAC</th>'}
        <th class="num">Qty</th>
        <th class="num">Taxable</th>
        <th class="num">Tax</th>
        <th class="num">Amount</th>
      </tr>`;

    const taxRows = inv.interState
        ? `<div><span>IGST</span><span>${inr(inv.igstAmount)}</span></div>`
        : `<div><span>CGST</span><span>${inr(inv.cgstAmount)}</span></div>
           <div><span>SGST</span><span>${inr(inv.sgstAmount)}</span></div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(inv.invoiceNumber)} — Tax Invoice</title>
<style>${layoutCss(isThermal ? 'thermal' : 'a4')}</style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">Print</button>
    <a href="/api/v1/invoices/${encodeURIComponent(inv.id || inv._id)}/pdf?format=${isThermal ? 'thermal80' : 'a4'}">PDF</a>
  </div>
  <div class="wrap">
    ${header}
    <table>
      <thead>${headRow}</thead>
      <tbody>${items}</tbody>
    </table>
    <div class="totals">
      <div><span>Taxable</span><span>${inr(inv.taxableAmount)}</span></div>
      ${taxRows}
      <div class="grand"><span>Grand total</span><span>${inr(inv.grandTotal)}</span></div>
    </div>
    <div class="words">Amount in words: ${esc(inv.amountInWords || '')}</div>
    <div class="sig">For ${esc(gst.legalName || brand.title || 'Cafe')}<br/>Authorised signatory</div>
  </div>
</body>
</html>`;
};

module.exports = { renderInvoiceHtml };
