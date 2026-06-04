"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectDB() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri || mongoUri.includes('usuario:senha') || mongoUri === 'SEU_TOKEN_AQUI') {
        throw new Error('MongoDB URI has not been configured in the .env file.');
    }
    try {
        await mongoose_1.default.connect(mongoUri);
        console.log('Successfully connected to MongoDB Atlas.');
    }
    catch (error) {
        console.error('Error connecting to MongoDB Atlas:', error);
        throw error;
    }
}
