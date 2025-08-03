

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error('FATAL ERROR: MONGODB_URI is not defined in your .env file.');
      process.exit(1);
    }

    // A common error is having an unencoded '@' in the password.
    // This simple check helps developers debug a common connection issue.
    const parts = mongoURI.split('://');
    if (parts.length > 1) {
      const credentialsAndHost = parts[1];
      const credentialParts = credentialsAndHost.split('@');
      if (credentialParts.length > 2) { // More than one '@' means one is likely in the user/pass
        console.error('FATAL ERROR: Your MONGO_URI appears to have an unencoded "@" symbol in the username or password.');
        console.error('Please ensure special characters in your credentials are URL-encoded.');
        console.error('For example, "@" should be "%40".');
        process.exit(1);
      }
    }


    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;