import React from 'react';

interface NutritionDisplayProps {
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  showMacros?: boolean;
}

/**
 * CalAI Design System - Nutrition Display with Emojis
 * Uses CSS classes from App.css for consistent styling
 */
export const NutritionDisplay: React.FC<NutritionDisplayProps> = ({
  calories,
  protein,
  carbs,
  fats,
  showMacros = true,
}) => {
  if (!calories && !protein && !carbs && !fats) {
    return (
      <div className="alert alert-warning">
        <span className="alert-emoji">⚠️</span>
        <div>
          <p>No nutritional data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nutrition-card">
      <div className="nutrition-header">
        <span className="nutrition-header-emoji">🥗</span>
        <span>Nutrition Facts</span>
      </div>

      <div className="calories-main">
        <div className="calories-emoji">🔥</div>
        {calories !== undefined && (
          <>
            <div className="calories-number">{calories}</div>
            <div className="calories-label">kcal</div>
          </>
        )}
      </div>

      {showMacros && (protein !== undefined || carbs !== undefined || fats !== undefined) && (
        <div className="macros-grid">
          {protein !== undefined && (
            <div className="macro-item">
              <div className="macro-emoji">⚡</div>
              <div className="macro-value">{protein}g</div>
              <div className="macro-name">Protein</div>
            </div>
          )}
          {carbs !== undefined && (
            <div className="macro-item">
              <div className="macro-emoji">🌾</div>
              <div className="macro-value">{carbs}g</div>
              <div className="macro-name">Carbs</div>
            </div>
          )}
          {fats !== undefined && (
            <div className="macro-item">
              <div className="macro-emoji">💧</div>
              <div className="macro-value">{fats}g</div>
              <div className="macro-name">Fats</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface MacroBadgeProps {
  type: 'protein' | 'carbs' | 'fats';
  value: number;
  unit?: string;
  showEmoji?: boolean;
}

/**
 * Individual macro badge with emoji and color coding
 */
export const MacroBadge: React.FC<MacroBadgeProps> = ({
  type,
  value,
  unit = 'g',
  showEmoji = true,
}) => {
  const emojiMap = {
    protein: '⚡',
    carbs: '🌾',
    fats: '💧',
  };

  return (
    <div className={`macro-badge ${type}`}>
      {showEmoji && <span>{emojiMap[type]}</span>}
      <span>
        {value}
        {unit}
      </span>
    </div>
  );
};

interface CalorieDisplayProps {
  calories: number;
  showLabel?: boolean;
  animated?: boolean;
}

/**
 * Calorie display with floating emoji animation
 */
export const CalorieDisplay: React.FC<CalorieDisplayProps> = ({
  calories,
  showLabel = true,
  animated = true,
}) => {
  return (
    <div className="calorie-display">
      {animated && <div className="calorie-emoji">🔥</div>}
      {!animated && <span style={{ fontSize: '4rem' }}>🔥</span>}
      <div className="calories-number">{calories}</div>
      {showLabel && <div className="calories-label">kcal</div>}
    </div>
  );
};
