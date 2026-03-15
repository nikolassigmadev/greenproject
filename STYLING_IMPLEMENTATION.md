# 🎨 CalAI Styling Implementation - Exact Changes

## File 1: src/index.css

Replace the `:root` color variables section with:

```css
@root {
  /* CalAI Dark Theme */
  --background: 210 40% 12%;           /* Very dark blue-gray #1a2332 */
  --foreground: 210 20% 95%;           /* Off-white #f0f4f8 */

  --card: 210 35% 20%;                 /* Dark card #202d42 */
  --card-foreground: 210 20% 95%;      /* Light text */

  --popover: 210 35% 20%;
  --popover-foreground: 210 20% 95%;

  /* Orange primary accent (like CalAI) */
  --primary: 38 92% 50%;               /* Orange #f97316 */
  --primary-foreground: 210 40% 12%;   /* Dark on orange */

  /* Dark secondary */
  --secondary: 210 35% 20%;
  --secondary-foreground: 210 20% 95%;

  /* Muted colors for dark theme */
  --muted: 210 20% 40%;                /* Muted text color */
  --muted-foreground: 210 20% 70%;     /* Lighter muted */

  /* Accent color (same as primary) */
  --accent: 38 92% 50%;                /* Orange */
  --accent-foreground: 210 40% 12%;

  --destructive: 0 72% 51%;
  --destructive-foreground: 210 40% 12%;

  --border: 210 30% 35%;               /* Dark borders */
  --input: 210 30% 35%;                /* Dark inputs */
  --ring: 38 92% 50%;                  /* Orange ring focus */

  --radius: 0.5rem;

  /* Extended color palette */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;

  /* Named colors for visualization */
  --color-protein: 0 84% 60%;          /* Red #ef4444 */
  --color-carbs: 38 92% 50%;           /* Orange #f97316 */
  --color-fats: 217 91% 60%;           /* Blue #3b82f6 */
  --color-success: 142 71% 45%;        /* Green #22c55e */
}
```

## File 2: src/App.css

Add these new utility classes:

```css
/* Dark mode styling */
body {
  @apply bg-[#1a2332] text-[#f0f4f8];
}

/* Circular Progress Indicator Base */
.circular-progress {
  @apply relative flex items-center justify-center;
}

.circular-progress-bg {
  @apply absolute inset-0 rounded-full bg-[#202d42];
}

.circular-progress-circle {
  @apply absolute inset-0;
}

.circular-progress-text {
  @apply relative z-10 flex flex-col items-center justify-center;
}

/* Nutrition Card Styles */
.nutrition-card {
  @apply bg-[#202d42] rounded-lg p-6 border border-[#333]/50;
}

/* Macro Ring Styles */
.macro-ring {
  @apply relative flex items-center justify-center rounded-full bg-[#202d42] border-4;
}

.macro-ring.protein {
  @apply border-red-500;
}

.macro-ring.carbs {
  @apply border-orange-500;
}

.macro-ring.fats {
  @apply border-blue-500;
}

/* Food Item Card */
.food-item-card {
  @apply flex gap-4 bg-[#202d42] rounded-lg p-4 border border-[#333]/50 hover:border-[#444]/50 transition;
}

.food-item-image {
  @apply w-20 h-20 rounded object-cover flex-shrink-0;
}

.food-item-info {
  @apply flex-1;
}

.food-item-name {
  @apply text-white font-semibold text-sm;
}

.food-item-calories {
  @apply text-orange-500 font-medium text-sm mt-1;
}

.food-item-macros {
  @apply flex gap-3 mt-2 text-xs text-gray-300;
}

.food-item-time {
  @apply text-xs text-gray-500 flex-shrink-0;
}

/* Bottom Navigation */
.bottom-nav {
  @apply fixed bottom-0 left-0 right-0 bg-[#0f1823] border-t border-[#333];
}

.nav-item {
  @apply flex flex-col items-center justify-center py-4 text-gray-400 hover:text-white transition;
}

.nav-item.active {
  @apply text-orange-500;
}

.nav-icon {
  @apply text-xl mb-1;
}

.nav-label {
  @apply text-xs;
}

/* Floating Action Button */
.fab {
  @apply fixed bottom-24 right-6 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg hover:bg-orange-600 active:bg-orange-700 transition;
}

/* Page Padding (for fixed nav) */
.page-with-nav {
  @apply pb-20;
}

/* Dark Card Hover Effect */
.card-dark {
  @apply bg-[#202d42] hover:bg-[#2a3a52] transition rounded-lg border border-[#333]/50;
}

/* Orange Accent Text */
.text-accent {
  @apply text-orange-500;
}

/* Subtle divider */
.divider {
  @apply bg-[#333]/50 h-px;
}

/* Skeleton loading state */
.skeleton {
  @apply bg-[#2a3a52] rounded animate-pulse;
}
```

