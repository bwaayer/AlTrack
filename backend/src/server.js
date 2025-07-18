const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tracker:tracker123@postgres:5432/food_tracker',
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true })); 


app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.30.96:3000'],
  credentials: true
}));


// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AlTrack API is running' });
});

// Get food suggestions
app.get('/api/food-suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    let result;

    if (query) {
      result = await pool.query(
        `SELECT DISTINCT name, is_suspicious 
         FROM food_items 
         WHERE LOWER(name) LIKE LOWER($1) 
         ORDER BY is_suspicious DESC, name ASC 
         LIMIT 10`,
        [`%${query}%`]
      );
    } else {
      result = await pool.query(
        `SELECT DISTINCT name, is_suspicious 
         FROM food_items 
         ORDER BY name ASC 
         LIMIT 20`
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching food suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch food suggestions' });
  }
});

// Get meals
app.get('/api/meals', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        m.id,
        m.date,
        m.meal_type,
        m.notes,
        m.created_at,
        CASE WHEN sm.meal_id IS NOT NULL THEN true ELSE false END as is_suspicious,
        sm.reason as suspicious_reason,
        json_agg(
          json_build_object(
            'name', fi.name,
            'quantity', mi.quantity,
            'notes', mi.notes,
            'is_suspicious', fi.is_suspicious
          ) ORDER BY mi.id
        ) as items
      FROM meals m
      LEFT JOIN meal_items mi ON m.id = mi.meal_id
      LEFT JOIN food_items fi ON mi.food_item_id = fi.id
      LEFT JOIN suspicious_meals sm ON m.id = sm.meal_id
    `;

    let params = [];

    if (startDate && endDate) {
      query += ' WHERE m.date BETWEEN $1 AND $2';
      params = [startDate, endDate];
    } else if (startDate) {
      query += ' WHERE m.date >= $1';
      params = [startDate];
    } else if (endDate) {
      query += ' WHERE m.date <= $1';
      params = [endDate];
    }

    query += ' GROUP BY m.id, m.date, m.meal_type, m.notes, m.created_at, sm.meal_id, sm.reason ORDER BY m.date DESC, m.created_at DESC';

    console.log('Getting meals:', { startDate, endDate });

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting meals:', error);
    res.status(500).json({ error: 'Failed to get meals' });
  }
});


// Add meal
app.post('/api/meals', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { date, meal_type, items, notes } = req.body;

    // Add debugging to see what we're receiving
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    console.log('Extracted values:', { date, meal_type, items: items?.length, notes });

    // Validate required fields
    if (!date) {
      throw new Error('Date is required');
    }
    if (!meal_type) {
      throw new Error('Meal type is required');
    }
    if (!items || items.length === 0) {
      throw new Error('At least one food item is required');
    }

    // Insert meal
    const mealResult = await client.query(
      'INSERT INTO meals (date, meal_type, notes) VALUES ($1, $2, $3) RETURNING id',
      [date, meal_type, notes || null]
    );

    const mealId = mealResult.rows[0].id;
    console.log('Meal inserted with ID:', mealId);

    // Insert food items and meal items
    for (const item of items) {
      if (!item.name || !item.name.trim()) {
        continue; // Skip empty items
      }

      // Insert or get food item
      const foodResult = await client.query(
        'INSERT INTO food_items (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [item.name.trim()]
      );

      const foodItemId = foodResult.rows[0].id;

      // Insert meal item
      await client.query(
        'INSERT INTO meal_items (meal_id, food_item_id, quantity, notes) VALUES ($1, $2, $3, $4)',
        [mealId, foodItemId, item.quantity || null, item.notes || null]
      );
    }

    await client.query('COMMIT');
    console.log('Meal added successfully');
    res.json({ id: mealId, message: 'Meal added successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding meal:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to add meal', 
      details: error.message 
    });
  } finally {
    client.release();
  }
});


// Mark meal as suspicious
app.post('/api/meals/:id/suspicious', async (req, res) => {
  const client = await pool.connect();

  try {
    const mealId = parseInt(req.params.id);
    const { reason } = req.body;

    console.log('Marking meal as suspicious:', { mealId, reason });

    // Validate meal exists
    const mealCheck = await client.query('SELECT id FROM meals WHERE id = $1', [mealId]);
    if (mealCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    await client.query('BEGIN');

    // Insert or update suspicious meal record (use marked_at instead of created_at)
    await client.query(
      `INSERT INTO suspicious_meals (meal_id, reason) 
       VALUES ($1, $2) 
       ON CONFLICT (meal_id) DO UPDATE SET 
         reason = EXCLUDED.reason,
         marked_at = CURRENT_TIMESTAMP`,
      [mealId, reason || 'Marked as suspicious']
    );

    // Update all food items from this meal to be suspicious
    await client.query(
      `UPDATE food_items 
       SET is_suspicious = true 
       WHERE id IN (
         SELECT food_item_id 
         FROM meal_items 
         WHERE meal_id = $1
       )`,
      [mealId]
    );

    await client.query('COMMIT');

    console.log('Meal marked as suspicious successfully');
    res.json({ message: 'Meal marked as suspicious successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error marking meal as suspicious:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to mark meal as suspicious', 
      details: error.message 
    });
  } finally {
    client.release();
  }
});





// Get hand conditions
app.get('/api/hand-conditions', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        id,
        date,
        time_of_day,
        condition_rating,
        notes,
        created_at,
        (date || 'T' || time_of_day) as datetime
      FROM hand_conditions
    `;
    let params = [];

    if (startDate && endDate) {
      query += ' WHERE date BETWEEN $1 AND $2';
      params = [startDate, endDate];
    } else if (startDate) {
      query += ' WHERE date >= $1';
      params = [startDate];
    } else if (endDate) {
      query += ' WHERE date <= $1';
      params = [endDate];
    }

    query += ' ORDER BY date DESC, time_of_day DESC';

    console.log('Getting hand conditions:', { startDate, endDate });

    const result = await pool.query(query, params);

    // Transform the results to match frontend expectations
    const transformedResults = result.rows.map(row => ({
      id: row.id,
      datetime: row.datetime,
      condition_rating: row.condition_rating,
      notes: row.notes,
      created_at: row.created_at
    }));

    res.json(transformedResults);
  } catch (error) {
    console.error('Error getting hand conditions:', error);
    res.status(500).json({ error: 'Failed to get hand conditions' });
  }
});


