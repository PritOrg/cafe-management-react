const { getDb } = require('../db/pool');
const { mapStaff, toPublic } = require('../db/mappers');
const { hashPassword } = require('../services/authService');

const cols = ['id', 'tenant_id', 'is_platform_admin', 'first_name', 'last_name', 'email', 'password',
    'phone', 'profile_photo_url', 'role', 'is_active', 'registration_date', 'last_login', 'created_at', 'updated_at'];

const findAll = async (tenantId) => {
    const rows = await getDb()('staff_admins').where({ tenant_id: tenantId }).andWhere('is_active', true).orderBy('created_at', 'desc');
    return rows.map((r) => mapStaff(toPublic(r)));
};

const findByEmail = async (tenantId, email) => {
    const row = await getDb()('staff_admins')
        .where({ tenant_id: tenantId, email: email.toLowerCase() })
        .first();
    return row ? mapStaff(toPublic(row)) : null;
};

const findByEmailForLogin = async (tenantId, email) => {
    const row = await getDb()('staff_admins')
        .where({ tenant_id: tenantId, email: email.toLowerCase() })
        .whereNot('is_platform_admin', true)
        .first();
    return row || null;
};

const findPlatformAdminByEmail = async (email) => {
    const row = await getDb()('staff_admins')
        .where({ email: email.toLowerCase(), is_platform_admin: true })
        .first();
    return row || null;
};

const create = async (tenantId, data) => {
    const passwordHash = data.password ? await hashPassword(data.password) : null;
    const [row] = await getDb()('staff_admins').insert({
        tenant_id: tenantId,
        is_platform_admin: !!data.isPlatformAdmin,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email.toLowerCase(),
        password: passwordHash,
        phone: data.phone || null,
        profile_photo_url: data.profilePhotoUrl || null,
        role: data.role,
        is_active: data.isActive !== false,
    }).returning(cols);
    return mapStaff(toPublic(row));
};

const findById = async (tenantId, id) => {
    const row = await getDb()('staff_admins').where({ id, tenant_id: tenantId }).first();
    return row ? mapStaff(toPublic(row)) : null;
};

const updateById = async (tenantId, id, data) => {
    const patch = { updated_at: new Date() };
    if (data.firstName) patch.first_name = data.firstName;
    if (data.lastName) patch.last_name = data.lastName;
    if (data.role) patch.role = data.role;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.isActive !== undefined) patch.is_active = data.isActive;
    if (data.profilePhotoUrl !== undefined) patch.profile_photo_url = data.profilePhotoUrl;
    const [row] = await getDb()('staff_admins')
        .where({ id, tenant_id: tenantId })
        .update(patch)
        .returning(cols);
    return row ? mapStaff(toPublic(row)) : null;
};

const deleteById = async (tenantId, id) => {
    const [row] = await getDb()('staff_admins')
        .where({ id, tenant_id: tenantId })
        .update({ is_active: false, updated_at: new Date() })
        .returning(cols);
    return row ? mapStaff(toPublic(row)) : null;
};

const touchLogin = async (id) => {
    await getDb()('staff_admins').where({ id }).update({ last_login: new Date() });
};

module.exports = {
    findAll,
    findByEmail,
    findByEmailForLogin,
    findPlatformAdminByEmail,
    create,
    findById,
    updateById,
    deleteById,
    touchLogin,
};
