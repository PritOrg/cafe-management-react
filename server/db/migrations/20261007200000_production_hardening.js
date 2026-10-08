/**
 * Production DB hardening:
 * - CHECK constraints (status/payment/role/movement enums, money >= 0, qty > 0)
 * - Missing FKs (inventory.menu_item_id, modifier option/group links)
 * - Performance indexes for kitchen, low-stock, activity queries
 */
const DATA_FIXES = [
    `UPDATE staff_admins SET role = 'staff' WHERE role IS NULL OR role NOT IN ('staff','admin')`,
    `UPDATE orders SET status = 'pending' WHERE status IS NULL OR status NOT IN ('pending','preparing','ready','served','cancelled')`,
    `UPDATE orders SET payment_method = 'cash' WHERE payment_method IS NULL OR payment_method NOT IN ('cash','upi_manual','card_manual')`,
    `UPDATE orders SET payment_status = 'pending' WHERE payment_status IS NULL OR payment_status NOT IN ('pending','paid')`,
    `UPDATE tenants SET status = 'active' WHERE status IS NULL OR status NOT IN ('active','suspended')`,
    `UPDATE invoices SET status = 'void' WHERE status IS NULL OR status NOT IN ('issued','void')`,
    `UPDATE inventory SET quantity = 0 WHERE quantity < 0`,
    `UPDATE inventory SET min_qty = 0 WHERE min_qty IS NULL OR min_qty < 0`,
    `UPDATE orders SET total_amount = 0 WHERE total_amount IS NULL OR total_amount < 0`,
    `UPDATE orders SET final_amount = 0 WHERE final_amount IS NULL OR final_amount < 0`,
    `UPDATE orders SET tip_amount = 0 WHERE tip_amount IS NULL OR tip_amount < 0`,
    `UPDATE orders SET discount_amount = 0 WHERE discount_amount IS NULL OR discount_amount < 0`,
    `UPDATE order_items SET quantity = 1 WHERE quantity IS NULL OR quantity <= 0`,
    `UPDATE order_items SET item_price = 0 WHERE item_price IS NULL OR item_price < 0`,
    `UPDATE order_items SET preparation_time = 0 WHERE preparation_time IS NULL OR preparation_time < 0`,
    `DELETE FROM inventory_movements WHERE delta = 0`,
    `UPDATE inventory_movements SET delta = CASE WHEN delta > 0 THEN 1 ELSE -1 END WHERE delta IS NULL OR delta = 0`,
    `UPDATE inventory_movements SET type = 'adjust' WHERE type IS NULL OR type NOT IN ('purchase','waste','adjust','order')`,
    // Keep newest row per natural key before UNIQUE indexes
    `DELETE FROM orders a USING orders b WHERE a.tenant_id = b.tenant_id AND a.order_number = b.order_number AND a.created_at < b.created_at`,
    `DELETE FROM staff_admins a USING staff_admins b WHERE a.tenant_id IS NOT NULL AND b.tenant_id IS NOT NULL AND a.tenant_id = b.tenant_id AND a.email = b.email AND a.created_at < b.created_at`,
    `DELETE FROM customers a USING customers b WHERE a.tenant_id = b.tenant_id AND a.email = b.email AND a.created_at < b.created_at`,
    `DELETE FROM discounts a USING discounts b WHERE a.tenant_id = b.tenant_id AND a.code = b.code AND a.created_at < b.created_at`,
    `DELETE FROM tables a USING tables b WHERE a.tenant_id = b.tenant_id AND a.number = b.number AND a.created_at < b.created_at`,
    `DELETE FROM categories a USING categories b WHERE a.tenant_id = b.tenant_id AND a.slug = b.slug AND a.created_at < b.created_at`,
    `DELETE FROM invoices a USING invoices b WHERE a.tenant_id = b.tenant_id AND a.invoice_number = b.invoice_number AND a.created_at < b.created_at`,
    `DELETE FROM menu_item_sizes a USING menu_item_sizes b WHERE a.menu_item_id = b.menu_item_id AND a.label = b.label AND a.sort_order < b.sort_order`,
    `DELETE FROM menu_item_recipes a USING menu_item_recipes b WHERE a.menu_item_id = b.menu_item_id AND a.inventory_item_id = b.inventory_item_id AND a.created_at < b.created_at`,
];

