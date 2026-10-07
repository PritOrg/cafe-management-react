const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'served', 'cancelled'];

const PAYMENT_METHODS = ['cash', 'upi_manual', 'card_manual'];

const ORDER_STATUS_TRANSITIONS = {
    pending: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['served', 'cancelled'],
    served: [],
    cancelled: [],
};

module.exports = {
    ORDER_STATUSES,
    PAYMENT_METHODS,
    ORDER_STATUS_TRANSITIONS,
};
