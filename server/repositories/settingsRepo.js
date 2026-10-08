const { getDb } = require('../db/pool');
const { mapSettings } = require('../db/mappers');

const DEFAULTS = {
    brand: { title: 'My Restaurant', logoUrl: '', primaryColor: '#ff6b35', accentColor: '#f7931e' },
    gst: {
        enabled: true,
        bps: 500,
        gstin: '',
        legalName: '',
        legalAddress: '',
        stateCode: '',
        stateName: '',
        hsnSAC: '996311',
        invoicePrefix: 'INV',
        fyStartMonth: 4,
    },
    ops: { currency: 'INR', timezone: 'Asia/Kolkata', activity_retention_days: 365, printer_host: '' },
    print: { default_paper: 'a4' }, // a4 | thermal80 | thermal58
};

const getOrCreate = async (tenantId) => {
    let row = await getDb()('settings').where({ tenant_id: tenantId }).first();
    if (!row) {
        const [inserted] = await getDb()('settings')
            .insert({ tenant_id: tenantId, data: DEFAULTS })
            .returning('*');
        row = inserted;
    }
    return mapSettings(row);
};

const getPublic = async (tenantId) => {
    const doc = await getOrCreate(tenantId);
    return {
        brand: { ...DEFAULTS.brand, ...(doc.data.brand || {}) },
        gst: { ...DEFAULTS.gst, ...(doc.data.gst || {}) },
        ops: { ...DEFAULTS.ops, ...(doc.data.ops || {}) },
        print: { ...DEFAULTS.print, ...(doc.data.print || {}) },
    };
};

const update = async (tenantId, patch) => {
    const doc = await getOrCreate(tenantId);
    const data = {
        brand: { ...doc.data.brand, ...(patch.brand || {}) },
        gst: { ...doc.data.gst, ...(patch.gst || {}) },
        ops: { ...doc.data.ops, ...(patch.ops || {}) },
        print: { ...DEFAULTS.print, ...(doc.data.print || {}), ...(patch.print || {}) },
    };
    const [row] = await getDb()('settings')
        .where({ tenant_id: tenantId })
        .update({ data, updated_at: new Date() })
        .returning('*');
    return mapSettings(row).data;
};

const fiscalYear = (date = new Date(), fyStartMonth = 4) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const startYear = m >= fyStartMonth ? y : y - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
};

module.exports = { getOrCreate, getPublic, update, DEFAULTS, fiscalYear };
