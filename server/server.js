import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { startOfWeek, addDays, format, parseISO } from 'date-fns';
const { Pool } = pg;

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rideshare',
  password: 'postgres',
  port: 5432,
});

// Get all drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM drivers ORDER BY family_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new driver
app.post('/api/drivers', async (req, res) => {
  const { family_name, seat_capacity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO drivers (family_name, seat_capacity) VALUES ($1, $2) RETURNING *',
      [family_name, seat_capacity]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a driver
app.delete('/api/drivers/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM drivers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Driver not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all kids
app.get('/api/kids', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kids ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new kid
app.post('/api/kids', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO kids (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a kid
app.delete('/api/kids/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM kids WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Kid not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all activities
app.get('/api/activities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM activities ORDER BY day, time');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a new activity
app.post('/api/activities', async (req, res) => {
  const { name, day, time, location } = req.body;
  try {
    console.log('Adding activity:', { name, day, time, location }); // Debug log
    const result = await pool.query(
      'INSERT INTO activities (name, day, time, location) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, day, time, location]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete an activity
app.delete('/api/activities/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM activities WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Activity not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get activity instances with activity details
app.get('/api/activity-instances', async (req, res) => {
  const { start_date, end_date } = req.query;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First, ensure instances exist for the requested date range
    const activities = await client.query('SELECT * FROM activities');
    
    for (let date = parseISO(start_date); date <= parseISO(end_date); date = addDays(date, 1)) {
      const dayOfWeek = (date.getDay() + 6) % 7 + 1; // Convert to 1-7 (Mon-Sun)
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Find activities that should occur on this day
      const dayActivities = activities.rows.filter(activity => activity.day === dayOfWeek);
      
      for (const activity of dayActivities) {
        // Simple insert, the unique constraint will prevent duplicates
        await client.query(`
          INSERT INTO activity_instances (activity_id, date, is_cancelled)
          VALUES ($1, $2, false)
          ON CONFLICT (activity_id, date) DO NOTHING
        `, [activity.id, formattedDate]);
      }
    }
    
    // Then fetch all instances for the date range
    const result = await client.query(`
      SELECT 
        ai.id as instance_id,
        ai.date::date as date,
        ai.is_cancelled,
        a.id as activity_id,
        a.name,
        a.time,
        a.location
      FROM activity_instances ai
      JOIN activities a ON a.id = ai.activity_id
      WHERE ai.date BETWEEN $1 AND $2
      ORDER BY ai.date, a.time
    `, [start_date, end_date]);
    
    await client.query('COMMIT');
    res.json(result.rows);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Server Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 