require('dotenv').config();
const { pruneOldActivity } = require('../services/activityRetention');

(async () => {
    const result = await pruneOldActivity(process.argv[2]);
    console.log('activity prune', result);
    const { destroyDb } = require('../db/pool');
    await destroyDb();
    process.exit(0);
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
