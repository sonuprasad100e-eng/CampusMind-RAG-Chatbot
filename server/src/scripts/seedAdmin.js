const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

const seedUsers = async () => {
  try {
    await connectDB();

    console.log('[Seed] Seeding Default Users...');

    // 1. Admin User
    const existingAdmin = await User.findOne({ email: 'admin@campusmind.edu' });
    if (!existingAdmin) {
      const admin = await User.create({
        name: 'Campus Administrator',
        email: 'admin@campusmind.edu',
        password: 'Admin@123456',
        role: 'admin',
      });
      console.log('âœ… Admin account created: admin@campusmind.edu / Admin@123456');
    } else {
      console.log('â„¹ï¸ Admin account already exists: admin@campusmind.edu');
    }

    // 2. Demo Student User
    const existingStudent = await User.findOne({ email: 'student@campusmind.edu' });
    if (!existingStudent) {
      const student = await User.create({
        name: 'Alex Johnson (Student)',
        email: 'student@campusmind.edu',
        password: 'Student@123456',
        role: 'student',
      });
      console.log('âœ… Student account created: student@campusmind.edu / Student@123456');
    } else {
      console.log('â„¹ï¸ Student account already exists: student@campusmind.edu');
    }

    console.log('[Seed] User Seeding Completed Successfully.');
  } catch (err) {
    console.error('[Seed] User seeding failed:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedUsers();
