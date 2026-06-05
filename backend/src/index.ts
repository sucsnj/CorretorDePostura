import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './services/db';
import { startUbidotsPolling, testUbidotsConnection } from './services/ubidots';
import authRoutes from './routes/auth';
import postureRoutes from './routes/posture';
import healthRoutes from './routes/health';

dotenv.config();

console.log("MONGO_URI:", process.env.MONGO_URI);

const app = express();
const server = http.createServer(app);

// Configure CORS to allow local development and Netlify frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) => allowed === origin);

    if (isAllowed || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

// Socket.io Server Setup
const io = new Server(server, {
  cors: corsOptions,
});

// Mounting Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posture', postureRoutes);

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`Client connected via WebSocket: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

async function startServer() {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Validate Ubidots connectivity
    console.log('Validating connection to Ubidots STEM API...');
    const ubidotsValid = await testUbidotsConnection();
    if (ubidotsValid) {
      console.log('Ubidots credentials and device endpoint validated successfully.');
    } else {
      console.warn('WARNING: Ubidots connection could not be established. Make sure UBIDOTS_TOKEN is correct.');
    }

    // 3. Start the background synchronization process
    startUbidotsPolling(io);

    // 4. Start HTTP & Socket server
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`Express and WebSocket server running on port ${port}`);
    });
  } catch (error) {
    console.error('Critical failure starting backend server:', error);
    process.exit(1);
  }
}

startServer();
