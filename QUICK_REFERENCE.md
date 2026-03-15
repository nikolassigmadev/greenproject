# CalAI Design System - Quick Reference Card

## ⚡ 30-Second Setup

```tsx
// 1. Import what you need
import {
  NutritionDisplay, CalorieDisplay, FoodItemCard,
  AlertBox, StatsDisplay, CalAIButton, ButtonGroup
} from '@/components';

// 2. Use in your component
<NutritionDisplay calories={450} protein={25} carbs={55} fats={12} />
<CalAIButton emoji="🔥">Click me</CalAIButton>
```

---

## 📦 Component Cheat Sheet

### Nutrition Display
```tsx
<NutritionDisplay
  calories={450}
  protein={25}
  carbs={55}
  fats={12}
  showMacros={true}
/>
```
**Use:** Main nutrition facts display | **Emojis:** 🔥⚡🌾💧

### Calorie Display (Large)
```tsx
<CalorieDisplay
  calories={450}
  showLabel={true}
  animated={true}
/>
```
**Use:** Prominent calorie metric | **Emoji:** 🔥 (animated)

### Macro Badge
```tsx
<MacroBadge type="protein" value={25} />
<MacroBadge type="carbs" value={55} />
<MacroBadge type="fats" value={12} />
```
**Use:** Individual macro display | **Emojis:** ⚡🌾💧

### Food Item Card
```tsx
<FoodItemCard
  name="Salmon"
  calories={450}
  protein={35}
  carbs={0}
  fats={28}
  timestamp={new Date()}
  onRemove={() => deleteItem()}
  onClick={() => selectItem()}
/>
```
**Use:** Food list items | **Emojis:** 🔥⚡🌾💧

### Alert Box
```tsx
<AlertBox
  type="success|error|warning|info"
  title="Optional Title"
  message="Your message here"
  onClose={() => clearAlert()}
  closeable={true}
/>
```
**Use:** Status messages | **Emojis:** ✅❌⚠️ℹ️

### Alert List
```tsx
<AlertList
  alerts={alerts}
  onRemove={(id) => setAlerts(...)}
/>
```
**Use:** Multiple alerts | **Emojis:** ✅❌⚠️ℹ️

### Stats Display
```tsx
<StatsDisplay
  stats={[
    { label: 'Calories', value: '450', emoji: '🔥' },
    { label: 'Protein', value: '25g', emoji: '⚡' },
    { label: 'Carbs', value: '55g', emoji: '🌾' },
  ]}
  title="Daily Summary"
  columns={3}
/>
```
**Use:** Multiple stats grid | **Emojis:** Custom (any)

### Stat Box (Single)
```tsx
<StatBox
  label="Goal Progress"
  value="75%"
  emoji="🎯"
  highlight={true}
/>
```
**Use:** Individual stat | **Emoji:** Custom

### Button
```tsx
<CalAIButton
  variant="primary|secondary"
  size="sm|md|lg"
  emoji="🔥"
  loading={false}
  onClick={() => handleClick()}
>
  Button Text
</CalAIButton>
```
**Variants:** primary (orange), secondary (dark) | **Sizes:** sm, md (default), lg

### Button Group
```tsx
<ButtonGroup direction="row|column" gap="1rem">
  <CalAIButton emoji="✅">Yes</CalAIButton>
  <CalAIButton emoji="❌">No</CalAIButton>
</ButtonGroup>
```
**Use:** Layout multiple buttons | **Directions:** row (default), column

---

## 🎨 Colors (Copy/Paste HSL)

```
Background:    hsl(210 40% 10%)    #1a2332
Card:          hsl(210 35% 18%)    #202d42
Text:          hsl(210 15% 94%)    #f0f4f8
Muted:         hsl(210 15% 63%)    (gray)
Primary:       hsl(38 92% 50%)     #f97316 (orange)
Red:           hsl(0 84% 60%)
Green:         hsl(142 71% 45%)
Amber:         hsl(45 93% 47%)
```

---

## 🚀 Common Patterns

### Success Alert + Action
```tsx
{success && (
  <AlertBox type="success" message="Done!" onClose={clearSuccess} />
)}
<CalAIButton loading={loading} onClick={handleSave}>
  Save
</CalAIButton>
```

### Loading State
```tsx
<CalAIButton loading={loading} emoji={loading ? '⏳' : '📥'}>
  {loading ? 'Processing...' : 'Download'}
</CalAIButton>
```

### Conditional Display
```tsx
{items.length > 0 ? (
  <StatsDisplay stats={[...]} />
) : (
  <AlertBox type="info" message="No items yet" />
)}
```

### Form with Alerts
```tsx
{error && <AlertBox type="error" message={error} />}
{success && <AlertBox type="success" message="Saved!" />}

<input value={value} onChange={handleChange} />

<ButtonGroup>
  <CalAIButton loading={loading} onClick={submit}>Submit</CalAIButton>
  <CalAIButton variant="secondary" onClick={reset}>Reset</CalAIButton>
</ButtonGroup>
```