// Add hand condition
app.post('/api/hand-conditions', async (req, res) => {
  try {
    const { datetime, condition_rating, notes } = req.body;

    console.log('Adding hand condition:', { datetime, condition_rating, notes });

    // Validate required fields
    if (!datetime) {
      throw new Error('Datetime is required');
    }
    if (!condition_rating || condition_rating < 1 || condition_rating > 10) {
      throw new Error('Condition rating must be between 1 and 10');
    }

    // Split datetime into date and time components
    const datetimeObj = new Date(datetime);
    const date = datetimeObj.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = datetimeObj.toTimeString().split(' ')[0]; // HH:MM:SS

    console.log('Split datetime:', { date, time });

    const result = await pool.query(
      'INSERT INTO hand_conditions (date, time_of_day, condition_rating, notes) VALUES ($1, $2, $3, $4) RETURNING id',
      [date, time, condition_rating, notes || null]
    );

    console.log('Hand condition added with ID:', result.rows[0].id);
    res.json({ id: result.rows[0].id, message: 'Hand condition recorded successfully' });
  } catch (error) {
    console.error('Error adding hand condition:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to record hand condition', 
      details: error.message 
    });
  }
});



// Unmark meal as suspicious
app.delete('/api/meals/:id/suspicious', async (req, res) => {
  const client = await pool.connect();

  try {
    const mealId = parseInt(req.params.id);

    console.log('Unmarking meal as suspicious:', { mealId });

    // Validate meal exists
    const mealCheck = await client.query('SELECT id FROM meals WHERE id = $1', [mealId]);
    if (mealCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    await client.query('BEGIN');

    // Remove from suspicious_meals table
    const deleteResult = await client.query(
      'DELETE FROM suspicious_meals WHERE meal_id = $1',
      [mealId]
    );

    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Meal was not marked as suspicious' });
    }

    // Update food items to not be suspicious (only if they're not suspicious from other meals)
    await client.query(
      `UPDATE food_items 
       SET is_suspicious = false 
       WHERE id IN (
         SELECT food_item_id 
         FROM meal_items 
         WHERE meal_id = $1
       )
       AND id NOT IN (
         SELECT DISTINCT mi.food_item_id 
         FROM meal_items mi 
         JOIN suspicious_meals sm ON mi.meal_id = sm.meal_id 
         WHERE mi.meal_id != $1
       )`,
      [mealId]
    );

    await client.query('COMMIT');

    console.log('Meal unmarked as suspicious successfully');
    res.json({ message: 'Meal unmarked as suspicious successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error unmarking meal as suspicious:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to unmark meal as suspicious', 
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Update suspicious meal reason
app.put('/api/meals/:id/suspicious', async (req, res) => {
  try {
    const mealId = parseInt(req.params.id);
    const { reason } = req.body;

    console.log('Updating suspicious meal reason:', { mealId, reason });

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    // Update the reason
    const result = await pool.query(
      'UPDATE suspicious_meals SET reason = $1, marked_at = CURRENT_TIMESTAMP WHERE meal_id = $2',
      [reason.trim(), mealId]
    );

    if (result.rowCount === 0) {
      console.log('No suspicious meal found for meal_id:', mealId);
      return res.status(404).json({ error: 'Suspicious meal not found' });
    }

    console.log('Suspicious meal reason updated successfully');
    res.json({ message: 'Suspicious meal reason updated successfully' });
  } catch (error) {
    console.error('Error updating suspicious meal reason:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to update suspicious meal reason', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});


app.listen(port, '0.0.0.0', () => {
  console.log(`AlTrack API server running on port ${port}`);
});


