// frontend/src/components/History.tsx
import React, { useState, useEffect } from 'react';
import { foodApi } from '../api';
import { Meal, HandCondition } from '../types';
import { format } from 'date-fns';

const History: React.FC = () => {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [handConditions, setHandConditions] = useState<HandCondition[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'meals' | 'conditions'>('meals');

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mealsData, conditionsData] = await Promise.all([
        foodApi.getMeals(startDate, endDate),
        foodApi.getHandConditions(startDate, endDate)
      ]);
      setMeals(mealsData);
      setHandConditions(conditionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMealSuspicious = async (mealId: number) => {
    const reason = prompt('Why is this meal suspicious?');
    if (reason) {
      try {
        await foodApi.markMealSuspicious(mealId, reason);
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error marking meal as suspicious:', error);
      }
    }
  };

  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="history">
      <h2>History</h2>

      <div className="date-filters">
        <div className="form-group">
          <label htmlFor="start-date">From:</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="end-date">To:</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'meals' ? 'active' : ''}`}
          onClick={() => setActiveTab('meals')}
        >
          Meals ({meals.length})
        </button>
        <button
          className={`tab ${activeTab === 'conditions' ? 'active' : ''}`}
          onClick={() => setActiveTab('conditions')}
        >
          Hand Conditions ({handConditions.length})
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {activeTab === 'meals' && (
        <div className="meals-history">
          {meals.length === 0 && !loading && (
            <p>No meals found for the selected date range.</p>
          )}

          {meals.map((meal) => (
            <div key={meal.id} className={`meal-card ${meal.is_marked_suspicious ? 'suspicious-meal' : ''}`}>
              <div className="meal-header">
                <h3>{formatMealType(meal.meal_type)} - {format(new Date(meal.date), 'MMM dd, yyyy')}</h3>
                {!meal.is_marked_suspicious && (
                  <button
                    onClick={() => markMealSuspicious(meal.id)}
                    className="mark-suspicious-btn"
                  >
                    Mark Suspicious
                  </button>
                )}
                {meal.is_marked_suspicious && (
                  <span className="suspicious-badge">⚠️ Suspicious</span>
                )}
              </div>

              <div className="meal-items">
                {meal.items.map((item, index) => (
                  <div key={index} className={`meal-item ${item.is_suspicious ? 'suspicious-item' : ''}`}>
                    <span className="item-name">{item.name}</span>
                    {item.quantity && <span className="item-quantity">({item.quantity})</span>}
                    {item.is_suspicious && <span className="suspicious-indicator">⚠️</span>}
                    {item.notes && <div className="item-notes">{item.notes}</div>}
                  </div>
                ))}
              </div>

              {meal.notes && (
                <div className="meal-notes">
                  <strong>Notes:</strong> {meal.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'conditions' && (
        <div className="conditions-history">
          {handConditions.length === 0 && !loading && (
            <p>No hand conditions recorded for the selected date range.</p>
          )}

          {handConditions.map((condition) => (
            <div key={condition.id} className="condition-card">
              <div className="condition-header">
                <h3>{format(new Date(condition.date), 'MMM dd, yyyy')} at {condition.time_of_day}</h3>
                <div className={`rating-badge rating-${condition.condition_rating}`}>
                  {condition.condition_rating}/10
                </div>
              </div>

              {condition.notes && (
                <div className="condition-notes">
                  {condition.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
