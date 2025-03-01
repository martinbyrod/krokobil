import express from 'express';
import cors from 'cors';
import { configureRoutes } from './routes.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Configure database for local development
const poolConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'rideshare',
  password: 'postgres',
  port: 5432,
};

// Set up all routes
const pool = configureRoutes(app, poolConfig);

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
    });
  });
}); 