const User = require('../models/customer'); // or Customer model if separated
const uploadToFirebase = require('../utils/firebaseUpload'); // Assuming you have a utility for Firebase uploads
exports.getAllCustomers = async (req, res) => {
  const customers = await User.find();
  res.json(customers);
};

exports.getOwnProfile = async (req, res) => {
  const user = await User.findById(req.userId);
  res.json(user);
};

exports.updateOwnProfile = async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.userId, req.body, { new: true });
  res.json(updated);
};

exports.deleteOwnAccount = async (req, res) => {
  await User.findByIdAndDelete(req.userId);
  res.status(204).send();
};

exports.uploadProfilePhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const profilePhotoUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'profile-photos');

  const user = await User.findByIdAndUpdate(req.userId, {
    profilePhotoUrl: profilePhotoUrl
  }, { new: true });

  res.json(user);
};
