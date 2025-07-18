import React, { useState, useEffect } from 'react';
import { foodApi } from '../api.ts';
import { Meal, HandCondition } from '../types.ts';

interface HistoryEntry {
  type: 'meal' | 'condition';
  datetime: string;
  data: Meal | HandCondition;
}

const History: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to last 7 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [handConditions, setHandConditions] = useState<HandCondition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'meals' | 'conditions'>('all');

  // Load data when component mounts or date range changes
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [mealsData, conditionsData] = await Promise.all([
        foodApi.getMeals(startDate, endDate),
        foodApi.getHandConditions(startDate, endDate)
      ]);

      setMeals(mealsData);
      setHandConditions(conditionsData);
    } catch (err) {
      console.error('Error fetching history data:', err);
      setError('Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  const markMealSuspicious = async (mealId: number) => {
    try {
      await foodApi.markMealSuspicious(mealId, 'Marked as suspicious from history');
      // Refresh data to show updated status
      fetchData();
    } catch (err) {
      console.error('Error marking meal as suspicious:', err);
      setError('Failed to mark meal as suspicious');
    }
  };

  // Combine and sort all entries by datetime
  const getCombinedHistory = (): HistoryEntry[] => {
    const entries: HistoryEntry[] = [];

    // Add meals
    if (filter === 'all' || filter === 'meals') {
      meals.forEach(meal => {
        entries.push({
          type: 'meal',
          datetime: meal.date, // Meals only have date, so we'll use start of day
          data: meal
        });
      });
    }

    // Add hand conditions
    if (filter === 'all' || filter === 'conditions') {
      handConditions.forEach(condition => {
        entries.push({
          type: 'condition',
          datetime: condition.datetime,
          data: condition
        });
      });
    }

    // Sort by datetime (newest first)
    return entries.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConditionColor = (rating: number): string => {
    if (rating <= 2) return '#f44336'; // Red
    if (rating <= 4) return '#ff9800'; // Orange
    if (rating <= 6) return '#ffc107'; // Yellow
    if (rating <= 8) return '#4caf50'; // Green
    return '#2196f3'; // Blue
  };

  const getConditionLabel = (rating: number): string => {
    const labels = {
      1: 'Very Bad', 2: 'Bad', 3: 'Poor', 4: 'Fair', 5: 'Normal',
      6: 'Good', 7: 'Very Good', 8: 'Excellent', 9: 'Outstanding', 10: 'Perfect'
    };
    return labels[rating as keyof typeof labels] || 'Unknown';
  };

  const renderMealEntry = (meal: Meal) => (
  <div className={`history-entry meal-entry ${meal.is_suspicious ? 'suspicious-meal' : ''}`}>
    <div className="entry-header">
      <div className="entry-type">
        <span className="meal-type-badge">{meal.meal_type}</span>
        <span className="entry-date">{formatDate(meal.date)}</span>
        {meal.is_suspicious && (
          <span className="suspicious-badge">⚠️ Suspicious</span>
        )}
      </div>
      <div className="entry-actions">
        {!meal.is_suspicious && (
          <button
            className="btn btn-sm btn-warning"
            onClick={() => meal.id && markMealSuspicious(meal.id)}
            disabled={!meal.id}
          >
            Mark Suspicious
          </button>
        )}
      </div>
    </div>

    <div className="meal-items">
      {meal.items && meal.items.map((item, index) => (
        <div key={index} className={`meal-item ${item.is_suspicious ? 'suspicious-item' : ''}`}>
          <span className="item-name">{item.name}</span>
          {item.quantity && <span className="item-quantity">({item.quantity})</span>}
          {item.notes && <span className="item-notes">- {item.notes}</span>}
          {item.is_suspicious && <span className="suspicious-indicator">⚠️</span>}
        </div>
      ))}
    </div>

    {meal.notes && (
      <div className="meal-notes">
        <strong>Notes:</strong> {meal.notes}
      </div>
    )}

    {meal.is_suspicious && meal.suspicious_reason && (
      <div className="suspicious-reason">
        <strong>Suspicious Reason:</strong> {meal.suspicious_reason}
      </div>
    )}
  </div>
);


  const renderConditionEntry = (condition: HandCondition) => (
    <div className="history-entry condition-entry">
      <div className="entry-header">
        <div className="entry-type">
          <span className="condition-type-badge">Hand Condition</span>
          <span className="entry-date">{formatDate(condition.datetime)}</span>
          <span className="entry-time">{formatTime(condition.datetime)}</span>
        </div>
      </div>

      <div className="condition-details">
        <div className="condition-rating">
          <span 
            className="rating-badge"
            style={{ backgroundColor: getConditionColor(condition.condition_rating) }}
          >
            {condition.condition_rating}
          </span>
          <span className="rating-label">
            {getConditionLabel(condition.condition_rating)}
          </span>
        </div>

        {condition.notes && (
          <div className="condition-notes">
            <strong>Notes:</strong> {condition.notes}
          </div>
        )}
      </div>
    </div>
  );

  const combinedHistory = getCombinedHistory();

  return (
    <div className="history">
      <h2>History</h2>

      {/* Date Range and Filter Controls */}
      <div className="history-controls">
        <div className="date-range">
          <div className="form-group">
            <label htmlFor="startDate">From</label>
            <input
              type="date"
              id="startDate"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">To</label>
            <input
              type="date"
              id="endDate"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-controls">
          <label>Show:</label>
          <div className="filter-buttons">
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`btn btn-sm ${filter === 'meals' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('meals')}
            >
              Meals Only
            </button>
            <button
              className={`btn btn-sm ${filter === 'conditions' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('conditions')}
            >
              Conditions Only
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading">
          <p>Loading history...</p>
        </div>
      )}

      {/* History Entries */}
      {!loading && (
        <div className="history-timeline">
          {combinedHistory.length === 0 ? (
            <div className="no-data">
              <p>No data found for the selected date range.</p>
              <p>Try expanding your date range or add some meals and hand conditions!</p>
            </div>
          ) : (
            combinedHistory.map((entry, index) => (
              <div key={`${entry.type}-${index}`} className="timeline-item">
                {entry.type === 'meal' 
                  ? renderMealEntry(entry.data as Meal)
                  : renderConditionEntry(entry.data as HandCondition)
                }
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && combinedHistory.length > 0 && (
        <div className="history-summary">
          <h3>Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-number">{meals.length}</span>
              <span className="stat-label">Meals</span>
            </div>
            <div className="stat">
              <span className="stat-number">{handConditions.length}</span>
              <span className="stat-label">Hand Conditions</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {handConditions.length > 0 
                  ? (handConditions.reduce((sum, c) => sum + c.condition_rating, 0) / handConditions.length).toFixed(1)
                  : 'N/A'
                }
              </span>
              <span className="stat-label">Avg Condition</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
