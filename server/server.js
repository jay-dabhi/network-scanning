require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const scanRoutes = require('./routes/scanRoutes');
const toolRoutes = require('./routes/toolRoutes');
const logger = require('./utils/logger');

const app = express();

app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/scan', scanRoutes);
app.use('/api/tools', toolRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  logger.info(`Server running on http://${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS enabled for: ${config.server.corsOrigin}`);
  console.log(`\n🚀 Pentest Automation Server is running!`);
  console.log(`📡 API: http://${HOST}:${PORT}`);
  console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
  console.log(`\n⚠️  Remember to run with sudo for full Nmap functionality\n`);
});

module.exports = app;
