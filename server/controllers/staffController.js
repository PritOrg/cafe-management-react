const Staff = require('../models/staffAndAdmin');

// Basic Staff CRUD
exports.getAllStaff = async (req, res) => {
  const staff = await Staff.find();
  res.json(staff);
};

exports.addStaff = async (req, res) => {
  const newStaff = new Staff(req.body);
  await newStaff.save();
  res.status(201).json(newStaff);
};

exports.updateStaff = async (req, res) => {
  const updated = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

exports.removeStaff = async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  res.status(204).send();
};