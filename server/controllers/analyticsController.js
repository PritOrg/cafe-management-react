const { sendResponse } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

const periodParam = (req) => {
    const p = String(req.query.period || '30d');
    return ['7d', '30d', '90d', '1y'].includes(p) ? p : '30d';
};

exports.getSummary = async (req, res) => {
    try {
        const data = await analyticsService.summary(req.tenantId);
        return sendResponse(res, 200, true, 'Analytics summary retrieved', data);
    } catch (err) {
        console.error('Error fetching analytics summary:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.getSales = async (req, res) => {
    try {
        const data = await analyticsService.salesSeries(req.tenantId, periodParam(req));
        return sendResponse(res, 200, true, 'Sales analytics retrieved', data);
    } catch (err) {
        console.error('Error fetching sales analytics:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.getOrderStats = async (req, res) => {
    try {
        const data = await analyticsService.orderStats(req.tenantId, periodParam(req));
        return sendResponse(res, 200, true, 'Order stats retrieved', data);
    } catch (err) {
        console.error('Error fetching order stats:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.getTopItems = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
        const data = await analyticsService.topItems(req.tenantId, periodParam(req), limit);
        return sendResponse(res, 200, true, 'Top items retrieved', data);
    } catch (err) {
        console.error('Error fetching top items:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.getCategoryMix = async (req, res) => {
    try {
        const data = await analyticsService.categoryMix(req.tenantId, periodParam(req));
        return sendResponse(res, 200, true, 'Category mix retrieved', data);
    } catch (err) {
        console.error('Error fetching category mix:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};