### List with Remove
```tsx
{foods.map(food => (
  <FoodItemCard
    key={food.id}
    {...food}
    onRemove={() => {
      deleteFood(food.id);
      showAlert('Removed');
    }}
  />
))}
```

---

## 📋 Emoji Reference

### Nutrition
| Emoji | Meaning |
|-------|---------|
| 🔥 | Calories |
| ⚡ | Protein |
| 🌾 | Carbs |
| 💧 | Fats |
| 🥗 | Nutrition/Diet |
| 🍽️ | Food/Meal |

### Status
| Emoji | Meaning |
|-------|---------|
| ✅ | Success |
| ❌ | Error |
| ⚠️ | Warning |
| ℹ️ | Info |
| ⏳ | Loading |
| 🎯 | Goal/Target |

### Actions
| Emoji | Meaning |
|-------|---------|
| 🔍 | Search |
| ➕ | Add |
| ❌ | Remove/Delete |
| 💾 | Save |
| 🔄 | Refresh |
| ⚙️ | Settings |

### Other
| Emoji | Meaning |
|-------|---------|
| 🌱 | Eco/Green |
| ♻️ | Recycling/Alternative |
| 📦 | Product |
| 📊 | Analytics |
| 🏠 | Home |
| 🍽️ | Food/Dining |

---

## 🎯 Tips & Tricks

### Tip 1: Keep Consistent Emoji Usage
Always use 🔥 for calories, never 💡 or 🌟

### Tip 2: Use MacroBadge in Small Spaces
```tsx
<div style={{ display: 'flex', gap: '0.5rem' }}>
  <MacroBadge type="protein" value={25} />
  <MacroBadge type="carbs" value={55} />
</div>
```

### Tip 3: Auto-Dismiss Alerts
```tsx
setTimeout(() => setAlert(null), 5000);  // Clear after 5 seconds
```

### Tip 4: Group Related Buttons
```tsx
<ButtonGroup gap="0.5rem" direction="row">
  <CalAIButton size="sm">Yes</CalAIButton>
  <CalAIButton size="sm" variant="secondary">No</CalAIButton>
</ButtonGroup>
```

### Tip 5: Use StatsDisplay for Overview
Great for dashboard, status, or summary views. Perfect for 3-6 stats.

---

## ❌ Don't Do This

```tsx
// ❌ Don't: Mix custom colors with components
<NutritionDisplay calories={450} style={{ color: 'red' }} />

// ❌ Don't: Use wrong emoji types
<MacroBadge type="calories" value={450} />  // No "calories" type

// ❌ Don't: Forget to import components
<AlertBox ... />  // Import first!

// ❌ Don't: Hardcode colors
<div style={{ backgroundColor: 'hsl(38 92% 50%)' }}>  // Use CSS class instead

// ❌ Don't: Put too many items in a ButtonGroup
<ButtonGroup>
  <Button>1</Button><Button>2</Button>...<Button>10</Button>  // Too many
</ButtonGroup>
```

---

## ✅ Do This Instead

```tsx
// ✅ Do: Import at top
import { NutritionDisplay, CalAIButton } from '@/components';

// ✅ Do: Use correct props
<NutritionDisplay calories={450} protein={25} carbs={55} fats={12} />

// ✅ Do: Use consistent emojis
<StatsDisplay stats={[
  { label: 'Calories', value: '450', emoji: '🔥' },
  { label: 'Protein', value: '25g', emoji: '⚡' },
]} />

// ✅ Do: Handle events properly
<CalAIButton onClick={() => {
  saveData();
  showAlert('Saved!');
}}>
  Save
</CalAIButton>

// ✅ Do: Use CSS classes for styling
<div className="page-with-nav">
  {/* Your content */}
</div>
```

---

## 🔗 Quick Links

| Document | Purpose |
|----------|---------|
| CALAI_COMPONENT_GUIDE.md | Full API reference |
| INTEGRATION_GUIDE.md | Step-by-step tutorials |
| CALAI_IMPLEMENTATION_STATUS.md | Project status & roadmap |
| src/components/CalAIShowcase.tsx | Live examples (/design-system) |
| src/App.css | All CSS classes |
| src/index.css | Color variables |

---

## 🚀 Get Started Now

1. **View Examples:** Go to `/design-system` in your browser
2. **Pick a Component:** Choose one to integrate
3. **Copy & Paste:** Use a pattern from this guide
4. **Test Locally:** Run `npm run dev` and check your page
5. **Commit:** Add your changes with `git add . && git commit -m "..."`

---

**Reference:** CalAI Design System v1.0
**Updated:** March 15, 2026
**Status:** Production Ready
**9 Components:** Ready to use ✅
