import app from './app.js';
import { connectDB, closeDB } from './config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Graceful shutdown function
const gracefulShutdown = async (signal, server) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    await closeDB();
    console.log('✅ Database connection closed');
    
    // Close server if it exists
    if (server) {
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Start the server
const startServer = async () => {
  try {
    console.log('🔄 Starting Pixora Server...');
    
    // Connect to database
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Start HTTP server
    console.log('🚀 Starting HTTP server...');
    const server = app.listen(PORT, () => {
      console.log(`
🚀 Pixora Server is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
🔗 API Base: http://localhost:${PORT}/api
📁 Upload Endpoint: http://localhost:${PORT}/api/images/upload
      `);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', err);
      gracefulShutdown('UNHANDLED_REJECTION', server);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception thrown:', err);
      gracefulShutdown('UNCAUGHT_EXCEPTION', server);
    });

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
    process.on('SIGINT', () => gracefulShutdown('SIGINT', server));

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();