const CONSTRAINTS = [
    {
        table: 'tenants',
        name: 'tenants_status_check',
        sql: `ALTER TABLE tenants ADD CONSTRAINT tenants_status_check CHECK (status IN ('active','suspended'))`,
    },
    {
        table: 'staff_admins',
        name: 'staff_admins_role_check',
        sql: `ALTER TABLE staff_admins ADD CONSTRAINT staff_admins_role_check CHECK (role IN ('staff','admin'))`,
    },
    {
        table: 'orders',
        name: 'orders_status_check',
        sql: `ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','preparing','ready','served','cancelled'))`,
    },
    {
        table: 'orders',
        name: 'orders_payment_method_check',
        sql: `ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('cash','upi_manual','card_manual'))`,
    },
    {
        table: 'orders',
        name: 'orders_payment_status_check',
        sql: `ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending','paid'))`,
    },
    {
        table: 'orders',
        name: 'orders_money_nonneg_check',
        sql: `ALTER TABLE orders ADD CONSTRAINT orders_money_nonneg_check CHECK (total_amount >= 0 AND final_amount >= 0 AND tip_amount >= 0 AND discount_amount >= 0)`,
    },
    {
        table: 'order_items',
        name: 'order_items_qty_check',
        sql: `ALTER TABLE order_items ADD CONSTRAINT order_items_qty_check CHECK (quantity > 0 AND item_price >= 0 AND preparation_time >= 0)`,
    },
    {
        table: 'invoices',
        name: 'invoices_status_check',
        sql: `ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('issued','void'))`,
    },
    {
        table: 'inventory_movements',
        name: 'inventory_movements_type_check',
        sql: `ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_type_check CHECK (type IN ('purchase','waste','adjust','order'))`,
    },
    {
        table: 'inventory_movements',
        name: 'inventory_movements_delta_check',
        sql: `ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_delta_check CHECK (delta <> 0)`,
    },
    {
        table: 'inventory',
        name: 'inventory_qty_check',
        sql: `ALTER TABLE inventory ADD CONSTRAINT inventory_qty_check CHECK (quantity >= 0 AND min_qty >= 0)`,
    },
    {
        table: 'discounts',
        name: 'discounts_pct_check',
        sql: `ALTER TABLE discounts ADD CONSTRAINT discounts_pct_check CHECK (discount_percentage >= 0 AND discount_percentage <= 100 AND max_discount_amount >= 0 AND min_order_amount >= 0)`,
    },
    {
        table: 'menu_item_sizes',
        name: 'menu_item_sizes_price_check',
        sql: `ALTER TABLE menu_item_sizes ADD CONSTRAINT menu_item_sizes_price_check CHECK (price >= 0)`,
    },
    {
        table: 'menu_item_recipes',
        name: 'menu_item_recipes_qty_check',
        sql: `ALTER TABLE menu_item_recipes ADD CONSTRAINT menu_item_recipes_qty_check CHECK (qty > 0)`,
    },
];

const FKS = [
    {
        name: 'inventory_menu_item_fk',
        sql: `ALTER TABLE inventory ADD CONSTRAINT inventory_menu_item_fk FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL`,
    },
    {
        name: 'modifier_options_group_fk',
        sql: `ALTER TABLE modifier_options ADD CONSTRAINT modifier_options_group_fk FOREIGN KEY (modifier_group_id) REFERENCES modifier_groups(id) ON DELETE CASCADE`,
    },
    {
        name: 'mimg_menu_item_fk',
        sql: `ALTER TABLE menu_item_modifier_groups ADD CONSTRAINT mimg_menu_item_fk FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE`,
    },
    {
        name: 'mimg_modifier_group_fk',
        sql: `ALTER TABLE menu_item_modifier_groups ADD CONSTRAINT mimg_modifier_group_fk FOREIGN KEY (modifier_group_id) REFERENCES modifier_groups(id) ON DELETE CASCADE`,
    },
];

const INDEXES = [
    {
        name: 'orders_tenant_status_placed_idx',
        sql: `CREATE INDEX orders_tenant_status_placed_idx ON orders (tenant_id, status, placed_at DESC)`,
    },
    {
        name: 'activity_logs_tenant_action_idx',
        sql: `CREATE INDEX activity_logs_tenant_action_idx ON activity_logs (tenant_id, action, created_at DESC)`,
    },
    {
        name: 'inventory_tenant_lowstock_idx',
        sql: `CREATE INDEX inventory_tenant_lowstock_idx ON inventory (tenant_id) WHERE is_active = true AND quantity <= min_qty`,
    },
    {
        name: 'order_items_tenant_menu_idx',
        sql: `CREATE INDEX order_items_tenant_menu_idx ON order_items (menu_item_id, order_id)`,
    },
];

