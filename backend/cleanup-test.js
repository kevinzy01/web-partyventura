require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await Admin.deleteMany({ username: { $regex: '^test_admin' } });
  console.log(`Eliminados ${result.deletedCount} admins de prueba`);
  process.exit(0);
});
