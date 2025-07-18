import React, { useState, useEffect } from 'react';
import { foodApi } from '../api.ts';
import { Statistics as StatisticsType } from '../types.ts';

const Statistics: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'foods' | 'patterns' | 'insights'>('overview');

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const data = await foodApi.getStatistics();
        setStatistics(data);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatMonth = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getConditionColor = (rating: number): string => {
    if (rating <= 2) return '#f44336';
    if (rating <= 4) return '#ff9800';
    if (rating <= 6) return '#ffc107';
    if (rating <= 8) return '#4caf50';
    return '#2196f3';
  };

  const getRiskLevel = (percentage: number): { level: string; color: string } => {
    if (percentage >= 50) return { level: 'High Risk', color: '#f44336' };
    if (percentage >= 25) return { level: 'Medium Risk', color: '#ff9800' };
    if (percentage >= 10) return { level: 'Low Risk', color: '#ffc107' };
    return { level: 'Safe', color: '#4caf50' };
  };

  if (loading) {
    return (
      <div className="statistics">
        <h2>Statistics</h2>
        <div className="loading">
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="statistics">
        <h2>Statistics</h2>
        <div className="alert alert-error">
          {error || 'No statistics available'}
        </div>
      </div>
    );
  }

  return (
    <div className="statistics">
      <h2>Food Allergy Statistics</h2>

      {/* Tab Navigation */}
      <div className="stats-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button 
          className={`tab ${activeTab === 'foods' ? 'active' : ''}`}
          onClick={() => setActiveTab('foods')}
        >
          Food Analysis
        </button>
        <button 
          className={`tab ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          Patterns
        </button>
        <button 
          className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="stats-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{statistics.overview.totalMeals}</div>
              <div className="stat-label">Total Meals</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{statistics.overview.totalConditions}</div>
              <div className="stat-label">Hand Condition Records</div>
            </div>
            <div className="stat-card suspicious">
              <div className="stat-number">{statistics.overview.suspiciousMeals}</div>
              <div className="stat-label">Suspicious Meals</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-number">{statistics.overview.suspiciousFoods}</div>
              <div className="stat-label">Suspicious Foods</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{statistics.overview.avgCondition}</div>
              <div className="stat-label">Avg Hand Condition</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{statistics.overview.suspiciousPercentage}%</div>
              <div className="stat-label">Suspicious Meal Rate</div>
            </div>
          </div>

          {/* Recent Suspicious Meals */}
          <div className="stats-section">
            <h3>Recent Suspicious Meals</h3>
            <div className="suspicious-meals-list">
              {statistics.recentSuspiciousMeals.map((meal, index) => (
                <div key={index} className="suspicious-meal-card">
                  <div className="meal-header">
                    <span className="meal-date">{formatDate(meal.date)}</span>
                    <span className="meal-type">{meal.meal_type}</span>
                  </div>
                  <div className="meal-foods">
                    {meal.food_items.join(', ')}
                  </div>
                  <div className="meal-reason">
                    <strong>Reason:</strong> {meal.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="stats-content">
          <div className="stats-section">
            <h3>Hand Condition Trends (Last 30 Days)</h3>
            <div className="trend-chart">
              {statistics.conditionTrends.map((trend, index) => (
                <div key={index} className="trend-bar">
                  <div className="trend-date">{formatDate(trend.date)}</div>
                  <div className="trend-visual">
                    <div 
                      className="trend-fill"
                      style={{ 
                        width: `${(trend.avg_rating / 10) * 100}%`,
                        backgroundColor: getConditionColor(trend.avg_rating)
                      }}
                    ></div>
                  </div>
                  <div className="trend-value">{trend.avg_rating.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-section">
            <h3>Weekly Patterns</h3>
            <div className="weekly-grid">
              {statistics.weeklyPatterns.map((pattern, index) => (
                <div key={index} className="day-card">
                  <div className="day-name">{pattern.day_name}</div>
                  <div 
                    className="day-rating"
                    style={{ backgroundColor: getConditionColor(pattern.avg_condition) }}
                  >
                    {pattern.avg_condition.toFixed(1)}
                  </div>
                  <div className="day-entries">{pattern.entries} entries</div>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-section">
            <h3>Monthly Summary</h3>
            <div className="monthly-summary">
              {statistics.monthlySummary.map((month, index) => (
                <div key={index} className="month-card">
                  <div className="month-name">{formatMonth(month.month)}</div>
                  <div className="month-stats">
                    <div className="month-stat">
                      <span className="stat-value">{month.total_meals}</span>
                      <span className="stat-label">Meals</span>
                    </div>
                    <div className="month-stat suspicious">
                      <span className="stat-value">{month.suspicious_meals}</span>
                      <span className="stat-label">Suspicious</span>
                    </div>
                    <div className="month-stat">
                      <span className="stat-value">{month.avg_condition?.toFixed(1) || 'N/A'}</span>
                      <span className="stat-label">Avg Condition</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Food Analysis Tab */}
      {activeTab === 'foods' && (
        <div className="stats-content">
          <div className="stats-section">
            <h3>Most Suspicious Foods</h3>
            <div className="food-rankings">
              {statistics.suspiciousFoodRankings.map((food, index) => {
                const riskInfo = getRiskLevel((food.suspicious_count / statistics.overview.suspiciousMeals) * 100);
                return (
                  <div key={index} className="food-rank-card">
                    <div className="rank-number">#{index + 1}</div>
                    <div className="food-info">
                      <div className="food-name">{food.name}</div>
                      <div className="food-stats">
                        <span className="suspicious-count">{food.suspicious_count} suspicious meals</span>
                        <span 
                          className="risk-level"
                          style={{ color: riskInfo.color }}
                        >
                          {riskInfo.level}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="stats-section">
            <h3>Meal Type Analysis</h3>
            <div className="meal-type-grid">
              {statistics.mealTypeAnalysis.map((mealType, index) => (
                <div key={index} className="meal-type-card">
                  <div className="meal-type-name">{mealType.meal_type}</div>
                  <div className="meal-type-stats">
                    <div className="stat-row">
                      <span>Total Meals:</span>
                      <span>{mealType.total_meals}</span>
                    </div>
                    <div className="stat-row">
                      <span>Suspicious:</span>
                      <span>{mealType.suspicious_meals}</span>
                    </div>
                    <div className="stat-row">
                      <span>Risk Rate:</span>
                      <span style={{ 
                        color: getRiskLevel(mealType.suspicious_percentage).color,
                        fontWeight: 'bold'
                      }}>
                        {mealType.suspicious_percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="stats-content">
          <div className="stats-section">
            <h3>Suspicious Food Combinations</h3>
            <div className="combinations-list">
              {statistics.foodCombinations.map((combo, index) => (
                <div key={index} className="combination-card">
                  <div className="combination-foods">
                    {combo.food_combination.join(' + ')}
                  </div>
                  <div className="combination-count">
                    Appeared together in {combo.suspicious_together_count} suspicious meals
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="stats-content">
          <div className="stats-section">
            <h3>Recovery Analysis</h3>
            <div className="recovery-card">
              {statistics.recoveryAnalysis.avgRecoveryDays ? (
                <>
                  <div className="recovery-stat">
                    <div className="recovery-number">{statistics.recoveryAnalysis.avgRecoveryDays}</div>
                    <div className="recovery-label">Average Recovery Days</div>
                  </div>
                  <div className="recovery-info">
                    Based on {statistics.recoveryAnalysis.recoveryInstances} recovery instances where hand condition improved to 7+ after suspicious meals.
                  </div>
                </>
              ) : (
                <div className="no-data">
                  <p>Not enough data for recovery analysis.</p>
                  <p>Keep tracking to see how long it takes to recover from suspicious meals!</p>
                </div>
              )}
            </div>
          </div>

          <div className="stats-section">
            <h3>Key Insights</h3>
            <div className="insights-list">
              <div className="insight-card">
                <div className="insight-icon">🍽️</div>
                <div className="insight-text">
                  <strong>Meal Risk:</strong> {statistics.mealTypeAnalysis[0]?.meal_type || 'N/A'} meals have the highest suspicious rate at {statistics.mealTypeAnalysis[0]?.suspicious_percentage || 0}%
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon">⚠️</div>
                <div className="insight-text">
                  <strong>Top Trigger:</strong> {statistics.suspiciousFoodRankings[0]?.name || 'No data'} appears in {statistics.suspiciousFoodRankings[0]?.suspicious_count || 0} suspicious meals
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon">📊</div>
                <div className="insight-text">
                  <strong>Overall Trend:</strong> {parseFloat(statistics.overview.avgCondition) >= 7 ? 'Your hand condition is generally good!' : 'Consider reviewing your diet for potential triggers.'}
                </div>
              </div>

              {statistics.recoveryAnalysis.avgRecoveryDays && (
                <div className="insight-card">
                  <div className="insight-icon">⏰</div>
                  <div className="insight-text">
                    <strong>Recovery Time:</strong> It typically takes {statistics.recoveryAnalysis.avgRecoveryDays} days for your condition to improve after suspicious meals
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
