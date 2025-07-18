export interface FoodItem {
  id?: number;
  name: string;
  is_suspicious?: boolean;
}

export interface MealItem {
  name: string;
  quantity?: string;
  notes?: string;
  is_suspicious?: boolean;
}

export interface Meal {
  id?: number;
  date: string;
  meal_type: string;
  items: MealItem[];
  notes?: string;
  is_suspicious?: boolean;
  suspicious_reason?: string;
}

export interface HandCondition {
  id?: number;
  date: string;
  time: string;
  rating: number;
  notes?: string;
}

export interface Statistics {
  totalMeals: number;
  suspiciousMeals: number;
  suspiciousFoods: number;
  avgConditionLast7Days: number;
  topSuspiciousFoods: Array<{
    name: string;
    frequency: number;
  }>;
  conditionTrend?: Array<{
    date: string;
    avg_rating: number;
  }>;
  mealTypeDistribution?: Array<{
    meal_type: string;
    count: number;
    suspicious_count: number;
  }>;
  weeklyTrends?: Array<{
    week: string;
    meals_count: number;
    suspicious_count: number;
  }>;
}
