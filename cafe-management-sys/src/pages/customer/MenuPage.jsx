import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  InputBase,
  IconButton,
  Chip,
  Button,
  Skeleton,
  Stack,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import MenuItemCard from '../../components/menu/MenuItemCard';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import useMenuData from '../../hooks/useMenuData';

const MenuPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [categoryFilter, setCategoryFilter] = useState('');
  const { items, loading } = useMenuData();

  // Navbar search lands here as ?q=; keep the field in sync with it.
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const updateSearch = (value) => {
    setSearchQuery(value);
    setSearchParams(value ? { q: value } : {}, { replace: true });
  };

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort(),
    [items]
  );

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
          (!categoryFilter || item.category === categoryFilter)
      ),
    [items, searchQuery, categoryFilter]
  );

  const hasFilters = Boolean(categoryFilter || searchQuery);
  const clearAllFilters = () => {
    updateSearch('');
    setCategoryFilter('');
  };

  const renderSkeletonCards = () => (
    <Grid2 container spacing={2}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Grid2 xs={12} sm={6} md={4} lg={3} key={index}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
            <Skeleton variant="rounded" height={160} sx={{ mb: 2, borderRadius: 3 }} />
            <Skeleton variant="text" width="70%" height={28} />
            <Skeleton variant="text" width="40%" height={22} />
          </Paper>
        </Grid2>
      ))}
    </Grid2>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Menu"
        icon={<RestaurantMenuIcon fontSize="small" />}
        subtitle={loading ? 'Loading…' : `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'}`}
      />

      {/* Sticky search + category filters (M3 search bar + filter chips) */}
      <Box
        sx={{
          position: 'sticky',
          top: { xs: 60, md: 64 },
          zIndex: (t) => t.zIndex.appBar - 1,
          bgcolor: 'background.default',
          pb: 1,
          mx: { xs: -1.5, sm: -2, md: -3 },
          px: { xs: 1.5, sm: 2, md: 3 },
        }}
      >
        <Paper
          elevation={0}
          component="form"
          onSubmit={(e) => e.preventDefault()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            borderRadius: 999,
            bgcolor: 'action.hover',
          }}
        >
          <SearchIcon color="action" />
          <InputBase
            value={searchQuery}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Search the menu"
            inputProps={{ 'aria-label': 'Search menu', enterKeyHint: 'search' }}
            sx={{ flex: 1, py: 1 }}
          />
          {searchQuery && (
            <IconButton size="small" aria-label="Clear search" onClick={() => updateSearch('')}>
              <ClearIcon fontSize="small" />
            </IconButton>
          )}
        </Paper>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mt: 1.5,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Chip
            label="All"
            onClick={() => setCategoryFilter('')}
            color={categoryFilter ? 'default' : 'primary'}
            variant={categoryFilter ? 'outlined' : 'filled'}
          />
          {categories.map((category) => {
            const selected = categoryFilter === category;
            return (
              <Chip
                key={category}
                label={category}
                onClick={() => setCategoryFilter(selected ? '' : category)}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
              />
            );
          })}
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        {loading ? (
          renderSkeletonCards()
        ) : filteredItems.length > 0 ? (
          <Grid2 container spacing={2}>
            {filteredItems.map((item) => (
              <Grid2 xs={12} sm={6} md={4} lg={3} key={item._id || item.id}>
                <MenuItemCard menuItem={item} />
              </Grid2>
            ))}
          </Grid2>
        ) : (
          <EmptyState
            icon={<RestaurantMenuIcon />}
            title={hasFilters ? 'No matching items' : 'No menu items yet'}
            description={
              hasFilters
                ? 'Try a different search or category.'
                : 'The menu is being prepared. Please check back soon.'
            }
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={hasFilters ? clearAllFilters : undefined}
          />
        )}
      </Box>

      {!loading && filteredItems.length > 0 && hasFilters && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Button onClick={clearAllFilters} color="primary">
            Clear filters
          </Button>
        </Stack>
      )}
    </Container>
  );
};

export default MenuPage;
