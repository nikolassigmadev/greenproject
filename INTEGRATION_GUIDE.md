# CalAI Design System Integration Guide

This guide shows how to integrate the new CalAI design system components into your existing React pages.

## Quick Start

### 1. View the Showcase

Navigate to `/design-system` in your browser to see all components in action.

### 2. Import Components

```tsx
import {
  NutritionDisplay,
  CalorieDisplay,
  MacroBadge,
  FoodItemCard,
  AlertBox,
  StatsDisplay,
  StatBox,
  CalAIButton,
  ButtonGroup,
} from '@/components';
```

### 3. Use in Your Pages

See examples below for common integration patterns.

---

## Integration Examples by Page Type

### Example 1: Food Tracking Dashboard

**Current Status:** Scan.tsx could be enhanced with new components

**Integration Points:**

```tsx
// At the top of your component
import {
  NutritionDisplay,
  AlertBox,
  FoodItemCard,
  StatsDisplay,
  CalAIButton,
} from '@/components';

// In your return JSX, replace old nutrition cards with:

<div className="page-with-nav">
  {/* Daily Summary */}
  <section style={{ marginBottom: '2rem' }}>
    <NutritionDisplay
      calories={totalCalories}
      protein={totalProtein}
      carbs={totalCarbs}
      fats={totalFats}
      showMacros={true}
    />
  </section>

  {/* Food Log */}
  <section style={{ marginBottom: '2rem' }}>
    <h2 style={{ color: 'hsl(210 15% 94%)', marginBottom: '1rem' }}>
      Today's Foods
    </h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {foods.map((food) => (
        <FoodItemCard
          key={food.id}
          name={food.name}
          calories={food.calories}
          protein={food.protein}
          carbs={food.carbs}
          fats={food.fats}
          timestamp={food.timestamp}
          onRemove={() => removeFood(food.id)}
          onClick={() => selectFood(food.id)}
        />
      ))}
    </div>
  </section>

  {/* Daily Stats */}
  <section style={{ marginBottom: '2rem' }}>
    <StatsDisplay
      stats={[
        { label: 'Meals', value: foods.length, emoji: '🍽️' },
        { label: 'Progress', value: `${goalProgress}%`, emoji: '🎯' },
        { label: 'Streak', value: streak, emoji: '🔥' },
      ]}
      title="Daily Stats"
      columns={3}
    />
  </section>

  {/* Action Buttons */}
  <section>
    <ButtonGroup direction="row" gap="1rem">
      <CalAIButton emoji="➕" onClick={addFood}>
        Add Food
      </CalAIButton>
      <CalAIButton variant="secondary" emoji="⚙️">
        Settings
      </CalAIButton>
    </ButtonGroup>
  </section>
</div>
```

### Example 2: Product Search Results Page

**Current Status:** Scan.tsx has OpenFoodFactsCard

**Integration Pattern:**

```tsx
import { AlertBox, StatsDisplay, CalAIButton } from '@/components';

// In your search results section:

{offSearchResults.length > 0 ? (
  <>
    <AlertBox
      type="success"
      message={`Found ${offSearchResults.length} product(s)`}
    />

    <StatsDisplay
      stats={[
        { label: 'Eco-Score A', value: ecoACount, emoji: '♻️' },
        { label: 'Eco-Score B', value: ecoBCount, emoji: '🌱' },
        { label: 'Average Rating', value: avgRating, emoji: '⭐' },
      ]}
      columns={3}
    />

    {/* Your existing product cards */}
    {offSearchResults.map((result) => (
      <OpenFoodFactsCard key={result.barcode} result={result} />
    ))}
  </>
) : (
  <AlertBox
    type="warning"
    message="No products found. Try a different search."
  />
)}
```

### Example 3: Success/Error Feedback

**Pattern for multiple alerts:**

```tsx
import { AlertList } from '@/components';
import { useState } from 'react';

export function MyComponent() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = (type, title, message) => {
    const id = Date.now().toString();
    setAlerts(prev => [...prev, { id, type, title, message }]);
    // Auto-remove after 5 seconds
    setTimeout(() => removeAlert(id), 5000);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div>
      {alerts.length > 0 && (
        <AlertList alerts={alerts} onRemove={removeAlert} />
      )}

      {/* Rest of your component */}
    </div>
  );
}
```

### Example 4: Loading States

**Pattern for async operations:**

```tsx
import { CalAIButton, AlertBox } from '@/components';
import { useState } from 'react';

export function DataFetch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchData();
      // Success - use AlertBox to show confirmation
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <AlertBox
          type="error"
          title="Load Failed"
          message={error}
          onClose={() => setError('')}
        />
      )}

      <CalAIButton
        loading={loading}
        onClick={handleFetch}
        emoji={loading ? '⏳' : '📥'}
      >
        Load Data
      </CalAIButton>
    </div>
  );
}
```

---

## Step-by-Step: Updating Scan.tsx

Here's a practical walkthrough for updating the Scan page:

### Step 1: Add Imports

```tsx
// At the top of src/pages/Scan.tsx
import {
  NutritionDisplay,
  FoodItemCard,
  AlertBox,
  StatsDisplay,
  CalAIButton,
  ButtonGroup,
} from '@/components';
```

### Step 2: Replace Hardcoded Alert UI

