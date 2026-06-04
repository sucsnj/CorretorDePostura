import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.includes('usuario:senha') || mongoUri === 'SEU_TOKEN_AQUI') {
    throw new Error('MongoDB URI has not been configured in the .env file.');
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB Atlas.');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    throw error;
  }
}