/**
 * Critical unique indexes — recreate as true UNIQUE if the name exists but is not unique
 * (earlier knex .index() calls left some *_uq names as plain indexes).
 */
const UNIQUE_INDEXES = [
    { table: 'orders', name: 'orders_tenant_number_uq', cols: '(tenant_id, order_number)' },
    { table: 'staff_admins', name: 'staff_admins_tenant_email_uq', cols: '(tenant_id, email)' },
    { table: 'staff_admins', name: 'staff_admins_platform_email_uq', cols: '(email) WHERE is_platform_admin = true' },
    { table: 'customers', name: 'customers_tenant_email_uq', cols: '(tenant_id, email)' },
    { table: 'discounts', name: 'discounts_tenant_code_uq', cols: '(tenant_id, code)' },
    { table: 'tables', name: 'tables_tenant_number_uq', cols: '(tenant_id, number)' },
    { table: 'categories', name: 'categories_tenant_slug_uq', cols: '(tenant_id, slug)' },
    { table: 'counters', name: 'counters_tenant_name_uq', cols: '(tenant_id, name)' },
    { table: 'invoices', name: 'invoices_tenant_number_uq', cols: '(tenant_id, invoice_number)' },
    { table: 'invoices', name: 'invoices_tenant_order_uq', cols: '(tenant_id, order_id)' },
    { table: 'invoices', name: 'invoices_tenant_fy_seq_uq', cols: '(tenant_id, fiscal_year, seq)' },
    { table: 'menu_item_sizes', name: 'menu_sizes_item_label_uq', cols: '(menu_item_id, label)' },
    { table: 'menu_item_recipes', name: 'recipe_item_inv_uq', cols: '(menu_item_id, inventory_item_id)' },
    { table: 'menu_item_modifier_groups', name: 'mimg_item_group_uq', cols: '(menu_item_id, modifier_group_id)' },
    { table: 'settings', name: 'settings_tenant_id_unique', cols: '(tenant_id)' },
];

const constraintExists = async (knex, table, name) => {
    const rows = await knex('information_schema.table_constraints')
        .where({ table_schema: 'public', table_name: table, constraint_name: name });
    return rows.length > 0;
};

const indexExists = async (knex, name) => {
    const rows = await knex('pg_indexes').where({ schemaname: 'public', indexname: name });
    return rows.length > 0;
};

const fkExists = async (knex, name) => {
    const rows = await knex('information_schema.table_constraints')
        .where({ table_schema: 'public', constraint_name: name, constraint_type: 'FOREIGN KEY' });
    return rows.length > 0;
};

const isUniqueIndex = async (knex, name) => {
    const rows = await knex('pg_indexes')
        .where({ schemaname: 'public', indexname: name })
        .first();
    return !!(rows && rows.indexdef && rows.indexdef.startsWith('CREATE UNIQUE INDEX'));
};

exports.up = async (knex) => {
    // Normalize legacy/dirty rows before CHECK constraints
    for (const sql of DATA_FIXES) {
        await knex.raw(sql);
    }
    for (const c of CONSTRAINTS) {
        if (!(await constraintExists(knex, c.table, c.name))) {
            await knex.raw(c.sql);
        }
    }
    for (const f of FKS) {
        if (!(await fkExists(knex, f.name))) {
            try {
                await knex.raw(f.sql);
            } catch (err) {
                if (!/already exists|does not exist/i.test(err.message)) throw err;
            }
        }
    }
    for (const u of UNIQUE_INDEXES) {
        if (!(await isUniqueIndex(knex, u.name))) {
            await knex.raw(`DROP INDEX IF EXISTS ${u.name}`);
            await knex.raw(`CREATE UNIQUE INDEX ${u.name} ON ${u.table} ${u.cols}`);
        }
    }
    for (const i of INDEXES) {
        if (!(await indexExists(knex, i.name))) {
            await knex.raw(i.sql);
        }
    }
};

exports.down = async (knex) => {
    for (const i of INDEXES) {
        await knex.raw(`DROP INDEX IF EXISTS ${i.name}`);
    }
    for (const _u of UNIQUE_INDEXES) {
        // leave unique indexes in place — dropping them weakens data integrity
    }
    for (const f of FKS) {
        try {
            await knex.raw(`ALTER TABLE ${f.table || 'inventory'} DROP CONSTRAINT IF EXISTS ${f.name}`);
        } catch { /* optional */ }
    }
    for (const c of CONSTRAINTS) {
        await knex.raw(`ALTER TABLE ${c.table} DROP CONSTRAINT IF EXISTS ${c.name}`);
    }
};
