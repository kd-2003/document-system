const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import routes
const documentRoutes = require('./routes/documents');

// Import services
const { initializeQueueService, initializeQueue, setSocketServer } = require('./services/queueService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/documents', documentRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);
setSocketServer(io);


async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kumarkuldeep56000_db_user:Gxdf0lQTEsVwcJSW@cluster0.wweiy73.mongodb.net/document-system');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.log('MongoDB connection failed, continuing without database:', error.message);
  }
}

connectToDatabase();

// Initialize queue system
initializeQueueService()
  .then(() => initializeQueue())
  .catch((error) => {
    console.warn('Queue service initialization failed:', error.message);
    initializeQueue();
  });

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };