import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50, // Re-uses 50 persistent connections for all 700 users
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[+] Remote MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[-] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};