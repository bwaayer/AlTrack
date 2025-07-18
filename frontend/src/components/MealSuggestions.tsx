// frontend/src/components/FoodSuggestions.tsx
import React, { useState, useEffect, useRef } from 'react';
import { foodApi } from '../api.ts';
import { FoodItem } from '../types';

interface FoodSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FoodSuggestions: React.FC<FoodSuggestionsProps> = ({ value, onChange, placeholder }) => {
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const results = await foodApi.getFoodSuggestions(value);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: FoodItem) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="food-suggestions-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className="food-input"
      />

      {showSuggestions && (
        <div ref={suggestionsRef} className="suggestions-dropdown">
          {loading && <div className="suggestion-item loading">Loading...</div>}

          {!loading && suggestions.length === 0 && value.length >= 2 && (
            <div className="suggestion-item no-results">No suggestions found</div>
          )}

          {!loading && suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`suggestion-item ${suggestion.is_suspicious ? 'suspicious' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="suggestion-name">{suggestion.name}</span>
              {suggestion.is_suspicious && (
                <span className="suspicious-badge">⚠️ Suspicious</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodSuggestions;
