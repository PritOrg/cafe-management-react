const { sendResponse } = require('../middleware/auth');
const tableRepo = require('../repositories/tableRepo');

/** List floor tables with their status (available | occupied) for the POS. */
exports.listTables = async (req, res) => {
    try {
        const tables = await tableRepo.findAll(req.tenantId);
        return sendResponse(res, 200, true, 'Tables retrieved', tables);
    } catch (err) {
        console.error('Error listing tables:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};
