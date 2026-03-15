import React from 'react';

export interface StatItem {
  label: string;
  value: string | number;
  emoji: string;
}

interface StatsDisplayProps {
  stats: StatItem[];
  title?: string;
  columns?: number;
}

/**
 * CalAI Design System - Stats Display with Emojis
 * Grid layout showing key statistics with emoji indicators
 */
export const StatsDisplay: React.FC<StatsDisplayProps> = ({
  stats,
  title,
  columns = 'auto',
}) => {
  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(150 20% 15%)' }}>
          {title}
        </h3>
      )}
      <div className="stats-container" style={columns !== 'auto' ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {}}>
        {stats.map((stat, index) => (
          <div key={index} className="stat-box">
            <div className="stat-emoji">{stat.emoji}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SingleStatProps {
  label: string;
  value: string | number;
  emoji: string;
  highlight?: boolean;
}

/**
 * Single stat box component
 */
export const StatBox: React.FC<SingleStatProps> = ({ label, value, emoji, highlight }) => {
  return (
    <div className={`stat-box ${highlight ? 'ring-2 ring-green-600' : ''}`}>
      <div className="stat-emoji">{emoji}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};
