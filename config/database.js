import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection instance
let db = null;
let client = null;

// Database connection function
export const connectDB = async () => {
  try {
    if (db) {
      console.log('Database already connected');
      return db;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ramziDev:5ePfd3DH7CLRlZ6w@cluster0.rmb5otr.mongodb.net/pixora';
    
    client = new MongoClient(mongoUri);

    await client.connect();
    db = client.db('pixora');
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📍 Database: ${db.databaseName}`);
    console.log(`🔗 URI: ${mongoUri}`);
    
    return db;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

// Get database instance
export const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

// Close database connection
export const closeDB = async () => {
  try {
    if (client) {
      await client.close();
      db = null;
      client = null;
      console.log('🔌 Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

// Database utility functions
export const writeDB = async (collection, data) => {
  try {
    const database = getDB();
    const result = await database.collection(collection).insertOne(data);
    console.log(`📝 Document inserted in ${collection}:`, result.insertedId);
    return result;
  } catch (error) {
    console.error(`❌ Error writing to ${collection}:`, error);
    throw error;
  }
};

export const readDB = async (collection, query = {}) => {
  try {
    const database = getDB();
    const result = await database.collection(collection).find(query).toArray();
    return result;
  } catch (error) {
    console.error(`❌ Error reading from ${collection}:`, error);
    throw error;
  }
};

export const updateDB = async (collection, query, updateData) => {
  try {
    const database = getDB();
    const result = await database.collection(collection).updateOne(query, { $set: updateData });
    return result;
  } catch (error) {
    console.error(`❌ Error updating ${collection}:`, error);
    throw error;
  }
};

export const deleteDB = async (collection, query) => {
  try {
    const database = getDB();
    const result = await database.collection(collection).deleteOne(query);
    return result;
  } catch (error) {
    console.error(`❌ Error deleting from ${collection}:`, error);
    throw error;
  }
};

// Health check function
export const checkDBHealth = async () => {
  try {
    const database = getDB();
    await database.admin().ping();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

export default {
  connectDB,
  getDB,
  closeDB,
  writeDB,
  readDB,
  updateDB,
  deleteDB,
  checkDBHealth
};
