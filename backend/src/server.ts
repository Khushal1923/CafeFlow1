import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Initialize Environment Variables
dotenv.config();

// Route Imports
import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurant';
import dishRoutes from './routes/dish';
import tableRoutes from './routes/table';
import orderRoutes from './routes/order';
import billRoutes from './routes/bill';
import analyticsRoutes from './routes/analytics';
import staffRoutes from './routes/staff';


const app = express();
const server = http.createServer(app);

// CORS configuration - support local next.js client and general origins
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets - generated bills & uploaded restaurant media
app.use('/bills', express.static(path.join(__dirname, '../public/bills')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Make Socket.io instance accessible in Express request object
app.set('io', io);

// Socket Events Setup
io.on('connection', (socket) => {
  console.log(`[Socket] New connection established: ${socket.id}`);

  // Room joining requests
  socket.on('join_restaurant', (restaurantId: string) => {
    if (restaurantId) {
      socket.join(restaurantId);
      console.log(`[Socket] Client ${socket.id} joined restaurant room: ${restaurantId}`);
    }
  });

  socket.on('join_order', (orderId: string) => {
    if (orderId) {
      socket.join(orderId);
      console.log(`[Socket] Client ${socket.id} joined order room: ${orderId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/staff', staffRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// DB Connection & Server Boot
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cafeflow';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[Database] MongoDB connection established successfully.');
    server.listen(PORT, () => {
      console.log(`[Server] CafeFlow backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('[Database] Connection failed:', error);
    process.exit(1);
  });
