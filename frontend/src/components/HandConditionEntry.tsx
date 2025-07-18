// frontend/src/components/HandConditionEntry.tsx
import React, { useState } from 'react';
import { foodApi } from '../api.ts';

const HandConditionEntry: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeOfDay, setTimeOfDay] = useState(new Date().toTimeString().slice(0, 5));
  const [conditionRating, setConditionRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await foodApi.addHandCondition({
        date,
        time_of_day: timeOfDay,
        condition_rating: conditionRating,
        notes
      });

      setMessage('Hand condition recorded successfully!');
      setNotes('');
    } catch (error) {
      setMessage('Error recording hand condition. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingDescription = (rating: number) => {
    const descriptions = {
      1: 'Excellent - No irritation',
      2: 'Very Good - Minimal irritation',
      3: 'Good - Slight irritation',
      4: 'Fair - Noticeable irritation',
      5: 'Average - Moderate irritation',
      6: 'Below Average - Concerning irritation',
      7: 'Poor - Significant irritation',
      8: 'Very Poor - Severe irritation',
      9: 'Terrible - Very severe irritation',
      10: 'Worst - Extreme irritation'
    };
    return descriptions[rating as keyof typeof descriptions];
  };

  return (
    <div className="hand-condition-entry">
      <h2>Record Hand Condition</h2>

      <form onSubmit={handleSubmit} className="condition-form">
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
            <label htmlFor="time">Time:</label>
            <input
              type="time"
              id="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="rating">Condition Rating (1-10):</label>
          <div className="rating-container">
            <input
              type="range"
              id="rating"
              min="1"
              max="10"
              value={conditionRating}
              onChange={(e) => setConditionRating(parseInt(e.target.value))}
              className="rating-slider"
            />
            <div className="rating-display">
              <span className="rating-number">{conditionRating}</span>
              <span className="rating-description">{getRatingDescription(conditionRating)}</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the condition, any symptoms, or observations..."
            rows={4}
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Recording...' : 'Record Condition'}
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

export default HandConditionEntry;
