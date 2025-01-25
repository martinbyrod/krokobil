import express from 'express';
import cors from 'cors';
import pg from 'pg';
const { Pool } = pg;

const app = express();
const port = 3001;

app.use(cors());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rideshare',
  password: 'postgres',
  port: 5432,
});

// New endpoint for getting all activities
app.get('/api/all-activities', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM activities 
      ORDER BY day, time
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Existing endpoint for activity instances
app.get('/api/activities', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const result = await pool.query(`
      SELECT 
        ai.*,
        a.name,
        a.time,
        a.location
      FROM activity_instances ai
      JOIN activities a ON a.id = ai.activity_id
      WHERE ai.date BETWEEN $1 AND $2
      ORDER BY ai.date, a.time
    `, [start_date, end_date]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 