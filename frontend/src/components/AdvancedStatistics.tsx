// frontend/src/components/AdvancedStatistics.tsx
import React, { useState, useEffect } from 'react';
import { foodApi } from '../api.ts';
import { Statistics as StatsType } from '../types';

const AdvancedStatistics: React.FC = () => {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'condition' | 'meals' | 'weekly'>('condition');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const data = await foodApi.getStatistics();
      setStats(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderConditionTrend = () => {
    if (!stats?.conditionTrend || stats.conditionTrend.length === 0) {
      return <div className="no-data">No condition data available</div>;
    }

    const maxRating = Math.max(...stats.conditionTrend.map(d => d.avg_rating));

    return (
      <div className="chart-container">
        <h4>Hand Condition Trend (Last 14 Days)</h4>
        <div className="simple-chart">
          {stats.conditionTrend.map((point, index) => (
            <div key={index} className="chart-bar">
              <div 
                className="bar-fill condition-bar"
                style={{ 
                  height: `${(point.avg_rating / 10) * 100}%`,
                  backgroundColor: point.avg_rating <= 3 ? '#4CAF50' : 
                                 point.avg_rating <= 6 ? '#FF9800' : '#F44336'
                }}
              />
              <div className="bar-label">
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="bar-value">{point.avg_rating.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMealTypeDistribution = () => {
    if (!stats?.mealTypeDistribution || stats.mealTypeDistribution.length === 0) {
      return <div className="no-data">No meal data available</div>;
    }

    const totalMeals = stats.mealTypeDistribution.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="chart-container">
        <h4>Meal Type Distribution</h4>
        <div className="pie-chart-container">
          {stats.mealTypeDistribution.map((item, index) => {
            const percentage = (item.count / totalMeals) * 100;
            const suspiciousRate = item.count > 0 ? (item.suspicious_count / item.count) * 100 : 0;

            return (
              <div key={index} className="meal-type-stat">
                <div className="meal-type-header">
                  <span className="meal-type-name">
                    {item.meal_type.charAt(0).toUpperCase() + item.meal_type.slice(1)}
                  </span>
                  <span className="meal-type-count">{item.count} meals</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="meal-type-details">
                  <span>{percentage.toFixed(1)}% of total</span>
                  {item.suspicious_count > 0 && (
                    <span className="suspicious-rate">
                      {suspiciousRate.toFixed(1)}% suspicious
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeeklyTrends = () => {
    if (!stats?.weeklyTrends || stats.weeklyTrends.length === 0) {
      return <div className="no-data">No weekly data available</div>;
    }

    return (
      <div className="chart-container">
        <h4>Weekly Trends (Last 4 Weeks)</h4>
        <div className="weekly-chart">
          {stats.weeklyTrends.map((week, index) => {
            const suspiciousRate = week.meals_count > 0 ? (week.suspicious_count / week.meals_count) * 100 : 0;

            return (
              <div key={index} className="week-stat">
                <div className="week-header">
                  <span className="week-date">
                    Week of {new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="week-metrics">
                  <div className="metric">
                    <span className="metric-value">{week.meals_count}</span>
                    <span className="metric-label">Meals</span>
                  </div>
                  <div className="metric suspicious">
                    <span className="metric-value">{week.suspicious_count}</span>
                    <span className="metric-label">Suspicious</span>
                  </div>
                  <div className="metric rate">
                    <span className="metric-value">{suspiciousRate.toFixed(1)}%</span>
                    <span className="metric-label">Risk Rate</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading advanced statistics...</div>;
  }

  if (!stats) {
    return <div className="no-data">No statistics available</div>;
  }

  return (
    <div className="advanced-statistics">
      <div className="chart-tabs">
        <button 
          className={`chart-tab ${activeChart === 'condition' ? 'active' : ''}`}
          onClick={() => setActiveChart('condition')}
        >
          Condition Trend
        </button>
        <button 
          className={`chart-tab ${activeChart === 'meals' ? 'active' : ''}`}
          onClick={() => setActiveChart('meals')}
        >
          Meal Types
        </button>
        <button 
          className={`chart-tab ${activeChart === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveChart('weekly')}
        >
          Weekly Trends
        </button>
      </div>

      <div className="chart-content">
        {activeChart === 'condition' && renderConditionTrend()}
        {activeChart === 'meals' && renderMealTypeDistribution()}
        {activeChart === 'weekly' && renderWeeklyTrends()}
      </div>
    </div>
  );
};

export default AdvancedStatistics;
