const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./backend/models/User');

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ 
            $or: [{ username: "youssefm" }, { fullName: "youssefm" }] 
        });
        console.log("Found youssefm:");
        console.log(user);
        
        const sa = await User.findOne({ username: "superadmin" });
        console.log("Found superadmin:");
        console.log(sa);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
};

checkUser();