## File 3: Component-Specific Updates

### ProductCard.tsx styling changes

**Change from:**
```jsx
<div className="bg-white shadow rounded-lg p-4">
```

**Change to:**
```jsx
<div className="food-item-card">
  <img src={...} className="food-item-image" />
  <div className="food-item-info">
    <h3 className="food-item-name">{productName}</h3>
    <div className="food-item-calories">🔥 {calories} kcal</div>
    <div className="food-item-macros">
      <span>⚡ {protein}g</span>
      <span>🌾 {carbs}g</span>
      <span>💧 {fats}g</span>
    </div>
  </div>
  <div className="food-item-time">{time}</div>
</div>
```

### Nutrition Display Component

**Add circular progress for calories:**
```jsx
<div className="nutrition-card">
  <h2 className="text-white text-lg font-bold mb-8">Nutrition</h2>
  
  {/* Main Calories Circle */}
  <div className="circular-progress w-40 h-40 mx-auto mb-12">
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="3"/>
      <circle cx="50" cy="50" r="45" fill="none" stroke="#f97316" strokeWidth="3"
              strokeDasharray="282.7" strokeDashoffset={getProgress(calories)} />
    </svg>
    <div className="circular-progress-text">
      <span className="text-4xl font-bold text-white">{calories}</span>
      <span className="text-xs text-gray-400">calories</span>
    </div>
  </div>
  
  {/* Macro Rings */}
  <div className="grid grid-cols-3 gap-4">
    <div className="macro-ring protein w-24 h-24">
      <div className="text-center">
        <div className="text-white font-bold">{protein}g</div>
        <div className="text-xs text-gray-400">Protein</div>
      </div>
    </div>
    <div className="macro-ring carbs w-24 h-24">
      <div className="text-center">
        <div className="text-white font-bold">{carbs}g</div>
        <div className="text-xs text-gray-400">Carbs</div>
      </div>
    </div>
    <div className="macro-ring fats w-24 h-24">
      <div className="text-center">
        <div className="text-white font-bold">{fats}g</div>
        <div className="text-xs text-gray-400">Fats</div>
      </div>
    </div>
  </div>
</div>
```

### Layout Wrapper Updates

**Change main page layout:**
```jsx
<div className="page-with-nav bg-[#1a2332] min-h-screen">
  {/* Page content */}
</div>

{/* Bottom Navigation */}
<nav className="bottom-nav">
  <a href="/" className="nav-item">
    <span className="nav-icon">🏠</span>
    <span className="nav-label">Home</span>
  </a>
  {/* Other nav items */}
</nav>

{/* Floating Action Button */}
<button className="fab">+</button>
```

## Summary of Changes

### Color Changes
- Background: Light cream → Dark blue-gray (#1a2332)
- Cards: White → Dark slate (#202d42)
- Text: Dark → Off-white (#f0f4f8)
- Accents: Forest green → Orange (#f97316)
- Border: Light gray → Dark gray (#333)

### Layout Changes
- Navigation: Top → Bottom (fixed)
- Cards: Vertical → Horizontal (compact)
- Nutrition display: Text list → Circular indicators
- Spacing: Generous → Tight/compact

### Typography Changes
- Text colors: Dark → Light (for dark background)
- Font sizes: Slightly smaller for mobile
- Font weights: Same (Plus Jakarta Sans and Space Grotesk)

### Component Changes
- Product cards: Large → Compact horizontal
- Macro display: Text → Circular rings
- Calories display: Simple → Large circular indicator
- Action button: Hidden → Floating orange button
- Navigation: Header/scattered → Bottom bar

## Testing Checklist

- [ ] Dark background looks correct
- [ ] Text is readable on dark background
- [ ] Orange accents pop against dark background
- [ ] Circular indicators render properly
- [ ] Hover effects work on cards
- [ ] Bottom navigation is accessible
- [ ] FAB doesn't obscure content
- [ ] Responsive on mobile (375px)
- [ ] Responsive on tablet (768px)
- [ ] No layout shifts on scroll
- [ ] All content is accessible

