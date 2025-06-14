import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Select, 
  MenuItem,
  InputAdornment,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Zoom,
  Fade,
  Stack,
  InputLabel,
  FormControl,
  Skeleton
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import MenuItemCard from '../../components/MenuItemCard';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ClearIcon from '@mui/icons-material/Clear';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';

const MenuPage = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchFocused, setSearchFocused] = useState(false);
    
    const categories = [
        { value: 'Coffee', icon: '☕', color: '#8B4513' },
        { value: 'PIE', icon: '🥧', color: '#D4A574' },
        { value: 'Pastries', icon: '🥐', color: '#F4A460' },
        { value: 'Beverages', icon: '🥤', color: '#A67B5B' },
        { value: 'Sandwiches', icon: '🥪', color: '#B8956A' }
    ];
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4969/api';
    
    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/menu`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setMenuItems(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                setLoading(false);
            });
    }, [API_URL]);

    const filteredItems = menuItems
        .filter((item) => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (!categoryFilter || item.category === categoryFilter)
        );

    const clearAllFilters = () => {
        setSearchQuery('');
        setCategoryFilter('');
    };

    const renderSkeletonCards = () => (
        <Grid2 container spacing={3}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <Grid2 xs={12} sm={6} md={4} lg={3} key={item}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 3, 
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Skeleton variant="rounded" width="100%" height={180} sx={{ mb: 2 }} />
                        <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Skeleton variant="text" width="40%" height={24} />
                            <Skeleton variant="rounded" width={80} height={36} />
                        </Box>
                    </Paper>
                </Grid2>
            ))}
        </Grid2>
    );

    return (
        <Box sx={{ 
            backgroundColor: 'background.default', 
            minHeight: '100vh', 
            py: 4 
        }}>
            <Container maxWidth="xl">
                {/* Hero Section */}
                <Fade in={true} timeout={800}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 4, 
                            borderRadius: 6, 
                            backgroundColor: 'background.paper',
                            mb: 4,
                            background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.02) 0%, rgba(212, 165, 116, 0.04) 100%)',
                            border: '1px solid',
                            borderColor: 'divider',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(90deg, #8B4513, #D4A574, #F4A460)',
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 2,
                                    flex: 1
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        backgroundColor: 'primary.main',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <LocalCafeIcon sx={{ fontSize: 32 }} />
                                </Box>
                                <Box>
                                    <Typography 
                                        variant="h3" 
                                        sx={{ 
                                            color: 'text.primary', 
                                            fontWeight: 800,
                                            mb: 0.5
                                        }}
                                    >
                                        Our Menu
                                    </Typography>
                                    <Typography 
                                        variant="subtitle1" 
                                        sx={{ 
                                            color: 'text.secondary',
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        Discover our carefully crafted selection of coffee, pastries, and more
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Search and Filter Section */}
                        <Stack 
                            direction={{ xs: 'column', md: 'row' }} 
                            spacing={3} 
                            alignItems={{ xs: 'stretch', md: 'flex-end' }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Search our delicious menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ 
                                                    color: searchFocused ? 'primary.main' : 'text.secondary',
                                                    transition: 'color 0.3s ease'
                                                }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchQuery && (
                                            <InputAdornment position="end">
                                                <Button
                                                    size="small"
                                                    onClick={() => setSearchQuery('')}
                                                    sx={{ 
                                                        minWidth: 'auto',
                                                        p: 0.5,
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    <ClearIcon fontSize="small" />
                                                </Button>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            fontSize: '1rem',
                                            py: 0.5,
                                        },
                                    }}
                                />
                            </Box>
                            
                            <FormControl sx={{ minWidth: 200 }}>
                                <Select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    displayEmpty
                                    variant="outlined"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <FilterListIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                        </InputAdornment>
                                    }
                                    sx={{
                                        '& .MuiSelect-select': {
                                            py: 1.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                        },
                                    }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: { 
                                                borderRadius: 3, 
                                                mt: 1,
                                                boxShadow: '0px 8px 32px rgba(139, 69, 19, 0.12)',
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <span>🍽️</span>
                                            <Typography>All Categories</Typography>
                                        </Box>
                                    </MenuItem>
                                    {categories.map(category => (
                                        <MenuItem key={category.value} value={category.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <span>{category.icon}</span>
                                                <Typography>{category.value}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Paper>
                </Fade>

                {/* Active Filters */}
                {(categoryFilter || searchQuery) && (
                    <Fade in={true}>
                        <Box sx={{ mb: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    backgroundColor: 'background.tertiary',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack 
                                    direction="row" 
                                    alignItems="center" 
                                    spacing={2}
                                    flexWrap="wrap"
                                    useFlexGap
                                >
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            color: 'text.secondary',
                                            fontWeight: 500
                                        }}
                                    >
                                        Active filters:
                                    </Typography>
                                    
                                    {searchQuery && (
                                        <Chip 
                                            label={`Search: "${searchQuery}"`}
                                            onDelete={() => setSearchQuery('')}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                backgroundColor: 'background.paper',
                                                '& .MuiChip-deleteIcon': {
                                                    color: 'text.secondary',
                                                    '&:hover': {
                                                        color: 'error.main',
                                                    },
                                                },
                                            }}
                                        />
                                    )}
                                    
                                    {categoryFilter && (
                                        <Chip 
                                            label={`Category: ${categoryFilter}`}
                                            onDelete={() => setCategoryFilter('')}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                backgroundColor: 'background.paper',
                                                '& .MuiChip-deleteIcon': {
                                                    color: 'text.secondary',
                                                    '&:hover': {
                                                        color: 'error.main',
                                                    },
                                                },
                                            }}
                                        />
                                    )}
                                    
                                    <Button
                                        size="small"
                                        onClick={clearAllFilters}
                                        sx={{
                                            color: 'text.secondary',
                                            fontSize: '0.75rem',
                                            textDecoration: 'underline',
                                            '&:hover': {
                                                backgroundColor: 'transparent',
                                                textDecoration: 'none',
                                                color: 'primary.main',
                                            },
                                        }}
                                    >
                                        Clear all
                                    </Button>
                                </Stack>
                            </Paper>
                        </Box>
                    </Fade>
                )}

                {/* Results Summary */}
                {!loading && (
                    <Fade in={true} timeout={600}>
                        <Box sx={{ mb: 3 }}>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                    pl: 1
                                }}
                            >
                                {filteredItems.length > 0 
                                    ? `Showing ${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}`
                                    : 'No items found'
                                }
                                {(searchQuery || categoryFilter) && ' matching your criteria'}
                            </Typography>
                        </Box>
                    </Fade>
                )}

                {/* Menu Items Grid */}
                {loading ? (
                    renderSkeletonCards()
                ) : filteredItems.length > 0 ? (
                    <Grid2 container spacing={3}>
                        {filteredItems.map((item, index) => (
                            <Zoom 
                                in={true} 
                                timeout={600}
                                style={{ 
                                    transitionDelay: `${Math.min(index * 100, 800)}ms` 
                                }} 
                                key={item._id}
                            >
                                <Grid2 xs={12} sm={6} md={4} lg={3}>
                                    <MenuItemCard menuItem={item} />
                                </Grid2>
                            </Zoom>
                        ))}
                    </Grid2>
                ) : (
                    <Fade in={true} timeout={600}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 6,
                                borderRadius: 6,
                                textAlign: 'center',
                                backgroundColor: 'background.paper',
                                border: '2px dashed',
                                borderColor: 'divider',
                            }}
                        >
                            <Box sx={{ mb: 3 }}>
                                <RestaurantMenuIcon 
                                    sx={{ 
                                        fontSize: 80, 
                                        color: 'text.hint',
                                        mb: 2
                                    }} 
                                />
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        color: 'text.secondary', 
                                        mb: 1,
                                        fontWeight: 600
                                    }}
                                >
                                    No menu items found
                                </Typography>
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        color: 'text.tertiary',
                                        mb: 3,
                                        maxWidth: 400,
                                        mx: 'auto'
                                    }}
                                >
                                    Try adjusting your search terms or browse all categories to discover our delicious offerings.
                                </Typography>
                            </Box>
                            
                            <Stack 
                                direction={{ xs: 'column', sm: 'row' }} 
                                spacing={2} 
                                justifyContent="center"
                            >
                                <Button 
                                    variant="outlined" 
                                    onClick={clearAllFilters}
                                    size="large"
                                    sx={{ 
                                        px: 4,
                                        py: 1.5,
                                    }}
                                >
                                    Clear All Filters
                                </Button>
                                <Button 
                                    variant="contained" 
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCategoryFilter('Coffee');
                                    }}
                                    size="large"
                                    sx={{ 
                                        px: 4,
                                        py: 1.5,
                                    }}
                                >
                                    Browse Coffee
                                </Button>
                            </Stack>
                        </Paper>
                    </Fade>
                )}
            </Container>
        </Box>
    );
};

export default MenuPage;