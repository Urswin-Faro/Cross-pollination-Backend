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

// ✅ FIXED: Explicitly typed structure to satisfy the TypeScript compiler
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
      // Added explicit non-null assertion (!) so TS knows these won't be undefined
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

  // 🔥 FIXED PATH: Prevent ghost matches by clearing users who manually cancel their search
  socket.on('leave_pool', () => {
    waitingPool = waitingPool.filter(p => p.socketId !== socket.id);
    console.log(`👤 User manually backed out of matchmaking pool: ${socket.id}. Size: ${waitingPool.length}`);
  });

  // Relay chat text message transmissions (Keep this exactly how it was)
  socket.on('send_message', ({ roomId, message, senderName }) => {
    socket.to(roomId).emit('receive_message', { message, senderName });
  });

  // ==========================================
  // 🎥 FIXED: WEBRTC SIGNALLING ROUTE RELAYS
  // ==========================================

  // 1. Pass SDP WebRTC Offers to the target peer
  socket.on('video_offer', ({ roomId, sdp }) => {
    socket.to(roomId).emit('video_offer', { sdp });
  });

  // 2. Pass SDP WebRTC Answers back to the caller
  socket.on('video_answer', ({ roomId, sdp }) => {
    socket.to(roomId).emit('video_answer', { sdp });
  });

  // 3. Pass NAT/Firewall hole-punching candidates between both peers
  socket.on('ice_candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice_candidate', { candidate });
  });

  socket.on('disconnect', () => {
    waitingPool = waitingPool.filter(p => p.socketId !== socket.id);
    console.log(`❌ User disconnected: ${socket.id}. Size: ${waitingPool.length}`);
  });
});

// ==========================================
// 🔥 FIXED: THE MISSING ENGINE START TRIGGER
// ==========================================
httpServer.listen(PORT, () => {
  console.log(`🚀 [server]: Backend engine actively listening at http://localhost:${PORT}`);
});