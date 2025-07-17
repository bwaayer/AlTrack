// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MealEntry from './components/MealEntry';
import HandConditionEntry from './components/HandConditionEntry';
import History from './components/History';
import Statistics from './components/Statistics';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">Food & Skin Tracker</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">Add Meal</Link>
              <Link to="/hand-condition" className="nav-link">Hand Condition</Link>
              <Link to="/history" className="nav-link">History</Link>
              <Link to="/statistics" className="nav-link">Statistics</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<MealEntry />} />
            <Route path="/hand-condition" element={<HandConditionEntry />} />
            <Route path="/history" element={<History />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
