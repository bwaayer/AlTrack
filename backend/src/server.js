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
app.use(express.json());

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
        COALESCE(sm.id IS NOT NULL, false) as is_suspicious,
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

    const params = [];

    if (startDate && endDate) {
      query += ` WHERE m.date >= $1 AND m.date <= $2`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY m.id, m.date, m.meal_type, m.notes, sm.id, sm.reason ORDER BY m.date DESC, m.meal_type`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// Add meal
app.post('/api/meals', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { date, mealType, items, notes } = req.body;

    // Insert meal
    const mealResult = await client.query(
      'INSERT INTO meals (date, meal_type, notes) VALUES ($1, $2, $3) RETURNING id',
      [date, mealType, notes || null]
    );

    const mealId = mealResult.rows[0].id;

    // Insert food items and meal items
    for (const item of items) {
      // Insert or get food item
      const foodResult = await client.query(
        'INSERT INTO food_items (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [item.name]
      );

      const foodItemId = foodResult.rows[0].id;

      // Insert meal item
      await client.query(
        'INSERT INTO meal_items (meal_id, food_item_id, quantity, notes) VALUES ($1, $2, $3, $4)',
        [mealId, foodItemId, item.quantity || null, item.notes || null]
      );
    }

    await client.query('COMMIT');
    res.json({ id: mealId, message: 'Meal added successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding meal:', error);
    res.status(500).json({ error: 'Failed to add meal' });
  } finally {
    client.release();
  }
});

// Mark meal as suspicious
app.post('/api/meals/:id/suspicious', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await pool.query(
      'INSERT INTO suspicious_meals (meal_id, reason) VALUES ($1, $2) ON CONFLICT (meal_id) DO UPDATE SET reason = EXCLUDED.reason',
      [id, reason || 'Suspected allergic reaction']
    );

    // Mark associated food items as suspicious
    await pool.query(`
      UPDATE food_items 
      SET is_suspicious = true 
      WHERE id IN (
        SELECT food_item_id 
        FROM meal_items 
        WHERE meal_id = $1
      )
    `, [id]);

    res.json({ message: 'Meal marked as suspicious' });
  } catch (error) {
    console.error('Error marking meal as suspicious:', error);
    res.status(500).json({ error: 'Failed to mark meal as suspicious' });
  }
});

// Get hand conditions
app.get('/api/hand-conditions', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = 'SELECT * FROM hand_conditions';
    const params = [];

    if (startDate && endDate) {
      query += ' WHERE date >= $1 AND date <= $2';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC, time DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hand conditions:', error);
    res.status(500).json({ error: 'Failed to fetch hand conditions' });
  }
});

// Add hand condition
app.post('/api/hand-conditions', async (req, res) => {
  try {
    const { date, time, rating, notes } = req.body;

    const result = await pool.query(
      'INSERT INTO hand_conditions (date, time, rating, notes) VALUES ($1, $2, $3, $4) RETURNING id',
      [date, time, rating, notes || null]
    );

    res.json({ id: result.rows[0].id, message: 'Hand condition recorded successfully' });
  } catch (error) {
    console.error('Error adding hand condition:', error);
    res.status(500).json({ error: 'Failed to record hand condition' });
  }
});

// Get statistics
app.get('/api/statistics', async (req, res) => {
  try {
    // Total meals
    const totalMealsResult = await pool.query('SELECT COUNT(*) as count FROM meals');
    const totalMeals = parseInt(totalMealsResult.rows[0].count);

    // Suspicious meals
    const suspiciousMealsResult = await pool.query('SELECT COUNT(*) as count FROM suspicious_meals');
    const suspiciousMeals = parseInt(suspiciousMealsResult.rows[0].count);

    // Suspicious foods
    const suspiciousFoodsResult = await pool.query('SELECT COUNT(*) as count FROM food_items WHERE is_suspicious = true');
    const suspiciousFoods = parseInt(suspiciousFoodsResult.rows[0].count);

    // Average condition last 7 days
    const avgConditionResult = await pool.query(`
      SELECT AVG(rating) as avg_rating 
      FROM hand_conditions 
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    `);
    const avgConditionLast7Days = parseFloat(avgConditionResult.rows[0].avg_rating) || 0;

    // Top suspicious foods
    const topSuspiciousFoodsResult = await pool.query(`
      SELECT fi.name, COUNT(mi.id) as frequency
      FROM food_items fi
      JOIN meal_items mi ON fi.id = mi.food_item_id
      JOIN suspicious_meals sm ON mi.meal_id = sm.meal_id
      WHERE fi.is_suspicious = true
      GROUP BY fi.name
      ORDER BY frequency DESC
      LIMIT 10
    `);

    // Condition trend (last 14 days)
    const conditionTrendResult = await pool.query(`
      SELECT 
        date,
        AVG(rating) as avg_rating
      FROM hand_conditions
      WHERE date >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY date
      ORDER BY date ASC
    `);

    // Meal type distribution
    const mealTypeResult = await pool.query(`
      SELECT 
        m.meal_type,
        COUNT(m.id) as count,
        COUNT(sm.id) as suspicious_count
      FROM meals m
      LEFT JOIN suspicious_meals sm ON m.id = sm.meal_id
      GROUP BY m.meal_type
      ORDER BY count DESC
    `);

    // Weekly trends (last 4 weeks)
    const weeklyTrendsResult = await pool.query(`
      SELECT 
        DATE_TRUNC('week', m.date) as week,
        COUNT(m.id) as meals_count,
        COUNT(sm.id) as suspicious_count
      FROM meals m
      LEFT JOIN suspicious_meals sm ON m.id = sm.meal_id
      WHERE m.date >= CURRENT_DATE - INTERVAL '4 weeks'
      GROUP BY DATE_TRUNC('week', m.date)
      ORDER BY week ASC
    `);

    const statistics = {
      totalMeals,
      suspiciousMeals,
      suspiciousFoods,
      avgConditionLast7Days,
      topSuspiciousFoods: topSuspiciousFoodsResult.rows,
      conditionTrend: conditionTrendResult.rows,
      mealTypeDistribution: mealTypeResult.rows,
      weeklyTrends: weeklyTrendsResult.rows
    };

    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
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
