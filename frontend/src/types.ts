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
  items?: MealItem[];
  notes?: string;
  created_at?: string;
  is_suspicious?: boolean;
  suspicious_reason?: string;
}


export interface HandCondition {
  id?: number;
  datetime: string; // This will be constructed from date + time_of_day
  condition_rating: number;
  notes?: string;
  created_at?: string;
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
export interface Statistics {
  overview: {
    totalMeals: number;
    totalConditions: number;
    suspiciousMeals: number;
    suspiciousFoods: number;
    avgCondition: string;
    suspiciousPercentage: string;
  };
  suspiciousFoodRankings: Array<{
    name: string;
    suspicious_count: number;
    is_suspicious: boolean;
  }>;
  conditionTrends: Array<{
    date: string;
    avg_rating: number;
    entries_count: number;
  }>;
  mealTypeAnalysis: Array<{
    meal_type: string;
    total_meals: number;
    suspicious_meals: number;
    suspicious_percentage: number;
  }>;
  recentSuspiciousMeals: Array<{
    date: string;
    meal_type: string;
    reason: string;
    marked_at: string;
    food_items: string[];
  }>;
  foodCombinations: Array<{
    food_combination: string[];
    suspicious_together_count: number;
  }>;
  weeklyPatterns: Array<{
    day_of_week: number;
    day_name: string;
    avg_condition: number;
    entries: number;
  }>;
  recoveryAnalysis: {
    avgRecoveryDays: string | null;
    recoveryInstances: number;
  };
  monthlySummary: Array<{
    month: string;
    total_meals: number;
    suspicious_meals: number;
    avg_condition: number;
  }>;
}
