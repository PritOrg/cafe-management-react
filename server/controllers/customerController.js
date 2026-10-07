const { sendResponse } = require('../middleware/auth');
const customerRepo = require('../repositories/customerRepo');
const activityRepo = require('../repositories/activityRepo');

exports.getAllCustomers = async (req, res) => {
  try {
    const { search, membership, page, limit, sort } = req.query;
    const data = await customerRepo.list(req.tenantId, { search, membership, page, limit, sort });
    return sendResponse(res, 200, true, 'Customers retrieved', data);
  } catch (err) {
    console.error('Error fetching customers:', err);
    return sendResponse(res, 500, false, 'Server error');
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await customerRepo.findById(req.tenantId, req.params.id);
    if (!customer || customer.isActive === false) {
      return sendResponse(res, 404, false, 'Customer not found');
    }
    return sendResponse(res, 200, true, 'Customer retrieved', customer);
  } catch (err) {
    console.error('Error fetching customer:', err);
    return sendResponse(res, 500, false, 'Server error');
  }
};

exports.getCustomerOrders = async (req, res) => {
  try {
    const customer = await customerRepo.findById(req.tenantId, req.params.id);
    if (!customer) return sendResponse(res, 404, false, 'Customer not found');
    const orders = await customerRepo.findOrders(req.tenantId, req.params.id);
    return sendResponse(res, 200, true, 'Customer orders retrieved', orders);
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    return sendResponse(res, 500, false, 'Server error');
  }
};

exports.getCustomerSummary = async (req, res) => {
  try {
    const customer = await customerRepo.findById(req.tenantId, req.params.id);
    if (!customer) return sendResponse(res, 404, false, 'Customer not found');
    const summary = await customerRepo.summary(req.tenantId, req.params.id);
    return sendResponse(res, 200, true, 'Customer summary retrieved', summary);
  } catch (err) {
    console.error('Error fetching customer summary:', err);
    return sendResponse(res, 500, false, 'Server error');
  }
};

exports.removeCustomer = async (req, res) => {
  try {
    const customer = await customerRepo.softDelete(req.tenantId, req.params.id);
    if (!customer) return sendResponse(res, 404, false, 'Customer not found');
    await activityRepo.log({
      tenantId: req.tenantId,
      actorId: req.userId,
      actorType: req.role,
      action: 'customer.soft_delete',
      entity: 'customer',
      entityId: customer._id,
      meta: { email: customer.email },
    });
    return sendResponse(res, 200, true, 'Customer deactivated', { id: customer._id, isActive: false });
  } catch (err) {
    console.error('Error deactivating customer:', err);
    return sendResponse(res, 500, false, 'Server error');
  }
};
