import express from 'express';
import cors from 'cors';
import { configureRoutes } from '../server/routes.js';

// Create Express app
const app = express();

app.use(cors());
app.use(express.json());

// Configure database for production or local development
const poolConfig = {
  connectionString: process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/rideshare',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

// Set up all routes
configureRoutes(app, poolConfig);

// Export a handler function for Vercel
export default function handler(req, res) {
  // NOTE: This is a simplified approach and may not handle all Express features
  return app(req, res);
} 