**Before:**
```tsx
{offSearchResults.length === 0 && (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
    <p className="text-sm text-amber-800 dark:text-amber-200">
      {offSearchText ? `No products found for "${offSearchText}"` : "Product not found"}
    </p>
  </div>
)}
```

**After:**
```tsx
{offSearchResults.length === 0 && (
  <AlertBox
    type="warning"
    message={offSearchText ? `No products found for "${offSearchText}"` : "Product not found"}
  />
)}
```

### Step 3: Replace Search Buttons

**Before:**
```tsx
<Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-11 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300" disabled={offLoading}>
  {offLoading ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    <Search className="w-4 h-4" />
  )}
</Button>
```

**After:**
```tsx
<CalAIButton
  type="submit"
  emoji="🔍"
  loading={offLoading}
  size="md"
>
  Search
</CalAIButton>
```

### Step 4: Create Summary Statistics

**Add after results:**
```tsx
{offSearchResults.length > 0 && (
  <StatsDisplay
    stats={[
      { label: 'Products Found', value: offSearchResults.length, emoji: '📦' },
      { label: 'Alternatives', value: offAlternatives.length, emoji: '♻️' },
      { label: 'Avg Eco-Score', value: avgScore.toFixed(1), emoji: '🌱' },
    ]}
    columns={3}
  />
)}
```

### Step 5: Use ButtonGroup for Actions

**Before:**
```tsx
<div className="flex gap-2">
  <Button>Primary</Button>
  <Button variant="secondary">Secondary</Button>
</div>
```

**After:**
```tsx
<ButtonGroup gap="1rem" direction="row">
  <CalAIButton emoji="✅" onClick={handleConfirm}>
    Confirm
  </CalAIButton>
  <CalAIButton variant="secondary" emoji="❌" onClick={handleCancel}>
    Cancel
  </CalAIButton>
</ButtonGroup>
```

---

## CSS Classes You Don't Need to Change

✅ All CSS is already in `src/App.css`
✅ Color palette is in `src/index.css`
✅ No Tailwind classes needed for new components
✅ Emojis are built-in

Just focus on:
1. Importing the components
2. Passing props (data)
3. Handling callbacks (onClick, onRemove, etc.)

---

## Common Patterns

### Pattern 1: Conditional Rendering with Alerts

```tsx
{data.length === 0 ? (
  <AlertBox type="info" message="No data available" />
) : (
  <StatsDisplay stats={stats} />
)}
```

### Pattern 2: Form Submission

```tsx
<form onSubmit={async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await submitForm();
    setSuccess(true);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}}>
  {error && <AlertBox type="error" message={error} />}
  {success && <AlertBox type="success" message="Success!" />}

  <input {...formProps} />

  <CalAIButton type="submit" loading={loading} emoji="✅">
    Submit
  </CalAIButton>
</form>
```

### Pattern 3: List with Actions

```tsx
{items.map((item) => (
  <FoodItemCard
    key={item.id}
    name={item.name}
    calories={item.calories}
    onRemove={() => {
      deleteItem(item.id);
      setSuccess('Item removed');
    }}
  />
))}
```

---

## Theming & Customization

All colors come from CSS variables in `src/index.css`. To change the theme:

```css
:root {
  --background: 210 40% 10%;    /* Change from blue to other hue */
  --card: 210 35% 18%;
  --foreground: 210 15% 94%;
  --primary: 38 92% 50%;        /* Orange accent - change if needed */
}
```

The HSL format makes it easy to adjust saturation/lightness:
- First number: Hue (0-360°)
- Second number: Saturation (0-100%)
- Third number: Lightness (0-100%)

For example, to make the theme more green:
```css
--primary: 142 71% 45%;  /* Green instead of orange */
```

---

## Performance Tips

1. **Lazy load components**: Use `React.lazy()` for showcase page
2. **Memoize lists**: Use `React.memo()` for FoodItemCard in long lists
3. **Avoid re-renders**: Use `useCallback()` for onClick handlers
4. **Alert auto-cleanup**: Always set a timeout to remove old alerts

Example:
```tsx
const handleRemove = useCallback((id) => {
  setItems(prev => prev.filter(x => x.id !== id));
}, []);

useEffect(() => {
  if (alerts.length > 0) {
    const timer = setTimeout(() => {
      setAlerts(prev => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }
}, [alerts]);
```

---

## Debugging

### Component not styled?
1. Check that `App.css` is imported in `App.tsx`
2. Verify `index.css` has `:root` variables
3. Open DevTools → Elements tab → Check if CSS classes are applied

### Emojis not showing?
1. Check browser support (modern browsers all support emojis)
2. Verify emoji characters in source file are UTF-8
3. Try copying emoji directly from this guide

### Layout broken?
1. Ensure parent has `className="page-with-nav"` if using bottom nav
2. Check flex/grid containers have proper `gap` values
3. Verify responsive breakpoints aren't conflicting

---

## Next Steps

1. ✅ View the showcase: Visit `/design-system`
2. ✅ Review component guide: Read `CALAI_COMPONENT_GUIDE.md`
3. ✅ Start integration: Pick one page and update with new components
4. ✅ Test thoroughly: Check responsiveness on mobile/desktop
5. ✅ Iterate: Refine colors/spacing based on user feedback

---

## Questions?

Refer to:
- `src/components/` - Source code for each component
- `src/App.css` - CSS class definitions
- `src/components/CalAIShowcase.tsx` - Working examples
- `CALAI_COMPONENT_GUIDE.md` - Detailed API documentation
