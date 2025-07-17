-- database/init.sql
CREATE TABLE food_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL, -- breakfast, lunch, dinner, snack
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meal_items (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER REFERENCES meals(id) ON DELETE CASCADE,
    food_item_id INTEGER REFERENCES food_items(id),
    quantity VARCHAR(100),
    notes TEXT
);

CREATE TABLE hand_conditions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time_of_day TIME NOT NULL,
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 10),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suspicious_meals (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER REFERENCES meals(id) ON DELETE CASCADE,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- Indexes for better performance
CREATE INDEX idx_meals_date ON meals(date);
CREATE INDEX idx_hand_conditions_date ON hand_conditions(date);
CREATE INDEX idx_food_items_name ON food_items(name);
