const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');
const User = require('../models/User');

// Load env vars
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createAdmin = async () => {
  console.log('\n👑 EduVisionAI Admin Provisioning Tool 👑\n');
  
  await connectDB();

  try {
    const fullName = await question('Enter Admin Full Name: ');
    const username = await question('Enter Admin Username (unique): ');
    const email = await question('Enter Admin Email (unique): ');
    
    // Hide password input is tricky in basic readline, so we just prompt normally for this simple script
    const password = await question('Enter Admin Password (min 6 chars): ');

    if (!fullName || !username || !email || password.length < 6) {
      console.log('\n❌ Error: All fields are required and password must be at least 6 characters.');
      process.exit(1);
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('\n❌ Error: Username or Email already exists in the database.');
      process.exit(1);
    }

    const admin = await User.create({
      fullName,
      username,
      email,
      password,
      role: 'admin',
      points: 99999, // Give admin max points by default
      level: 99,
      unlockedSkills: ['core_student', 'crown_master'] // Give them the crown!
    });

    console.log('\n✅ Admin account created successfully!');
    console.log(`\nEmail: ${admin.email}`);
    console.log(`Role: ${admin.role}\n`);

  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
  } finally {
    rl.close();
    mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();
