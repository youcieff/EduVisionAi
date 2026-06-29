const mongoose = require('mongoose');
const fs = require('fs');

// Direct URI with encoded password to avoid parse errors
const MONGODB_URI = 'mongodb+srv://youssedmaged0_db_user:Laila%408704@eduvisionai.sftnrbr.mongodb.net/eduvisionai?retryWrites=true&w=majority&appName=EduVisionAi';

const VideoSchema = new mongoose.Schema({}, { strict: false });
const Video = mongoose.model('Video', VideoSchema);

async function dump() {
  console.log('Connecting to MongoDB:');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  // Fetch up to 10 latest videos from DB
  const videos = await Video.find().sort({ createdAt: -1 }).limit(10).lean();
  console.log(`Fetched ${videos.length} videos.`);

  fs.writeFileSync('c:\\Users\\Youssef\\OneDrive\\Desktop\\EduVisionAI\\frontend\\src\\api\\dumped_videos.json', JSON.stringify(videos, null, 2));
  console.log('Dump completed! Saved to backend/uploads or API folder.');
  await mongoose.disconnect();
}

dump().catch(err => {
  console.error('Error connecting/dumping:', err);
  process.exit(1);
});
