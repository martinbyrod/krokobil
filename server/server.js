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

// Update the driver assignments endpoint
app.get('/api/driver-assignments/:id', async (req, res) => {
  const activityInstanceId = req.params.id;
  console.log('Received assignment request:', activityInstanceId);
  
  //const client = await pool.connect();
  
  try {
    //await client.query('BEGIN');
    // Fetch the complete assignment data
    const result = await pool.query(`
      SELECT 
        da.id as assignment_id,
        d.id as driver_id,
        d.family_name,
        d.seat_capacity
      FROM driver_assignments da
      JOIN drivers d ON d.id = da.driver_id
      WHERE da.activity_instance_id = $1
    `, [activityInstanceId]);
    
    console.log('Final assignments:', result.rows);
    
    //await client.query('COMMIT');
    res.json(result.rows);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error assigning drivers:', err);
    res.status(500).json({ 
      error: err.message,
      details: {
        activityInstanceId,
        driverIds,
        errorCode: err.code
      }
    });
  } finally {
    //client.release();
  }
});

// Update the driver assignments endpoint
app.post('/api/driver-assignments', async (req, res) => {
  const { activityInstanceId, driverIds } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get existing assignments to compare
    const { rows: existingAssignments } = await client.query(`
      SELECT 
        da.id as assignment_id,
        da.driver_id,
        d.family_name,
        d.seat_capacity
      FROM driver_assignments da
      JOIN drivers d ON d.id = da.driver_id
      WHERE da.activity_instance_id = $1
    `, [activityInstanceId]);

    const existingDriverIds = existingAssignments.map(a => a.driver_id);
    const driversToRemove = existingDriverIds.filter(id => !driverIds.includes(id));
    const driversToAdd = driverIds.filter(id => !existingDriverIds.includes(id));

    // If nothing changed, just return existing assignments
    if (driversToRemove.length === 0 && driversToAdd.length === 0) {
      res.json(existingAssignments);
      await client.query('COMMIT');
      return;
    }

    // Delete kid assignments only for drivers being removed
    if (driversToRemove.length > 0) {
      await client.query(`
        DELETE FROM kid_assignments 
        WHERE driver_assignment_id IN (
          SELECT id FROM driver_assignments 
          WHERE activity_instance_id = $1 
          AND driver_id = ANY($2)
        )
      `, [activityInstanceId, driversToRemove]);

      // Remove driver assignments for removed drivers
      await client.query(`
        DELETE FROM driver_assignments 
        WHERE activity_instance_id = $1 
        AND driver_id = ANY($2)
      `, [activityInstanceId, driversToRemove]);
    }

    // Add new driver assignments
    for (const driverId of driversToAdd) {
      await client.query(
        'INSERT INTO driver_assignments (activity_instance_id, driver_id) VALUES ($1, $2)',
        [activityInstanceId, driverId]
      );
    }
    
    // Fetch and return the final state
    const { rows: finalAssignments } = await client.query(`
      SELECT 
        da.id as assignment_id,
        d.id as driver_id,
        d.family_name,
        d.seat_capacity
      FROM driver_assignments da
      JOIN drivers d ON d.id = da.driver_id
      WHERE da.activity_instance_id = $1
      ORDER BY d.family_name
    `, [activityInstanceId]);
    
    await client.query('COMMIT');
    res.json(finalAssignments);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error assigning drivers:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get kid assignments for an activity instance
app.get('/api/kid-assignments/:activityInstanceId', async (req, res) => {
  const { activityInstanceId } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        ka.id,
        ka.driver_assignment_id,
        k.id as kid_id,
        k.name
      FROM kid_assignments ka
      JOIN kids k ON k.id = ka.kid_id
      JOIN driver_assignments da ON da.id = ka.driver_assignment_id
      WHERE da.activity_instance_id = $1
    `, [activityInstanceId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching kid assignments:', err);
    res.status(500).json({ error: err.message });
  }
});

// Assign kids to drivers
app.post('/api/kid-assignments', async (req, res) => {
  const { assignments } = req.body; // array of { driver_assignment_id, kid_ids }
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete existing assignments for these driver assignments
    const driverAssignmentIds = assignments.map(a => a.driver_assignment_id);
    await client.query(
      'DELETE FROM kid_assignments WHERE driver_assignment_id = ANY($1)',
      [driverAssignmentIds]
    );
    
    // Insert new assignments
    for (const { driver_assignment_id, kid_ids } of assignments) {
      for (const kid_id of kid_ids) {
        await client.query(
          'INSERT INTO kid_assignments (driver_assignment_id, kid_id) VALUES ($1, $2)',
          [driver_assignment_id, kid_id]
        );
      }
    }
    
    // Fetch updated assignments
    const result = await client.query(`
      SELECT 
        ka.id,
        ka.driver_assignment_id,
        k.id as kid_id,
        k.name as kid_name
      FROM kid_assignments ka
      JOIN kids k ON k.id = ka.kid_id
      JOIN driver_assignments da ON da.id = ka.driver_assignment_id
      WHERE da.activity_instance_id = $1
    `, [assignments[0].activity_instance_id]);
    
    await client.query('COMMIT');
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error assigning kids:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 