// Run this script ONCE to reset inflated view counts
// Usage: cd backend && node reset-views.js
const mongoose = require('mongoose');
require('dotenv').config();

async function resetViews() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const result = await mongoose.connection.db.collection('videos').updateMany(
      {},
      { $set: { views: 0 } }
    );
    
    console.log(`✅ Reset views for ${result.modifiedCount} videos`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetViews();
