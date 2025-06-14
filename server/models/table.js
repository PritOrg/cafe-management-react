const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
});

module.exports = mongoose.model('Table', TableSchema);
