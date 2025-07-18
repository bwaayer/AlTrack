import React, { useState, useEffect } from 'react';
import { foodApi } from '../api.ts';
import { FoodItem, MealItem } from '../types.ts';

const MealEntry: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('breakfast');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<MealItem[]>([{ name: '', quantity: '', notes: '' }]);
  const [foodSuggestions, setFoodSuggestions] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);

  // Load initial food suggestions
  useEffect(() => {
    loadFoodSuggestions();
  }, []);

  const loadFoodSuggestions = async (query?: string) => {
    try {
      const suggestions = await foodApi.getFoodSuggestions(query);
      setFoodSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading food suggestions:', error);
    }
  };

  const handleFoodInputChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].name = value;
    setItems(newItems);
    setActiveInputIndex(index);

    // Load suggestions based on input
    if (value.length > 0) {
      loadFoodSuggestions(value);
    } else {
      loadFoodSuggestions();
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].quantity = value;
    setItems(newItems);
  };

  const handleItemNotesChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].notes = value;
    setItems(newItems);
  };

  const selectFoodSuggestion = (index: number, food: FoodItem) => {
    const newItems = [...items];
    newItems[index].name = food.name;
    setItems(newItems);
    setActiveInputIndex(null);
    setFoodSuggestions([]);
  };

  const addFoodItem = () => {
    setItems([...items, { name: '', quantity: '', notes: '' }]);
  };

  const removeFoodItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate form
      if (items.some(item => !item.name.trim())) {
        throw new Error('Please fill in all food items');
      }

      // Filter out empty items
      const validItems = items.filter(item => item.name.trim());

      await foodApi.addMeal({
        date,
        meal_type: mealType,
        items: validItems,
        notes: notes.trim() || undefined
      });

      setMessage({ type: 'success', text: 'Meal added successfully!' });

      // Reset form
      setItems([{ name: '', quantity: '', notes: '' }]);
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);

    } catch (error) {
      console.error('Error adding meal:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to add meal' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getSuspiciousFood = (foodName: string): FoodItem | undefined => {
    return foodSuggestions.find(f => 
      f.name.toLowerCase() === foodName.toLowerCase() && f.is_suspicious
    );
  };

  return (
    <div className="meal-entry">
      <h2>Add Meal</h2>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="mealType">Meal Type</label>
          <select
            id="mealType"
            className="form-control"
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            required
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>

        <div className="form-group">
          <label>Food Items</label>
          {items.map((item, index) => {
            const suspiciousFood = getSuspiciousFood(item.name);
            return (
              <div key={index} className="food-item-row mb-2">
                <div className="d-flex gap-2 align-items-start">
                  <div className="food-input-container" style={{ position: 'relative', flex: '2' }}>
                    <input
                      type="text"
                      placeholder="Food name"
                      className={`form-control ${suspiciousFood ? 'suspicious-food' : ''}`}
                      value={item.name}
                      onChange={(e) => handleFoodInputChange(index, e.target.value)}
                      onFocus={() => setActiveInputIndex(index)}
                      onBlur={() => setTimeout(() => setActiveInputIndex(null), 200)}
                      required
                    />
                    {suspiciousFood && (
                      <span className="suspicious-indicator" title="Previously marked as suspicious">
                        ⚠️ Suspicious
                      </span>
                    )}

                    {/* Food suggestions dropdown */}
                    {activeInputIndex === index && foodSuggestions.length > 0 && (
                      <div className="suggestions-dropdown">
                        {foodSuggestions
                          .filter(food => 
                            food.name.toLowerCase().includes(item.name.toLowerCase())
                          )
                          .slice(0, 8)
                          .map((food, suggestionIndex) => (
                            <div
                              key={suggestionIndex}
                              className={`suggestion-item ${food.is_suspicious ? 'suspicious-suggestion' : ''}`}
                              onClick={() => selectFoodSuggestion(index, food)}
                            >
                              {food.name}
                              {food.is_suspicious && <span className="suspicious-indicator">⚠️</span>}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Quantity"
                    className="form-control"
                    style={{ flex: '1' }}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                  />

                  <input
                    type="text"
                    placeholder="Notes"
                    className="form-control"
                    style={{ flex: '1' }}
                    value={item.notes}
                    onChange={(e) => handleItemNotesChange(index, e.target.value)}
                  />

                  {items.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeFoodItem(index)}
                      style={{ minWidth: '40px' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            className="btn btn-secondary mt-2"
            onClick={addFoodItem}
          >
            + Add Food Item
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Meal Notes (Optional)</label>
          <textarea
            id="notes"
            className="form-control"
            rows={3}
            placeholder="Any additional notes about this meal..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Adding Meal...' : 'Add Meal'}
        </button>
      </form>
    </div>
  );
};

export default MealEntry;
