import { createServerAdapter } from '@vercel/node-server-adapter';
import express from 'express';
import cors from 'cors';
import { configureRoutes } from '../server/routes.js';

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

// Export the Express app as a serverless function
export default createServerAdapter(app); 