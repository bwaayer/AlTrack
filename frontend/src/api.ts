// frontend/src/api.ts
import axios from 'axios';
import { FoodItem, Meal, HandCondition, Statistics } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const foodApi = {
  // Food suggestions
  getFoodSuggestions: async (query: string): Promise<FoodItem[]> => {
    const response = await api.get(`/api/food-suggestions?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Meals
  addMeal: async (meal: {
    date: string;
    meal_type: string;
    items: Array<{ name: string; quantity: string; notes?: string }>;
    notes?: string;
  }) => {
    const response = await api.post('/api/meals', meal);
    return response.data;
  },

  getMeals: async (startDate: string, endDate: string): Promise<Meal[]> => {
    const response = await api.get(`/api/meals?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  },

  markMealSuspicious: async (mealId: number, reason: string) => {
    const response = await api.post(`/api/meals/${mealId}/suspicious`, { reason });
    return response.data;
  },

  // Hand conditions
  addHandCondition: async (condition: {
    date: string;
    time_of_day: string;
    condition_rating: number;
    notes?: string;
  }) => {
    const response = await api.post('/api/hand-conditions', condition);
    return response.data;
  },

  getHandConditions: async (startDate: string, endDate: string): Promise<HandCondition[]> => {
    const response = await api.get(`/api/hand-conditions?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  },

  // Statistics
  getStatistics: async (): Promise<Statistics> => {
    const response = await api.get('/api/statistics');
    return response.data;
  },
};
