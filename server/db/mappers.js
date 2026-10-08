const toPublic = (row) => {
    if (!row) return row;
    const { password: _password, ...rest } = row;
    return rest;
};

const mapTenant = (row) => row && ({
    _id: row.id,
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    settings: row.settings || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const mapStaff = (row) => row && ({
    ...toPublic(row),
    _id: row.id,
    tenantId: row.tenant_id,
    isPlatformAdmin: row.is_platform_admin,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url,
    registrationDate: row.registration_date,
    lastLogin: row.last_login,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const mapCustomer = (row) => row && ({
    ...toPublic(row),
    _id: row.id,
    tenantId: row.tenant_id,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url,
    registrationDate: row.registration_date,
    lastLogin: row.last_login,
    loyaltyPoints: row.loyalty_points,
    membershipLevel: row.membership_level,
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const mapMenuItem = (row) => row && ({
    _id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    subTitle: row.sub_title,
    price: { medium: Number(row.price_medium), large: Number(row.price_large) },
    category: row.category,
    categoryId: row.category_id || null,
    imageUrl: row.image_url,
    availability: row.availability,
    calories: row.calories,
    customizationOptions: row.customization_options || [],
    preparationTime: row.preparation_time,
    rating: row.rating,
    tags: row.tags || [],
    allergens: row.allergens || [],
    orderCount: row.order_count,
    subtractStock: row.subtract_stock === true,
    sacCode: row.sac_code || '996311',
    gstRateBps: row.gst_rate_bps != null ? Number(row.gst_rate_bps) : null,
    sizes: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const mapDiscount = (row) => row && ({
    _id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    discountPercentage: Number(row.discount_percentage),
    maxDiscountAmount: Number(row.max_discount_amount),
    minOrderAmount: Number(row.min_order_amount),
    applicableItems: row.applicable_items || [],
    expiresAt: row.expires_at,
});

const mapTable = (row) => row && ({
    _id: row.id,
    tenantId: row.tenant_id,
    number: row.number,
    status: row.status,
    currentOrder: row.current_order_id,
});

const mapOrderItem = (row, menuItem) => ({
    _id: row.id,
    menuItem: menuItem ? menuItem._id : row.menu_item_id,
    menuItemDoc: menuItem || null,
    size: row.size,
    quantity: row.quantity,
    customizations: row.customizations || [],
    specialInstructions: row.special_instructions || '',
    itemPrice: Number(row.item_price),
    preparationTime: row.preparation_time,
    name: menuItem?.title,
    price: Number(row.item_price),
});

const mapOrder = (row, { customer, staff, items } = {}) => row && ({
    _id: row.id,
    tenantId: row.tenant_id,
    orderNumber: row.order_number,
    tableNumber: row.table_number,
    placedByCustomer: customer ? mapCustomer(customer) : (row.placed_by_customer || null),
    placedByStaff: staff ? mapStaff(staff) : (row.placed_by_staff || null),
    items: items || [],
    status: row.status,
    tipAmount: Number(row.tip_amount || 0),
    discountCode: row.discount_id,
    discountAmount: Number(row.discount_amount || 0),
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    totalAmount: Number(row.total_amount),
    finalAmount: Number(row.final_amount),
    placedAt: row.placed_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    clientOrderId: row.client_order_id || null,
});

const mapSettings = (row) => row && ({
    _id: row.id,
    tenantId: row.tenant_id,
    data: row.data || {},
});

const mapActivity = (row) => row && ({
    _id: row.id,
    tenantId: row.tenant_id,
    actorId: row.actor_id,
    actorType: row.actor_type,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    meta: row.meta || {},
    createdAt: row.created_at,
});

const mapInventory = (row) => row && ({
    _id: row.id,
    tenantId: row.tenant_id,
    itemName: row.item_name,
    quantity: Number(row.quantity),
    unit: row.unit,
    category: row.category,
    lastUpdated: row.last_updated,
});

module.exports = {
    toPublic,
    mapTenant,
    mapStaff,
    mapCustomer,
    mapMenuItem,
    mapDiscount,
    mapTable,
    mapOrderItem,
    mapOrder,
    mapSettings,
    mapActivity,
    mapInventory,
};
