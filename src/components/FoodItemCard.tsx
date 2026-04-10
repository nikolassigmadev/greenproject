import React from 'react';
import { X } from 'lucide-react';

export interface FoodItemCardProps {
  name: string;
  brand?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  imageUrl?: string;
  timestamp?: Date;
  onRemove?: () => void;
  onClick?: () => void;
}

/**
 * CalAI Design System - Food Item Card with Emojis
 * Horizontal card layout showing food item with macros
 */
export const FoodItemCard: React.FC<FoodItemCardProps> = ({
  name,
  brand,
  calories,
  protein,
  carbs,
  fats,
  imageUrl,
  timestamp,
  onRemove,
  onClick,
}) => {
  const timeLabel = timestamp ? getTimeLabel(timestamp) : null;

  return (
    <div
      className="food-item-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Image or placeholder */}
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="food-item-image" />
      ) : (
        <div className="food-item-image flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 text-white text-2xl font-bold">
          🍽️
        </div>
      )}

      {/* Info section */}
      <div className="food-item-info">
        <h4 className="food-item-name">{name}</h4>
        {brand && <p className="text-xs text-gray-400">{brand}</p>}

        <div className="food-item-calories">
          <span>🔥</span>
          <span>{calories} cal</span>
        </div>

        {(protein !== undefined || carbs !== undefined || fats !== undefined) && (
          <div className="food-item-macros">
            {protein !== undefined && (
              <span>
                <span>⚡</span> {protein}g
              </span>
            )}
            {carbs !== undefined && (
              <span>
                <span>🌾</span> {carbs}g
              </span>
            )}
            {fats !== undefined && (
              <span>
                <span>💧</span> {fats}g
              </span>
            )}
          </div>
        )}
      </div>

      {/* Time and remove button */}
      <div className="flex flex-col items-end gap-2">
        {timeLabel && <div className="food-item-time">{timeLabel}</div>}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="btn-aurora p-1 hover:bg-red-500/20 rounded transition-colors"
            aria-label="Remove item"
          >
            <X size={16} className="text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
};

function getTimeLabel(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return timestamp.toLocaleDateString();
}
