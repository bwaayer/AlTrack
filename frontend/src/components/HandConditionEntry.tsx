import React, { useState, useEffect } from 'react';
import { foodApi } from '../api.ts';
import { HandCondition } from '../types.ts';

const HandConditionEntry: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [condition, setCondition] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [todaysConditions, setTodaysConditions] = useState<HandCondition[]>([]);

  // Load today's conditions when component mounts or date changes
  useEffect(() => {
    loadTodaysConditions();
  }, [date]);

  const loadTodaysConditions = async () => {
    try {
      const conditions = await foodApi.getHandConditions(date, date);
      setTodaysConditions(conditions);
    } catch (error) {
      console.error('Error loading today\'s conditions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Combine date and time
      const datetime = `${date}T${time}:00`;

      await foodApi.addHandCondition({
        datetime,
        condition_rating: condition,
        notes: notes.trim() || undefined
      });

      setMessage({ type: 'success', text: 'Hand condition recorded successfully!' });

      // Reset form
      setTime(new Date().toTimeString().slice(0, 5));
      setCondition(5);
      setNotes('');

      // Reload today's conditions
      loadTodaysConditions();

    } catch (error) {
      console.error('Error adding hand condition:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to record hand condition' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getConditionLabel = (rating: number): string => {
    const labels = {
      1: 'Very Bad - Severe irritation/rash',
      2: 'Bad - Noticeable irritation',
      3: 'Poor - Mild irritation',
      4: 'Fair - Slight dryness/sensitivity',
      5: 'Normal - No issues',
      6: 'Good - Feeling well',
      7: 'Very Good - Hands feel great',
      8: 'Excellent - Perfect condition',
      9: 'Outstanding - Exceptionally good',
      10: 'Perfect - Best possible condition'
    };
    return labels[rating as keyof typeof labels] || 'Unknown';
  };

  const getConditionColor = (rating: number): string => {
    if (rating <= 2) return '#f44336'; // Red
    if (rating <= 4) return '#ff9800'; // Orange
    if (rating <= 6) return '#ffc107'; // Yellow
    if (rating <= 8) return '#4caf50'; // Green
    return '#2196f3'; // Blue
  };

  const formatTime = (datetime: string): string => {
    return new Date(datetime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="hand-condition-entry">
      <h2>Record Hand Condition</h2>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
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
            <label htmlFor="time">Time</label>
            <input
              type="time"
              id="time"
              className="form-control"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="condition">
            Hand Condition Rating: <strong>{condition}</strong>
          </label>
          <div className="condition-rating-container">
            <input
              type="range"
              id="condition"
              className="condition-slider"
              min="1"
              max="10"
              value={condition}
              onChange={(e) => setCondition(parseInt(e.target.value))}
              style={{ 
                background: `linear-gradient(to right, #f44336 0%, #ff9800 25%, #ffc107 50%, #4caf50 75%, #2196f3 100%)` 
              }}
            />
            <div className="condition-scale">
              <span>1 (Very Bad)</span>
              <span>5 (Normal)</span>
              <span>10 (Perfect)</span>
            </div>
          </div>
          <div 
            className="condition-description"
            style={{ color: getConditionColor(condition) }}
          >
            {getConditionLabel(condition)}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            className="form-control"
            rows={3}
            placeholder="Any specific symptoms, triggers, or observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Recording...' : 'Record Condition'}
        </button>
      </form>

      {/* Today's Conditions Summary */}
      {todaysConditions.length > 0 && (
        <div className="todays-conditions">
          <h3>Today's Conditions</h3>
          <div className="conditions-list">
            {todaysConditions.map((cond, index) => (
              <div key={index} className="condition-item">
                <div className="condition-time">
                  {formatTime(cond.datetime)}
                </div>
                <div className="condition-rating">
                  <span 
                    className="rating-badge"
                    style={{ backgroundColor: getConditionColor(cond.condition_rating) }}
                  >
                    {cond.condition_rating}
                  </span>
                </div>
                <div className="condition-details">
                  <div className="condition-label">
                    {getConditionLabel(cond.condition_rating)}
                  </div>
                  {cond.notes && (
                    <div className="condition-notes">
                      {cond.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HandConditionEntry;
