```
# Food & Skin Tracker

A comprehensive web application for tracking food intake and allergic reactions to help identify trigger foods and monitor skin condition patterns.

## 🎯 Purpose

This application helps users with food allergies or sensitivities track their meals and skin conditions to identify patterns and trigger foods. Perfect for managing allergic reactions, working with healthcare providers, and maintaining a detailed food diary.

## ✨ Features

### Core Functionality
- **Meal Logging**: Track breakfast, lunch, dinner, and snacks with detailed food items
- **Smart Food Suggestions**: Auto-complete with previous entries, highlighting suspicious foods
- **Hand Condition Tracking**: Rate skin condition throughout the day (1-10 scale)
- **Suspicious Food Marking**: Flag meals and foods that may have caused reactions
- **Historical Analysis**: View past meals and conditions with filtering options

### Analytics & Insights
- **Statistics Dashboard**: Overview of meals, suspicious foods, and condition trends
- **Pattern Recognition**: Identify frequently consumed suspicious foods
- **Risk Assessment**: Calculate meal risk rates and food safety scores
- **Smart Recommendations**: AI-powered suggestions based on your data
- **Advanced Charts**: Condition trends, meal type distribution, and weekly analysis

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Interface**: Clean, modern design with easy navigation
- **Real-time Suggestions**: Instant food recommendations as you type
- **Visual Indicators**: Color-coded warnings for suspicious foods

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **Styling**: Custom CSS with responsive design

### Project Structure
```
food-tracker/
├── docker-compose.yml          # Container orchestration
├── frontend/                   # React application
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── components/         # React components
│       ├── types.ts           # TypeScript definitions
│       ├── api.ts             # API client
│       └── App.css            # Styling
├── backend/                    # Express API server
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── server.js          # Main server file
└── database/
    └── init.sql               # Database schema
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git for cloning the repository

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd food-tracker
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### First Run
The database will be automatically initialized with the required schema on first startup.

## 📊 Database Schema

### Core Tables
- **`meals`**: Meal entries with date, type, and notes
- **`food_items`**: Master list of foods with suspicious flags
- **`meal_items`**: Junction table linking meals to food items
- **`hand_conditions`**: Daily condition ratings and observations
- **`suspicious_meals`**: Flagged meals with reasons

### Key Relationships
- Meals contain multiple food items
- Food items can be marked as suspicious
- Hand conditions are tracked independently
- Suspicious meals link back to specific meal entries

## 🔧 Configuration

### Environment Variables

**Backend** (`.env` file):
```env
DATABASE_URL=postgresql://tracker:tracker123@postgres:5432/food_tracker
PORT=3001
```

**Frontend** (`.env` file):
```env
REACT_APP_API_URL=http://localhost:3001
```

### Docker Compose Services
- **postgres**: PostgreSQL database with persistent storage
- **backend**: Express API server with hot reload
- **frontend**: React development server with hot reload

## 📱 Usage Guide

### Adding a Meal
1. Navigate to "Add Meal"
2. Select date and meal type
3. Add food items with quantities
4. Use auto-suggestions for faster entry
5. Note any suspicious foods (highlighted in red)
6. Add meal notes if needed

### Recording Hand Condition
1. Go to "Hand Condition"
2. Select date and time
3. Rate condition on 1-10 scale
4. Add descriptive notes
5. Track multiple times per day

### Viewing History
1. Visit "History" tab
2. Set date range filters
3. Switch between meals and conditions
4. Mark meals as suspicious if reactions occur
5. Review patterns over time

### Analyzing Statistics
1. Check "Statistics" dashboard
2. Review overview metrics
3. Examine suspicious food rankings
4. Read personalized recommendations
5. Toggle to advanced charts for deeper insights

## 🔒 Security Notes

- **No Authentication**: Designed for personal/family use over VPN
- **Local Network**: Intended for private network deployment
- **Data Privacy**: All data stored locally in your database
- **VPN Access**: Recommended for remote access

## 🛠️ Development

### Local Development Setup

1. **Backend Development**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Database Setup**
   ```bash
   docker run -d \
     --name food-tracker-db \
     -e POSTGRES_DB=food_tracker \
     -e POSTGRES_USER=tracker \
     -e POSTGRES_PASSWORD=tracker123 \
     -p 5432:5432 \
     postgres:15
   ```

### API Endpoints

**Meals**
- `GET /api/meals` - Retrieve meals with date filtering
- `POST /api/meals` - Create new meal entry
- `POST /api/meals/:id/suspicious` - Mark meal as suspicious

**Food Items**
- `GET /api/food-suggestions` - Get food suggestions with suspicious flags

**Hand Conditions**
- `GET /api/hand-conditions` - Retrieve condition entries
- `POST /api/hand-conditions` - Record new condition

**Statistics**
- `GET /api/statistics` - Comprehensive analytics data

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if PostgreSQL container is running
docker-compose ps

# View database logs
docker-compose logs postgres
```

**Frontend Not Loading**
```bash
# Rebuild frontend container
docker-compose build frontend
docker-compose up -d frontend
```

**API Errors**
```bash
# Check backend logs
docker-compose logs backend

# Restart backend service
docker-compose restart backend
```

### Port Conflicts
If ports 3000, 3001, or 5432 are in use:
1. Stop conflicting services
2. Or modify ports in `docker-compose.yml`

## 📈 Future Enhancements

### Planned Features
- [ ] Data export (CSV, JSON, PDF)
- [ ] Photo upload for meals
- [ ] Advanced correlation analysis
- [ ] Mobile PWA support
- [ ] Notification reminders
- [ ] Multi-user support

### Contributing
This is a personal project, but suggestions and improvements are welcome!

## 📄 License

This project is for personal use. Feel free to adapt for your own needs.

## 🏥 Medical Disclaimer

This application is for tracking purposes only and should not replace professional medical advice. Always consult healthcare providers for allergy management and treatment decisions.

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Docker Compose logs
3. Verify database connectivity
4. Ensure all containers are running

**Happy tracking! 🥗📊**
```

