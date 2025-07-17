{
    "name": "food-tracker-frontend",
    "version": "1.0.0",
    "private": true,
    "dependencies": {
      "@types/node": "^16.18.0",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.8.0",
      "react-scripts": "5.0.1",
      "typescript": "^4.9.0",
      "axios": "^1.3.0",
      "date-fns": "^2.29.0",
      "react-datepicker": "^4.10.0",
      "react-select": "^5.7.0"
    },
    "scripts": {
      "start": "react-scripts start",
      "build": "react-scripts build",
      "test": "react-scripts test",
      "eject": "react-scripts eject"
    },
    "eslintConfig": {
      "extends": [
        "react-app",
        "react-app/jest"
      ]
    },
    "browserslist": {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    }
  }
  // frontend/src/types.ts - Add to existing types
export interface Statistics {
    totalMeals: number;
    suspiciousFoods: number;
    suspiciousMeals: number;
    avgConditionLast7Days: number;
    avgConditionLast30Days: number;
    topSuspiciousFoods: Array<{
      name: string;
      frequency: number;
    }>;
    conditionTrend: Array<{
      date: string;
      avg_rating: number;
    }>;
    mealTypeDistribution: Array<{
      meal_type: string;
      count: number;
      suspicious_count: number;
    }>;
    weeklyTrends: Array<{
      week: string;
      meals_count: number;
      suspicious_count: number;
    }>;
  }
  