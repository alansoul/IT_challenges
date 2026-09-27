import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[+] Remote MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[-] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};