# Print matrix checklist

Run this **manually once per release** before publishing. Every row must pass —
correct page size, no clipped totals, brand header present.

> **Status: not yet verified on hardware.** This list is a pending manual gate
> (see [`STATUS.md`](STATUS.md)); the output paths exist and are unit-tested for
> content, but no printer has been physically exercised yet.

## Papers / devices

| # | Paper / device        | How to produce                                   | Pass criteria |
|---|-----------------------|--------------------------------------------------|---------------|
| 1 | A4 laser              | Invoice detail → **Print A4** (or PDF `a4`)       | Full A4 page, header, HSN summary, amount in words, totals not clipped |
| 2 | A4 inkjet             | Same as above on an inkjet                       | Colors/legibility fine, no banding artefacts |
| 3 | Dot-matrix (tractor)  | PDF `a4` to tractor-feed printer                  | Text legible in mono, borders align |
| 4 | 80mm USB thermal      | Invoice → Paper: **Thermal 80mm** → Print (or ESC/POS) | Width ≤ 80mm, totals right-aligned, no wrap breakage |
| 5 | 58mm thermal          | PDF `thermal58`                                   | Fits 58mm, amounts not truncated |
| 6 | PDF on mobile         | Download PDF, open + print from a phone           | Page size preserved, no clipping |

## Per-device default

- The invoice list has a **Paper** selector (A4 / Thermal 80mm). The choice is
  remembered **per browser** (`localStorage.printPaper`) and used by the row
  “Print” action.
- The tenant-wide default lives in **Settings → Printing → `print.default_paper`**.

## Automation notes

- HTML print: `GET /api/v1/invoices/:id/print?mode=a4|thermal`
- PDF: `GET /api/v1/invoices/:id/pdf?format=a4|a5|thermal80|thermal58`
- ESC/POS: `POST /api/v1/invoices/:id/print-escpos`

Re-printing an old invoice after a brand rename must show the **original**
`brand_snapshot` (not the current settings).
