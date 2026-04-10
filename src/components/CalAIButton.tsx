import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CalAIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  emoji?: string;
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * CalAI Design System - Button with Optional Emoji
 * Uses CSS classes from App.css for consistent styling
 */
export const CalAIButton = React.forwardRef<HTMLButtonElement, CalAIButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      emoji,
      loading = false,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

    const sizeClass = {
      sm: 'px-3 py-1.5 text-sm gap-2',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2',
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`btn-aurora ${baseClass} ${sizeClass} ${className || ''} ${
          (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        {...props}
      >
        {loading ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            <span>{children}</span>
          </>
        ) : (
          <>
            {emoji && <span>{emoji}</span>}
            <span>{children}</span>
          </>
        )}
      </button>
    );
  }
);

CalAIButton.displayName = 'CalAIButton';

interface ButtonGroupProps {
  children: React.ReactNode;
  gap?: string;
  direction?: 'row' | 'column';
}

/**
 * Group multiple buttons together
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  gap = '1rem',
  direction = 'row',
}) => {
  return (
    <div style={{ display: 'flex', gap, flexDirection: direction === 'column' ? 'column' : 'row' }}>
      {children}
    </div>
  );
};
