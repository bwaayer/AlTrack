// frontend/src/components/MealEntry.tsx
import React, { useState, useEffect } from 'react';
import { foodApi } from '../api';
import { FoodItem } from '../types';
import FoodSuggestions from './FoodSuggestions';

interface MealItemForm {
  name: string;
  quantity: string;
  notes: string;
}

const MealEntry: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [mealNotes, setMealNotes] = useState('');
  const [items, setItems] = useState<MealItemForm[]>([{ name: '', quantity: '', notes: '' }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addItem = () => {
    setItems([...items, { name: '', quantity: '', notes: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof MealItemForm, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const validItems = items.filter(item => item.name.trim() !== '');

      if (validItems.length === 0) {
        setMessage('Please add at least one food item');
        setLoading(false);
        return;
      }

      await foodApi.addMeal({
        date,
        meal_type: mealType,
        items: validItems,
        notes: mealNotes
      });

      setMessage('Meal added successfully!');
      setItems([{ name: '', quantity: '', notes: '' }]);
      setMealNotes('');
    } catch (error) {
      setMessage('Error adding meal. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meal-entry">
      <h2>Add Meal</h2>

      <form onSubmit={handleSubmit} className="meal-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="meal-type">Meal Type:</label>
            <select
              id="meal-type"
              value={mealType}
              onChange={(e) => setMealType(e.target.value as any)}
              required
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="meal-notes">Meal Notes:</label>
          <textarea
            id="meal-notes"
            value={mealNotes}
            onChange={(e) => setMealNotes(e.target.value)}
            placeholder="Any general notes about this meal..."
            rows={2}
          />
        </div>

        <div className="food-items">
          <h3>Food Items</h3>
          {items.map((item, index) => (
            <div key={index} className="food-item">
              <div className="food-item-row">
                <div className="form-group food-name">
                  <label>Food Name:</label>
                  <FoodSuggestions
                    value={item.name}
                    onChange={(value) => updateItem(index, 'name', value)}
                    placeholder="Start typing food name..."
                  />
                </div>

                <div className="form-group quantity">
                  <label>Quantity:</label>
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    placeholder="e.g., 1 cup, 2 slices"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="remove-item-btn"
                  disabled={items.length === 1}
                >
                  Remove
                </button>
              </div>

              <div className="form-group">
                <label>Item Notes:</label>
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => updateItem(index, 'notes', e.target.value)}
                  placeholder="Any notes about this specific item..."
                />
              </div>
            </div>
          ))}

          <button type="button" onClick={addItem} className="add-item-btn">
            Add Another Item
          </button>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Adding Meal...' : 'Add Meal'}
        </button>
      </form>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default MealEntry;
