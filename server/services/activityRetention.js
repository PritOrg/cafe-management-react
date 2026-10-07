const { getDb } = require('../db/pool');
const settingsRepo = require('../repositories/settingsRepo');

/**
 * Nightly activity retention: delete rows older than ops.activity_retention_days (default 365).
 * Call from cron / `node scripts/prune-activity.js`.
 */
const pruneOldActivity = async (daysOverride) => {
    const settings = await settingsRepo.getPublic(null).catch(() => null);
    // tenant-agnostic default; per-tenant settings can override later
    const days = Number(daysOverride || settings?.ops?.activity_retention_days || 365);
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
    const deleted = await getDb()('activity_logs')
        .where('created_at', '<', cutoff)
        .del();
    return { days, cutoff: cutoff.toISOString(), deleted };
};

module.exports = { pruneOldActivity };
