import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve Static Frontend
const publicDir = path.join(__dirname, '../../public');
app.use(express.static(publicDir));

// API Routes
app.get('/api/v1/app-config', (req, res) => {
  res.json({
    ok: true,
    data: {
      appName: 'Hipa',
      version: '1.0.0',
      dailyFreeSwipes: 25,
      freeCallMinutesDaily: 30,
      maintenance: false
    }
  });
});

app.get('/api/v1/calls/ice-config', (req, res) => {
  res.json({
    ok: true,
    data: {
      ttl: 3600,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }
  });
});

// Socket.IO Real-Time Chat & WebRTC Call Signaling (PRD File 05)
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    io.emit('presence', { userId, online: true });
  });

  // Chat message
  socket.on('chat:send', (data) => {
    io.to(`user:${data.recipientId}`).emit('chat:new', data);
    socket.emit('chat:ack', { clientId: data.clientId, id: Date.now() });
  });

  // Call Signaling
  socket.on('call:invite', (data) => {
    io.to(`user:${data.recipientId}`).emit('call:incoming', {
      callId: Date.now(),
      callerId: data.callerId,
      callerName: data.callerName,
      type: data.type
    });
  });

  socket.on('call:accept', (data) => {
    io.to(`user:${data.callerId}`).emit('call:accepted', data);
  });

  socket.on('call:offer', (data) => {
    io.to(`user:${data.targetId}`).emit('call:offer', data);
  });

  socket.on('call:answer', (data) => {
    io.to(`user:${data.targetId}`).emit('call:answer', data);
  });

  socket.on('call:ice', (data) => {
    io.to(`user:${data.targetId}`).emit('call:ice', data);
  });

  socket.on('call:end', (data) => {
    io.to(`user:${data.targetId}`).emit('call:ended', data);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    res.sendFile(path.join(publicDir, 'admin/index.html'));
  } else {
    res.sendFile(path.join(publicDir, 'index.html'));
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Hipa Dating Server running on http://localhost:${PORT}`);
});
