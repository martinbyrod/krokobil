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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // First delete all kid assignments for this driver's assignments
    await client.query(`
      DELETE FROM kid_assignments
      WHERE driver_assignment_id IN (
        SELECT id FROM driver_assignments
        WHERE driver_id = $1
      )
    `, [req.params.id]);
    
    // Then delete all driver assignments for this driver
    await client.query(`
      DELETE FROM driver_assignments
      WHERE driver_id = $1
    `, [req.params.id]);
    
    // Finally delete the driver
    const result = await client.query('DELETE FROM drivers WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Driver not found' });
    } else {
      await client.query('COMMIT');
      res.json(result.rows[0]);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting driver:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete all kid assignments for this kid
    await client.query(`
      DELETE FROM kid_assignments
      WHERE kid_id = $1
    `, [req.params.id]);
    
    // Then delete the kid
    const result = await client.query('DELETE FROM kids WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Kid not found' });
    } else {
      await client.query('COMMIT');
      res.json(result.rows[0]);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting kid:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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
  const { name, day, time, location, is_recurring = true, targetDate = null } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // If it's a recurring activity, add it to the activities table
    let activityId = null;
    
    if (is_recurring) {
      console.log('Adding recurring activity:', { name, day, time, location });
      const result = await client.query(
        'INSERT INTO activities (name, day, time, location) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, day, time, location]
      );
      activityId = result.rows[0].id;
    } else {
      console.log('Adding one-time activity:', { name, day, time, location, targetDate });
      
      // For non-recurring, we'll create just one instance for the specified date
      let formattedDate;
      
      if (targetDate) {
        // Use the provided target date directly
        formattedDate = targetDate;
      } else {
        // Calculate the date for this instance based on the day of week
        const today = new Date();
        const currentDayOfWeek = (today.getDay() + 6) % 7 + 1; // Convert to 1-7 (Mon-Sun)
        
        // Calculate days to add to get to the specified day this week
        let daysToAdd = day - currentDayOfWeek;
        if (daysToAdd < 0) daysToAdd += 7; // If the day already passed this week, go to next week
        
        const calculatedDate = new Date(today);
        calculatedDate.setDate(today.getDate() + daysToAdd);
        formattedDate = calculatedDate.toISOString().split('T')[0];
      }
      
      // Insert the one-time instance with a temporary activity entry
      const tempActivity = await client.query(
        'INSERT INTO activities (name, day, time, location, is_one_time) VALUES ($1, $2, $3, $4, TRUE) RETURNING *',
        [name, day, time, location]
      );
      
      activityId = tempActivity.rows[0].id;
      
      // Create just one instance
      await client.query(`
        INSERT INTO activity_instances (activity_id, date, is_cancelled)
        VALUES ($1, $2, false)
      `, [activityId, formattedDate]);
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      id: activityId,
      name, 
      day, 
      time, 
      location, 
      is_recurring 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Delete an activity
app.delete('/api/activities/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // First check if this activity has any instances
    const { rows: instances } = await client.query(
      'SELECT id FROM activity_instances WHERE activity_id = $1',
      [req.params.id]
    );
    
    const instanceIds = instances.map(i => i.id);
    
    if (instanceIds.length > 0) {
      // Delete all kid assignments for drivers assigned to these activity instances
      await client.query(`
        DELETE FROM kid_assignments
        WHERE driver_assignment_id IN (
          SELECT id FROM driver_assignments
          WHERE activity_instance_id = ANY($1)
        )
      `, [instanceIds]);
      
      // Delete all driver assignments for these activity instances
      await client.query(`
        DELETE FROM driver_assignments
        WHERE activity_instance_id = ANY($1)
      `, [instanceIds]);
      
      // Delete all activity instances for this activity
      await client.query(
        'DELETE FROM activity_instances WHERE activity_id = $1',
        [req.params.id]
      );
    }
    
    // Finally delete the activity
    const result = await client.query(
      'DELETE FROM activities WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Activity not found' });
    } else {
      await client.query('COMMIT');
      res.json(result.rows[0]);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting activity:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get activity instances with activity details
app.get('/api/activity-instances', async (req, res) => {
  const { start_date, end_date } = req.query;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // First, ensure instances exist for the requested date range
    // Only auto-generate for recurring activities (is_one_time IS NULL OR is_one_time = FALSE)
    const activities = await client.query('SELECT * FROM activities WHERE is_one_time IS NULL OR is_one_time = FALSE');
    
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
          a.location,
          a.is_one_time
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

// Check kid assignments
app.get('/api/kids/:id/assignments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ka.* 
      FROM kid_assignments ka
      JOIN driver_assignments da ON da.id = ka.driver_assignment_id
      WHERE ka.kid_id = $1
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error checking kid assignments:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove kid assignments
app.delete('/api/kids/:id/assignments', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete all kid assignments for this kid
    const result = await client.query(`
      DELETE FROM kid_assignments
      WHERE kid_id = $1
      RETURNING *
    `, [req.params.id]);
    
    await client.query('COMMIT');
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error removing kid assignments:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Check driver assignments
app.get('/api/drivers/:id/assignments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT da.* 
      FROM driver_assignments da
      WHERE da.driver_id = $1
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error checking driver assignments:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove driver assignments
app.delete('/api/drivers/:id/assignments', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // First delete all kid assignments for this driver's assignments
    await client.query(`
      DELETE FROM kid_assignments
      WHERE driver_assignment_id IN (
        SELECT id FROM driver_assignments
        WHERE driver_id = $1
      )
    `, [req.params.id]);
    
    // Then delete all driver assignments for this driver
    const result = await client.query(`
      DELETE FROM driver_assignments
      WHERE driver_id = $1
    `, [req.params.id]);
    
    await client.query('COMMIT');
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error removing driver assignments:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Check activity assignments
app.get('/api/activities/:id/assignments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ai.* 
      FROM activity_instances ai
      WHERE ai.activity_id = $1
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error checking activity assignments:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove activity assignments
app.delete('/api/activities/:id/assignments', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get all activity instances for this activity
    const { rows: instances } = await client.query(`
      SELECT id FROM activity_instances
      WHERE activity_id = $1
    `, [req.params.id]);
    
    const instanceIds = instances.map(i => i.id);
    
    if (instanceIds.length > 0) {
      // Delete all kid assignments for drivers assigned to these activity instances
      await client.query(`
        DELETE FROM kid_assignments
        WHERE driver_assignment_id IN (
          SELECT id FROM driver_assignments
          WHERE activity_instance_id = ANY($1)
        )
      `, [instanceIds]);
      
      // Delete all driver assignments for these activity instances
      await client.query(`
        DELETE FROM driver_assignments
        WHERE activity_instance_id = ANY($1)
      `, [instanceIds]);
    }
    
    // Delete all activity instances for this activity
    const result = await client.query(`
      DELETE FROM activity_instances
      WHERE activity_id = $1
    `, [req.params.id]);
    
    await client.query('COMMIT');
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error removing activity assignments:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update a driver
app.put('/api/drivers/:id', async (req, res) => {
  const { family_name, seat_capacity } = req.body;
  try {
    const result = await pool.query(
      'UPDATE drivers SET family_name = $1, seat_capacity = $2 WHERE id = $3 RETURNING *',
      [family_name, seat_capacity, req.params.id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Driver not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Error updating driver:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a kid
app.put('/api/kids/:id', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE kids SET name = $1 WHERE id = $2 RETURNING *',
      [name, req.params.id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Kid not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Error updating kid:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update an activity
app.put('/api/activities/:id', async (req, res) => {
  const { name, day, time, location } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First, get the current activity to check if day is changing
    const { rows: currentActivity } = await client.query(
      'SELECT * FROM activities WHERE id = $1',
      [req.params.id]
    );
    
    if (currentActivity.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    const isDayChanging = parseInt(currentActivity[0].day) !== parseInt(day);
    console.log(`Activity day changing: ${isDayChanging}, from ${currentActivity[0].day} to ${day}`);
    
    // Update the activity
    const result = await client.query(
      'UPDATE activities SET name = $1, day = $2, time = $3, location = $4 WHERE id = $5 RETURNING *',
      [name, day, time, location, req.params.id]
    );
    
    // Only delete instances if the day is changing
    if (isDayChanging) {
      console.log(`Day changed from ${currentActivity[0].day} to ${day}, deleting instances`);
      
      // Get all activity instances for this activity
      const { rows: instances } = await client.query(
        'SELECT id FROM activity_instances WHERE activity_id = $1',
        [req.params.id]
      );
      
      const instanceIds = instances.map(i => i.id);
      
      if (instanceIds.length > 0) {
        // Delete all kid assignments for drivers assigned to these activity instances
        await client.query(`
          DELETE FROM kid_assignments
          WHERE driver_assignment_id IN (
            SELECT id FROM driver_assignments
            WHERE activity_instance_id = ANY($1)
          )
        `, [instanceIds]);
        
        // Delete all driver assignments for these activity instances
        await client.query(`
          DELETE FROM driver_assignments
          WHERE activity_instance_id = ANY($1)
        `, [instanceIds]);
      }
      
      // Delete all activity instances for this activity
      await client.query(
        'DELETE FROM activity_instances WHERE activity_id = $1',
        [req.params.id]
      );
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating activity:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Add this endpoint to force regenerate activity instances
app.post('/api/regenerate-activity-instances', async (req, res) => {
  const { start_date, end_date } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete all activity instances in the date range
    await client.query(`
      DELETE FROM activity_instances 
      WHERE date BETWEEN $1 AND $2
    `, [start_date, end_date]);
    
    // Regenerate activity instances
    await client.query(`
      INSERT INTO activity_instances (activity_id, date)
      SELECT 
        a.id,
        generate_series(
          $1::date, 
          $2::date, 
          '7 days'::interval
        )::date + (a.day - 1) AS date
      FROM activities a
      WHERE 
        generate_series(
          $1::date, 
          $2::date, 
          '7 days'::interval
        )::date + (a.day - 1) BETWEEN $1 AND $2
    `, [start_date, end_date]);
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error regenerating activity instances:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 