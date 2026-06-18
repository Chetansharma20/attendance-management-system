import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/attendance-management';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Users in DB:');
    console.log(users.map(u => ({ _id: u._id, name: u.name, email: u.email, role: u.role })));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
