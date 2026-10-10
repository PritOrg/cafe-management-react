import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { sortRows, toggleSort } from '../../utils/sortable';

const PAGE_SIZE = 25;

/**
 * Admin-on-touch table: a real MUI Table at `md+` (sticky header, pagination
 * 25/page) and a card list below `sm`, toggled with CSS breakpoints (no
 * useMediaQuery). Tap targets are ≥44px via `size="medium"` controls.
 *
 * Props:
 * - `rows`        the full (already filtered/sorted) records.
 * - `columns`     `[{ label, align? }]` for the table header.
 * - `renderRow`   `(row) => <TableRow>…</TableRow>` (md+ view).
 * - `renderCard`  `(row) => <Card>…</Card>` (sm view).
 * - `loading` / `emptyMessage` handle the two empty states.
 */
const ResponsiveTable = ({
  rows = [],
  columns = [],
  renderRow,
  renderCard,
  loading,
  emptyMessage = 'No records found',
}) => {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState(null);

  const sortableRows = useMemo(
    () => (sort ? sortRows(rows, sort.key, sort.dir) : rows),
    [rows, sort]
  );
  const pageCount = Math.max(1, Math.ceil((sortableRows.length || 0) / PAGE_SIZE));

  // Reset to the first page whenever the record set changes (search/filter).
  useEffect(() => {
    setPage(0);
  }, [rows.length]);

  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const visible = sortableRows.slice(start, start + PAGE_SIZE);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sortableRows.length) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Table — md and up */}
      <TableContainer sx={{ display: { xs: 'none', md: 'block' }, maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col, i) => (
                <TableCell key={i} align={col.align || 'left'}>
                  {col.sortKey ? (
                    <TableSortLabel
                      active={sort?.key === col.sortKey}
                      direction={sort?.key === col.sortKey ? sort.dir : 'asc'}
                      onClick={() => setSort((s) => toggleSort(s, col.sortKey))}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>{visible.map((row) => renderRow(row))}</TableBody>
        </Table>
      </TableContainer>

      {/* Cards — below md */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {visible.map((row) => renderCard(row))}
      </Box>

      {/* Pagination */}
      {sortableRows.length > PAGE_SIZE && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {start + 1}–{Math.min(start + PAGE_SIZE, rows.length)} of {rows.length}
          </Typography>
          <Box>
            <IconButton
              size="medium"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              size="medium"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ResponsiveTable;