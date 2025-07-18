// frontend/src/components/Statistics.tsx
import React, { useState, useEffect } from 'react';
import { foodApi } from '../api.ts';
import { Statistics as StatsType } from '../types';

const Statistics: React.FC = () => {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeChart, setActiveChart] = useState<'condition' | 'meals' | 'weekly'>('condition');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await foodApi.getStatistics();
      setStats(data);
    } catch (err) {
      setError('Failed to load statistics');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (rating: number) => {
    if (rating <= 3) return '#4CAF50'; // Green - Good
    if (rating <= 6) return '#FF9800'; // Orange - Moderate
    return '#F44336'; // Red - Poor
  };

  const getConditionDescription = (rating: number) => {
    if (rating <= 3) return 'Good';
    if (rating <= 6) return 'Moderate';
    return 'Poor';
  };

  const renderConditionTrend = () => {
    if (!stats?.conditionTrend || stats.conditionTrend.length === 0) {
      return <div className="no-data">No condition data available</div>;
    }

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
    return (
      <div className="statistics">
        <h2>Statistics</h2>
        <div className="loading">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics">
        <h2>Statistics</h2>
        <div className="error">{error}</div>
        <button onClick={fetchStatistics} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="statistics">
        <h2>Statistics</h2>
        <div className="no-data">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="statistics">
      <div className="statistics-header">
        <h2>Statistics Dashboard</h2>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="toggle-advanced-btn"
        >
          {showAdvanced ? 'Show Basic' : 'Show Advanced'}
        </button>
      </div>

      {!showAdvanced ? (
        <div className="stats-grid">
          {/* Overview Cards */}
          <div className="stats-section overview-cards">
            <div className="stat-card">
              <div className="stat-number">{stats.totalMeals}</div>
              <div className="stat-label">Total Meals Logged</div>
            </div>

            <div className="stat-card suspicious">
              <div className="stat-number">{stats.suspiciousMeals}</div>
              <div className="stat-label">Suspicious Meals</div>
            </div>

            <div className="stat-card warning">
              <div className="stat-number">{stats.suspiciousFoods}</div>
              <div className="stat-label">Suspicious Foods</div>
            </div>

            <div className="stat-card condition">
              <div className="stat-number" style={{ color: getConditionColor(stats.avgConditionLast7Days) }}>
                {stats.avgConditionLast7Days.toFixed(1)}/10
              </div>
              <div className="stat-label">
                Avg Hand Condition (7 days)
                <div className="condition-description">
                  {getConditionDescription(stats.avgConditionLast7Days)}
                </div>
              </div>
            </div>
          </div>

          {/* Suspicious Foods List */}
          <div className="stats-section">
            <h3>Most Frequent Suspicious Foods</h3>
            {stats.topSuspiciousFoods.length === 0 ? (
              <div className="no-data">No suspicious foods identified yet</div>
            ) : (
              <div className="suspicious-foods-list">
                {stats.topSuspiciousFoods.map((food, index) => (
                  <div key={food.name} className="suspicious-food-item">
                    <div className="food-rank">#{index + 1}</div>
                    <div className="food-info">
                      <div className="food-name">{food.name}</div>
                      <div className="food-frequency">
                        Consumed {food.frequency} time{food.frequency !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="frequency-bar">
                      <div 
                        className="frequency-fill"
                        style={{ 
                          width: `${(food.frequency / Math.max(...stats.topSuspiciousFoods.map(f => f.frequency))) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk Assessment */}
          <div className="stats-section">
            <h3>Risk Assessment</h3>
            <div className="risk-indicators">
              <div className="risk-item">
                <div className="risk-label">Meal Risk Rate</div>
                <div className="risk-value">
                  {stats.totalMeals > 0 ? ((stats.suspiciousMeals / stats.totalMeals) * 100).toFixed(1) : 0}%
                </div>
                <div className="risk-description">
                  {stats.suspiciousMeals} out of {stats.totalMeals} meals marked suspicious
                </div>
              </div>

              <div className="risk-item">
                <div className="risk-label">Food Safety Score</div>
                <div className="risk-value">
                  {stats.suspiciousFoods === 0 ? '100' : Math.max(0, 100 - (stats.suspiciousFoods * 10)).toFixed(0)}%
                </div>
                <div className="risk-description">
                  Based on {stats.suspiciousFoods} suspicious food{stats.suspiciousFoods !== 1 ? 's' : ''} identified
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="stats-section">
            <h3>Recommendations</h3>
            <div className="recommendations">
              {stats.avgConditionLast7Days > 6 && (
                <div className="recommendation warning">
                  <span className="recommendation-icon">⚠️</span>
                  <div className="recommendation-text">
                    Your average hand condition has been poor recently. Consider reviewing your recent meals for potential triggers.
                  </div>
                </div>
              )}

              {stats.suspiciousFoods > 5 && (
                <div className="recommendation caution">
                  <span className="recommendation-icon">🔍</span>
                  <div className="recommendation-text">
                    You have identified {stats.suspiciousFoods} suspicious foods. Consider keeping a more detailed food diary.
                  </div>
                </div>
              )}

              {stats.suspiciousMeals === 0 && stats.totalMeals > 10 && (
                <div className="recommendation positive">
                  <span className="recommendation-icon">✅</span>
                  <div className="recommendation-text">
                    Great job! No suspicious meals identified yet. Keep monitoring your reactions.
                  </div>
                </div>
              )}

              {stats.totalMeals < 5 && (
                <div className="recommendation info">
                  <span className="recommendation-icon">📝</span>
                  <div className="recommendation-text">
                    Log more meals to get better insights and identify patterns in your food reactions.
                  </div>
                </div>
              )}

              {stats.avgConditionLast7Days <= 3 && (
                <div className="recommendation positive">
                  <span className="recommendation-icon">🎉</span>
                  <div className="recommendation-text">
                    Excellent! Your hand condition has been good recently. Keep up whatever you're doing!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
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
      )}

      <div className="refresh-section">
        <button onClick={fetchStatistics} className="refresh-btn">
          Refresh Statistics
        </button>
        <div className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
