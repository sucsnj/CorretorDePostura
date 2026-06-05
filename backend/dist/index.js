"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./services/db");
const ubidots_1 = require("./services/ubidots");
const auth_1 = __importDefault(require("./routes/auth"));
const posture_1 = __importDefault(require("./routes/posture"));
const health_1 = __importDefault(require("./routes/health"));
dotenv_1.default.config();
console.log("MONGO_URI:", process.env.MONGO_URI);
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Configure CORS to allow local development and Netlify frontend
const allowedOrigins = [
    process.env.FRONTEND_URL,
].filter(Boolean);
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin)
            return callback(null, true);
        const isAllowed = allowedOrigins.some((allowed) => allowed === origin);
        if (isAllowed || origin.startsWith('http://localhost')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Socket.io Server Setup
const io = new socket_io_1.Server(server, {
    cors: corsOptions,
});
// Mounting Routes
app.use('/health', health_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/posture', posture_1.default);
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
        await (0, db_1.connectDB)();
        // 2. Validate Ubidots connectivity
        console.log('Validating connection to Ubidots STEM API...');
        const ubidotsValid = await (0, ubidots_1.testUbidotsConnection)();
        if (ubidotsValid) {
            console.log('Ubidots credentials and device endpoint validated successfully.');
        }
        else {
            console.warn('WARNING: Ubidots connection could not be established. Make sure UBIDOTS_TOKEN is correct.');
        }
        // 3. Start the background synchronization process
        (0, ubidots_1.startUbidotsPolling)(io);
        // 4. Start HTTP & Socket server
        const port = process.env.PORT || 5000;
        server.listen(port, () => {
            console.log(`Express and WebSocket server running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Critical failure starting backend server:', error);
        process.exit(1);
    }
}
startServer();
