# CalAI Design System Component Guide

## Overview

The CalAI design system provides a complete set of emoji-integrated React components built on a dark theme color palette. All components use CSS classes defined in `src/App.css`.

## Color Palette

```
Background:   hsl(210 40% 10%)   #1a2332  - Dark blue-gray
Card:         hsl(210 35% 18%)   #202d42  - Slightly lighter card background
Foreground:   hsl(210 15% 94%)   #f0f4f8  - Off-white text
Primary:      hsl(38 92% 50%)    #f97316  - Orange accent
Text Muted:   hsl(210 15% 63%)   -        - Gray text
```

## Components

### 1. NutritionDisplay

Display nutrition facts with visual calorie and macro breakdown.

**Features:**
- 🔥 Fire emoji for calories
- ⚡ Lightning emoji for protein
- 🌾 Grain emoji for carbohydrates
- 💧 Water droplet emoji for fats
- Auto-responsive grid layout

**Usage:**

```tsx
import { NutritionDisplay } from '@/components';

// Full nutrition display
<NutritionDisplay
  calories={450}
  protein={25}
  carbs={55}
  fats={12}
  showMacros={true}
/>

// Calories only
<NutritionDisplay calories={450} showMacros={false} />
```

### 2. MacroBadge

Individual macro nutrient badge with colored borders.

**Usage:**

```tsx
import { MacroBadge } from '@/components';

<div style={{ display: 'flex', gap: '1rem' }}>
  <MacroBadge type="protein" value={25} />
  <MacroBadge type="carbs" value={55} />
  <MacroBadge type="fats" value={12} />
</div>
```

### 3. CalorieDisplay

Large animated calorie display with floating fire emoji.

**Features:**
- Floating animation with `animation: float 2s ease-in-out infinite`
- Large, prominent number display
- Optional label below number

**Usage:**

```tsx
import { CalorieDisplay } from '@/components';

// With animation (default)
<CalorieDisplay calories={450} animated={true} showLabel={true} />

// Without animation
<CalorieDisplay calories={450} animated={false} />
```

### 4. FoodItemCard

Horizontal card displaying a food item with macros and timestamp.

**Features:**
- Image or emoji placeholder
- Calorie display with 🔥 emoji
- Macro breakdown with emojis
- Timestamp (relative: "5m ago", "2h ago", etc.)
- Remove button with callback
- Click handler for selection
- Responsive layout

**Usage:**

```tsx
import { FoodItemCard } from '@/components';

<FoodItemCard
  name="Grilled Salmon"
  brand="Atlantic Catch"
  calories={450}
  protein={35}
  carbs={0}
  fats={28}
  imageUrl="https://..."
  timestamp={new Date()}
  onClick={() => console.log('clicked')}
  onRemove={() => console.log('removed')}
/>
```

### 5. AlertBox & AlertList

Status messages with emoji indicators and auto-dismiss functionality.

**Types:**
- `success` ✅ - Green background
- `error` ❌ - Red background
- `warning` ⚠️ - Yellow background
- `info` ℹ️ - Blue background

**Usage:**

```tsx
import { AlertBox, AlertList } from '@/components';
import { useState } from 'react';

// Single alert
<AlertBox
  type="success"
  title="Success!"
  message="Action completed successfully"
  onClose={() => console.log('closed')}
  closeable={true}
/>

// Alert list (with removal handler)
const [alerts, setAlerts] = useState([
  { id: '1', type: 'success', title: 'Success', message: 'Done!' }
]);

<AlertList
  alerts={alerts}
  onRemove={(id) => setAlerts(a => a.filter(x => x.id !== id))}
/>
```

### 6. StatsDisplay

Grid layout for displaying multiple statistics with emoji labels.

**Features:**
- Auto-responsive grid
- Large emoji icons
- Configurable columns
- Optional title
- Orange-colored values

**Usage:**

```tsx
import { StatsDisplay, StatBox } from '@/components';

// Grid of stats
<StatsDisplay
  stats={[
    { label: 'Total Calories', value: '2150', emoji: '🔥' },
    { label: 'Protein', value: '125g', emoji: '⚡' },
    { label: 'Carbs', value: '280g', emoji: '🌾' },
  ]}
  title="Daily Summary"
  columns={3}
/>

// Individual stat (with optional highlight)
<StatBox
  label="Goal Progress"
  value="75%"
  emoji="🎯"
  highlight={true}
/>
```

### 7. CalAIButton

Primary and secondary buttons with optional emoji icons.

**Variants:**
- `primary` - Orange background (default)
- `secondary` - Dark background with border

**Sizes:**
- `sm` - Small (used in lists)
- `md` - Medium (default, general use)
- `lg` - Large (prominent actions)

**Features:**
- Optional emoji prefix
- Loading state with animated emoji
- Disabled state with reduced opacity
- Smooth hover and active animations

**Usage:**

```tsx
import { CalAIButton, ButtonGroup } from '@/components';

// Single button with emoji
<CalAIButton emoji="🔥" variant="primary" size="md">
  Start Workout
</CalAIButton>

// Secondary button
<CalAIButton variant="secondary" emoji="❌">
  Cancel
</CalAIButton>

// Loading state
<CalAIButton loading={true}>
  Processing...
</CalAIButton>

// Grouped buttons
<ButtonGroup direction="row" gap="1rem">
  <CalAIButton emoji="✅">Confirm</CalAIButton>
  <CalAIButton variant="secondary" emoji="❌">Cancel</CalAIButton>
</ButtonGroup>

// Vertical group
<ButtonGroup direction="column" gap="0.5rem">
  <CalAIButton>Option 1</CalAIButton>
  <CalAIButton>Option 2</CalAIButton>
</ButtonGroup>
```

## CSS Classes Reference

