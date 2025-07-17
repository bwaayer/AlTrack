// backend/src/server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(express.json());

// API Routes

// Get food suggestions with suspicious marking
app.get('/api/food-suggestions', async (req, res) => {
  const { query } = req.query;
  try {
    const result = await pool.query(
      'SELECT id, name, is_suspicious FROM food_items WHERE name ILIKE $1 ORDER BY name LIMIT 10',
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new meal
app.post('/api/meals', async (req, res) => {
  const { date, meal_type, items, notes } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert meal
    const mealResult = await client.query(
      'INSERT INTO meals (date, meal_type, notes) VALUES ($1, $2, $3) RETURNING id',
      [date, meal_type, notes]
    );
    const mealId = mealResult.rows[0].id;

    // Insert food items and meal_items
    for (const item of items) {
      // Insert or get food item
      const foodResult = await client.query(
        'INSERT INTO food_items (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [item.name]
      );
      const foodId = foodResult.rows[0].id;

      // Insert meal item
      await client.query(
        'INSERT INTO meal_items (meal_id, food_item_id, quantity, notes) VALUES ($1, $2, $3, $4)',
        [mealId, foodId, item.quantity, item.notes]
      );
    }

    await client.query('COMMIT');
    res.json({ id: mealId, message: 'Meal added successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get meals for a date range
app.get('/api/meals', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const result = await pool.query(`
      SELECT 
        m.id, m.date, m.meal_type, m.notes as meal_notes,
        json_agg(
          json_build_object(
            'name', fi.name,
            'quantity', mi.quantity,
            'notes', mi.notes,
            'is_suspicious', fi.is_suspicious
          )
        ) as items,
        EXISTS(SELECT 1 FROM suspicious_meals sm WHERE sm.meal_id = m.id) as is_marked_suspicious
      FROM meals m
      LEFT JOIN meal_items mi ON m.id = mi.meal_id
      LEFT JOIN food_items fi ON mi.food_item_id = fi.id
      WHERE m.date BETWEEN $1 AND $2
      GROUP BY m.id, m.date, m.meal_type, m.notes
      ORDER BY m.date DESC, m.meal_type
    `, [start_date, end_date]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark meal as suspicious
app.post('/api/meals/:id/suspicious', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    await pool.query(
      'INSERT INTO suspicious_meals (meal_id, reason) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, reason]
    );

    // Mark all food items in this meal as suspicious
    await pool.query(`
      UPDATE food_items 
      SET is_suspicious = true 
      WHERE id IN (
        SELECT food_item_id FROM meal_items WHERE meal_id = $1
      )
    `, [id]);

    res.json({ message: 'Meal marked as suspicious' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add hand condition
app.post('/api/hand-conditions', async (req, res) => {
  const { date, time_of_day, condition_rating, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO hand_conditions (date, time_of_day, condition_rating, notes) VALUES ($1, $2, $3, $4) RETURNING id',
      [date, time_of_day, condition_rating, notes]
    );
    res.json({ id: result.rows[0].id, message: 'Hand condition recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get hand conditions
app.get('/api/hand-conditions', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM hand_conditions WHERE date BETWEEN $1 AND $2 ORDER BY date DESC, time_of_day DESC',
      [start_date, end_date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// backend/src/server.js - Enhanced statistics endpoint
app.get('/api/statistics', async (req, res) => {
    try {
      const stats = await Promise.all([
        // Basic counts
        pool.query('SELECT COUNT(*) as total_meals FROM meals'),
        pool.query('SELECT COUNT(*) as suspicious_foods FROM food_items WHERE is_suspicious = true'),
        pool.query('SELECT COUNT(*) as suspicious_meals FROM suspicious_meals'),
  
        // Hand condition averages
        pool.query('SELECT AVG(condition_rating) as avg_condition FROM hand_conditions WHERE date >= CURRENT_DATE - INTERVAL \'7 days\''),
        pool.query('SELECT AVG(condition_rating) as avg_condition_30d FROM hand_conditions WHERE date >= CURRENT_DATE - INTERVAL \'30 days\''),
  
        // Top suspicious foods
        pool.query(`
          SELECT fi.name, COUNT(*) as frequency 
          FROM meal_items mi 
          JOIN food_items fi ON mi.food_item_id = fi.id 
          WHERE fi.is_suspicious = true 
          GROUP BY fi.name 
          ORDER BY frequency DESC 
          LIMIT 10
        `),
  
        // Recent trends
        pool.query(`
          SELECT 
            DATE(date) as date,
            AVG(condition_rating) as avg_rating
          FROM hand_conditions 
          WHERE date >= CURRENT_DATE - INTERVAL '14 days'
          GROUP BY DATE(date)
          ORDER BY date DESC
        `),
  
        // Meal type distribution
        pool.query(`
          SELECT 
            meal_type,
            COUNT(*) as count,
            COUNT(CASE WHEN EXISTS(SELECT 1 FROM suspicious_meals sm WHERE sm.meal_id = m.id) THEN 1 END) as suspicious_count
          FROM meals m
          GROUP BY meal_type
        `),
  
        // Weekly summary
        pool.query(`
          SELECT 
            DATE_TRUNC('week', date) as week,
            COUNT(*) as meals_count,
            COUNT(CASE WHEN EXISTS(SELECT 1 FROM suspicious_meals sm WHERE sm.meal_id = m.id) THEN 1 END) as suspicious_count
          FROM meals m
          WHERE date >= CURRENT_DATE - INTERVAL '4 weeks'
          GROUP BY DATE_TRUNC('week', date)
          ORDER BY week DESC
        `)
      ]);
  
      res.json({
        // Basic stats
        totalMeals: parseInt(stats[0].rows[0].total_meals),
        suspiciousFoods: parseInt(stats[1].rows[0].suspicious_foods),
        suspiciousMeals: parseInt(stats[2].rows[0].suspicious_meals),
  
        // Condition averages
        avgConditionLast7Days: parseFloat(stats[3].rows[0].avg_condition) || 0,
        avgConditionLast30Days: parseFloat(stats[4].rows[0].avg_condition_30d) || 0,
  
        // Lists and trends
        topSuspiciousFoods: stats[5].rows,
        conditionTrend: stats[6].rows,
        mealTypeDistribution: stats[7].rows,
        weeklyTrends: stats[8].rows
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
