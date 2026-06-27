import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http'; // Wrapper engine for real-time traffic
import { Server } from 'socket.io'; // Real-time socket protocol

// 1. CRITICAL: Load environment variables before anything else
dotenv.config();

// 2. CRITICAL: Import the database pool to trigger your connection test
import { pool } from './db.js'; 

// 3. Import your application routes (keeping your exact ESM .js extensions)
import authRoutes from './routes/authRoutes.js';
import appRoutes from './routes/appRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middleware
app.use(cors());
app.use(express.json());

// Main API Route Handlers (Your login and register are officially back!)
app.use('/api/auth', authRoutes);
app.use('/api/app', appRoutes);

// Quick base route for browser health checks
app.get('/', (req, res) => {
  res.send('Cross-Pollination API is alive and running! 🚀');
});

// ==========================================
// ⚡️ NEW: SOCKET.IO MULTI-PROTOCOL WRAPPER
// ==========================================

// 4. Create an HTTP server instance using your configured Express app
const httpServer = createServer(app);

// 5. Attach Socket.io to the server instance with CORS clearance
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allows your React frontend to bridge cleanly
    methods: ['GET', 'POST']
  }
});

// 1. Redefine the memory pool structure to accept profile data objects
let waitingPool: { socketId: string; userProfile: any }[] = [];

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // 2. Accept profile payload packages from the frontend
  socket.on('join_pool', ({ userProfile }) => {
    // Check if already in the pool
    if (!waitingPool.some(p => p.socketId === socket.id)) {
      waitingPool.push({ 
        socketId: socket.id, 
        userProfile: userProfile || { name: 'Anonymous Stranger', bio: 'Exploring the matrix...' } 
      });
      console.log(`👤 ${userProfile?.name || socket.id} entered the pool. Size: ${waitingPool.length}`);
    }

    // Matchmaking Check
    if (waitingPool.length >= 2) {
      const peer1 = waitingPool.shift()!;
      const peer2 = waitingPool.shift()!;
      const uniqueRoomId = `room_${peer1.socketId}_${peer2.socketId}`;

      const socket1 = io.sockets.sockets.get(peer1.socketId);
      const socket2 = io.sockets.sockets.get(peer2.socketId);

      if (socket1 && socket2) {
        socket1.join(uniqueRoomId);
        socket2.join(uniqueRoomId);

        // 3. CRITICAL: Send Peer 2's data to Peer 1, and Peer 1's data to Peer 2!
        socket1.emit('matched', { roomId: uniqueRoomId, peer: peer2.userProfile });
        socket2.emit('matched', { roomId: uniqueRoomId, peer: peer1.userProfile });

        console.log(`🔗 Match Established between ${peer1.userProfile.name} and ${peer2.userProfile.name}`);
      }
    }
  });

  // Relay chat text message transmissions (Keep this exactly how it was)
  socket.on('send_message', ({ roomId, message, senderName }) => {
    socket.to(roomId).emit('receive_message', { message, senderName });
  });

  socket.on('disconnect', () => {
    waitingPool = waitingPool.filter(p => p.socketId !== socket.id);
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ==========================================
// 🔥 FIXED: THE MISSING ENGINE START TRIGGER
// ==========================================
httpServer.listen(PORT, () => {
  console.log(`🚀 [server]: Backend engine actively listening at http://localhost:${PORT}`);
});