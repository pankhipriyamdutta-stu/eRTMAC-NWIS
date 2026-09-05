require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { initMQTT } = require('./mqtt/mqttBroker');
const { startDeviceMonitor } = require('./services/deviceService');
const { startHealthMonitor } = require('./services/systemHealthService');

const PORT = process.env.PORT || 5000;

// connectDB will be called in startServer

// Connect to MongoDB
connectDB();

const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Attach socket io to app so routes/controllers can use it if needed
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket.IO client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket.IO client disconnected: ${socket.id}`);
  });
});

// Initialize MQTT client
initMQTT(io);

// Start background monitors
startDeviceMonitor(io);
startHealthMonitor(io);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