All components use these CSS classes from `App.css`:

### Nutrition Cards
- `.nutrition-card` - Main container
- `.nutrition-header` - Header with emoji and title
- `.nutrition-header-emoji` - Large emoji icon
- `.calories-main` - Calorie display section
- `.calories-emoji` - Animated fire emoji
- `.calories-number` - Large calorie number
- `.calories-label` - "kcal" text
- `.macros-grid` - 3-column grid layout
- `.macro-item` - Individual macro item
- `.macro-emoji` - Emoji for macro type
- `.macro-value` - Numeric value
- `.macro-name` - "Protein", "Carbs", "Fats" text

### Food Item Cards
- `.food-item-card` - Main card container
- `.food-item-image` - Product image (5rem × 5rem)
- `.food-item-info` - Text content area
- `.food-item-name` - Product name
- `.food-item-calories` - Calorie display with emoji
- `.food-item-macros` - Macro breakdown
- `.food-item-time` - Timestamp

### Alerts
- `.alert` - Base container
- `.alert-emoji` - Large emoji indicator
- `.alert-success` - Green styling
- `.alert-error` - Red styling
- `.alert-warning` - Yellow/amber styling

### Buttons
- `.btn-primary` - Orange button (default state)
- `.btn-primary:hover` - Hover state with shadow
- `.btn-primary:active` - Click state
- `.btn-secondary` - Dark button with border
- `.btn-secondary:hover` - Hover with orange border

### Statistics
- `.stats-container` - Grid container (auto 3-column)
- `.stat-box` - Individual stat item
- `.stat-emoji` - Large emoji (2rem)
- `.stat-value` - Orange number value
- `.stat-label` - Gray label text

### Typography & Common
- `.nutrition-header`, `.food-item-name`, `.stat-value` - Font sizes and colors
- `.calories-label`, `.macro-name`, `.stat-label` - Secondary text styling
- All use HSL color system for consistency

## Integration Examples

### Example 1: Nutrition Dashboard Page

```tsx
import { NutritionDisplay, StatsDisplay, CalorieDisplay } from '@/components';

export const NutritionDashboard = () => {
  return (
    <div className="page-with-nav">
      <CalorieDisplay calories={1850} />

      <NutritionDisplay
        calories={1850}
        protein={95}
        carbs={220}
        fats={65}
      />

      <StatsDisplay
        stats={[
          { label: 'Breakfast', value: '450', emoji: '🥐' },
          { label: 'Lunch', value: '650', emoji: '🥗' },
          { label: 'Dinner', value: '750', emoji: '🍽️' },
        ]}
        title="Meals"
        columns={3}
      />
    </div>
  );
};
```

### Example 2: Food Log with History

```tsx
import { FoodItemCard, AlertBox } from '@/components';
import { useState } from 'react';

export const FoodLog = () => {
  const [foods, setFoods] = useState([/* ... */]);
  const [removed, setRemoved] = useState(false);

  return (
    <div>
      {removed && (
        <AlertBox
          type="success"
          message="Item removed from log"
          onClose={() => setRemoved(false)}
        />
      )}

      {foods.map((food) => (
        <FoodItemCard
          key={food.id}
          {...food}
          onRemove={() => {
            setFoods(f => f.filter(x => x.id !== food.id));
            setRemoved(true);
          }}
        />
      ))}
    </div>
  );
};
```

### Example 3: Action Buttons with Loading

```tsx
import { CalAIButton, ButtonGroup, AlertBox } from '@/components';
import { useState } from 'react';

export const SubmitForm = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // API call
      setMessage('Success!');
    } catch {
      setMessage('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {message && (
        <AlertBox
          type={message.includes('Error') ? 'error' : 'success'}
          message={message}
          onClose={() => setMessage('')}
        />
      )}

      <ButtonGroup>
        <CalAIButton
          emoji="✅"
          loading={loading}
          onClick={handleSubmit}
        >
          Submit
        </CalAIButton>
        <CalAIButton variant="secondary" emoji="❌" disabled={loading}>
          Cancel
        </CalAIButton>
      </ButtonGroup>
    </div>
  );
};
```

## Animation Classes

Available animations defined in `App.css`:

```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
```

## Best Practices

1. **Consistency**: Use the same components across similar UI elements
2. **Emoji Usage**:
   - 🔥 for calories/energy
   - ⚡ for protein/strength
   - 🌾 for carbs/energy
   - 💧 for fats/hydration
   - ✅ for success/positive
   - ❌ for errors/negative
   - ⚠️ for warnings

3. **Dark Theme**: All components assume dark background. Don't override colors.
4. **Spacing**: Use consistent gaps (0.5rem, 1rem, 1.5rem, 2rem)
5. **Responsive**: Components use flexbox/grid for automatic responsiveness
6. **Performance**: Avoid excessive emoji animations on the same page

## Customization

To customize colors, edit the `:root` variables in `src/index.css`:

```css
:root {
  --background: 210 40% 10%;      /* Main background */
  --card: 210 35% 18%;            /* Card backgrounds */
  --foreground: 210 15% 94%;      /* Text color */
  --primary: 38 92% 50%;          /* Orange accent */
  /* ... other variables */
}
```

## Troubleshooting

**Components not styled?**
- Ensure `App.css` is imported in your main app file
- Check that `index.css` has the `:root` color variables defined

**Emojis not displaying?**
- Verify emoji characters are UTF-8 encoded
- Test in different browsers (Chrome, Firefox, Safari all support modern emojis)

**Colors look different?**
- Check your monitor's color profile
- The color palette uses HSL for consistency across all components

## See Also

- `src/App.css` - Complete CSS class definitions
- `src/components/CalAIShowcase.tsx` - Interactive component demo
- `src/index.css` - Theme color variables
