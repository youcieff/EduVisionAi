const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('DB Connected for Admin Seeding');
    
    // Check if admin exists
    let adminUser = await User.findOne({ email: 'admin@eduvision.ai' });
    
    if (adminUser) {
        console.log('Admin user already exists. Updating password to adminpassword123...');
        adminUser.password = 'adminpassword123';
        adminUser.role = 'admin'; // Ensure role is admin
        await adminUser.save();
    } else {
        console.log('Creating admin user...');
        adminUser = await User.create({
            firstName: 'Super',
            lastName: 'Admin',
            username: 'superadmin',
            email: 'admin@eduvision.ai',
            password: 'adminpassword123',
            role: 'admin',
            isVerified: true
        });
    }
    
    console.log('✅ Admin User Successfully Seeded/Updated!');
    console.log('Email: admin@eduvision.ai');
    console.log('Password: adminpassword123');
    process.exit();
  })
  .catch(err => {
    console.error('Seeding Error:', err);
    process.exit(1);
  });
