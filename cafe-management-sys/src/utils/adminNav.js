/** Admin navigation mode by viewport width (mobile-first contract) */
export const navMode = (width) => {
    if (width < 768) return 'drawer';
    if (width < 1200) return 'rail';
    return 'full';
};

export const railItems = (isPlatformAdmin) => {
    const base = [
        'Dashboard', 'Orders', 'Menu Items', 'Staff', 'Revenue',
        'Inventory', 'Analytics', 'Settings', 'Customers', 'Kitchen', 'Activity',
    ];
    return isPlatformAdmin ? [...base, 'Tenants'] : base;
};

/** Auth TextField mobile a11y defaults */
export const authTextFieldSx = {
    '& .MuiInputBase-input': { fontSize: '16px' },
    mb: 2,
};

export const autocompleteFor = (name) => {
    if (name === 'password') return 'current-password';
    if (name === 'email') return 'email';
    if (name === 'firstName') return 'given-name';
    if (name === 'lastName') return 'family-name';
    return 'on';
};
