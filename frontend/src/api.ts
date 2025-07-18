import axios from 'axios';
import { Meal, HandCondition, Statistics, FoodItem } from './types.ts';

// Dynamically determine API URL based on current host
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Use current hostname with port 3001
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add debugging
console.log('API Base URL:', API_BASE_URL);

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('API Request:', request.method?.toUpperCase(), request.url);
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.message, error.config?.url);
    return Promise.reject(error);
  }
);

export const foodApi = {
  // Food suggestions
  getFoodSuggestions: async (query?: string): Promise<FoodItem[]> => {
    const response = await api.get('/api/food-suggestions', {
      params: { query }
    });
    return response.data;
  },

  // Meals
  getMeals: async (startDate?: string, endDate?: string): Promise<Meal[]> => {
    const response = await api.get('/api/meals', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  addMeal: async (meal: Omit<Meal, 'id'>): Promise<{ id: number; message: string }> => {
    const response = await api.post('/api/meals', meal);
    return response.data;
  },

  // Hand conditions
  getHandConditions: async (startDate?: string, endDate?: string): Promise<HandCondition[]> => {
    const response = await api.get('/api/hand-conditions', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  addHandCondition: async (condition: Omit<HandCondition, 'id'>): Promise<{ id: number; message: string }> => {
    const response = await api.post('/api/hand-conditions', condition);
    return response.data;
  },

  // Statistics
  getStatistics: async (): Promise<Statistics> => {
    const response = await api.get('/api/statistics');
    return response.data;
  },

  // Mark meal as suspicious
  markMealSuspicious: async (mealId: number, reason?: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/meals/${mealId}/suspicious`, { reason });
    return response.data;
  },

  // Unmark meal as suspicious
  unmarkMealSuspicious: async (mealId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/meals/${mealId}/suspicious`);
    return response.data;
  },

  // Update suspicious meal reason
  updateSuspiciousReason: async (mealId: number, reason: string): Promise<{ message: string }> => {
    const response = await api.put(`/api/meals/${mealId}/suspicious`, { reason });
    return response.data;
  },
};
