import React from 'react';
import { X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertBoxProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  closeable?: boolean;
  icon?: React.ReactNode;
}

const defaultEmojis: Record<AlertType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

/**
 * CalAI Design System - Alert Box with Emojis
 * Uses CSS classes from App.css for consistent styling
 */
export const AlertBox: React.FC<AlertBoxProps> = ({
  type,
  title,
  message,
  onClose,
  closeable = true,
  icon,
}) => {
  const emoji = icon || defaultEmojis[type];

  return (
    <div className={`alert alert-${type}`}>
      <span className="alert-emoji">{emoji}</span>
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <p className={!title ? 'text-sm' : 'text-sm'}>{message}</p>
      </div>
      {closeable && onClose && (
        <button
          onClick={onClose}
          className="btn-aurora flex-shrink-0 ml-4 p-1 hover:opacity-75 transition-opacity"
          aria-label="Close alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

interface AlertListProps {
  alerts: Array<{
    id: string;
    type: AlertType;
    title?: string;
    message: string;
  }>;
  onRemove: (id: string) => void;
}

/**
 * Container for multiple alerts with auto-stacking
 */
export const AlertList: React.FC<AlertListProps> = ({ alerts, onRemove }) => {
  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <AlertBox
          key={alert.id}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => onRemove(alert.id)}
          closeable={true}
        />
      ))}
    </div>
  );
};
