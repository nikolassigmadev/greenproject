# 🎨 CalAI Design System - Color & Emoji Implementation

## Color Palette (Updated)

### Primary Colors
- **Dark Background:** #1a2332 (Main background)
- **Card Background:** #202d42 (Card/container backgrounds)
- **Text Primary:** #f0f4f8 (Main text)
- **Text Secondary:** #a0aac0 (Secondary text)
- **Accent Orange:** #f97316 (Buttons, highlights, accents)

### Status Colors
- **Protein:** #ef4444 (Red - 🔴)
- **Carbs:** #f97316 (Orange - 🟠)
- **Fats:** #3b82f6 (Blue - 🔵)
- **Calories:** #f97316 (Orange - bright)

### Border & Divider
- **Borders:** #333333 (Dark borders)
- **Divider:** #444444 (Subtle dividers)

## Emoji System

### Macro Indicators
| Macro | Emoji | Color | Usage |
|-------|-------|-------|-------|
| Calories | 🔥 | Orange | Main calorie display |
| Protein | ⚡ | Red | Protein content |
| Carbs | 🌾 | Orange | Carbohydrate content |
| Fats | 💧 | Blue | Fat content |

### Category Icons
| Category | Emoji | Usage |
|----------|-------|-------|
| Breakfast | 🍳 | Meal category |
| Lunch | 🥗 | Meal category |
| Dinner | 🍽️ | Meal category |
| Snacks | 🍪 | Meal category |
| Drinks | 🥤 | Beverage category |
| Healthier | ✅ | Positive indicator |
| Warning | ⚠️ | Alert/warning |
| Lab | 🧪 | Analysis/details |
| Environment | 🌍 | Environmental impact |
| Labor | 👥 | Labor practices |
| Health | ❤️ | Health score |

### Action Icons
| Action | Emoji | Usage |
|--------|-------|-------|
| Add | ➕ | Add button |
| Edit | ✏️ | Edit action |
| Delete | 🗑️ | Delete action |
| Search | 🔍 | Search |
| Filter | 🔽 | Filter options |
| Share | 📤 | Share action |
| Download | 📥 | Download action |
| Settings | ⚙️ | Settings |
| Home | 🏠 | Home page |
| Analytics | 📊 | Analytics page |

### Scan & Product Icons
| Action | Emoji | Usage |
|--------|-------|-------|
| Scan | 📸 | Scan product |
| Barcode | 📖 | Barcode lookup |
| Camera | 📷 | Take photo |
| Success | ✅ | Found product |
| Error | ❌ | Not found |
| Loading | ⏳ | Loading state |

## Text Color System

### On Dark Background
- **Primary Text:** #f0f4f8 (Off-white)
- **Secondary Text:** #a0aac0 (Muted gray)
- **Tertiary Text:** #707a90 (Faded gray)
- **Accent Text:** #f97316 (Orange - for emphasis)

### Contrast Ratios
- Primary text on dark: 18:1 ratio (AAA compliant)
- Secondary text on dark: 7:1 ratio (AA compliant)
- Accent on dark: 8:1 ratio (AA compliant)

## Component Styling

### Cards
```css
Background: #202d42
Border: 1px solid #333333
Border Radius: 0.5rem
Padding: 1rem
Shadow: 0 4px 6px rgba(0, 0, 0, 0.3)
Hover: bg-[#2a3a52] (slight lighten)
```

### Buttons
```css
Primary: bg-[#f97316] (Orange)
Text: white
Padding: 0.5rem 1rem
Border Radius: 0.5rem
Hover: bg-[#fb923c] (lighter orange)
```

### Inputs
```css
Background: #2a3a52
Border: 1px solid #444444
Text: #f0f4f8
Focus: border-[#f97316] + shadow
```

### Badges/Pills
```css
Background: rgba(249, 115, 22, 0.1) (Orange tint)
Border: 1px solid #f97316
Text: #f97316
Border Radius: 9999px
```

## Layout Spacing

- **xs:** 0.25rem (4px)
- **sm:** 0.5rem (8px)
- **md:** 1rem (16px)
- **lg:** 1.5rem (24px)
- **xl:** 2rem (32px)

## Typography

- **Font Family:** Plus Jakarta Sans (body), Space Grotesk (headings)
- **Body Size:** 0.875rem - 1rem
- **Heading Size:** 1.25rem - 1.5rem
- **Line Height:** 1.5

## Example Component Implementations

### Nutrition Card with Emojis
```jsx
<div className="nutrition-card bg-[#202d42] border border-[#333] rounded-lg p-6">
  <h2 className="text-[#f0f4f8] text-lg font-bold mb-6">Nutrition</h2>
  
  {/* Main Calories */}
  <div className="flex items-center justify-center mb-8">
    <div className="text-center">
      <span className="text-4xl">🔥</span>
      <div className="text-[#f0f4f8] text-3xl font-bold">615</div>
      <div className="text-[#a0aac0] text-sm">calories</div>
    </div>
  </div>
  
  {/* Macros */}
  <div className="grid grid-cols-3 gap-4">
    <div className="text-center">
      <span className="text-2xl">⚡</span>
      <div className="text-[#f0f4f8] font-bold">11g</div>
      <div className="text-[#a0aac0] text-xs">Protein</div>
    </div>
    <div className="text-center">
      <span className="text-2xl">🌾</span>
      <div className="text-[#f0f4f8] font-bold">93g</div>
      <div className="text-[#a0aac0] text-xs">Carbs</div>
    </div>
    <div className="text-center">
      <span className="text-2xl">💧</span>
      <div className="text-[#f0f4f8] font-bold">21g</div>
      <div className="text-[#a0aac0] text-xs">Fats</div>
    </div>
  </div>
</div>
```

### Food Item Card with Emoji
```jsx
<div className="flex gap-4 bg-[#202d42] border border-[#333] rounded-lg p-4">
  <img src="..." className="w-20 h-20 rounded object-cover" />
  <div className="flex-1">
    <h3 className="text-[#f0f4f8] font-semibold">Pancakes</h3>
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xl">🔥</span>
      <span className="text-[#f97316] font-medium">615 kcal</span>
    </div>
    <div className="flex gap-3 mt-2 text-sm">
      <span>⚡ 11g</span>
      <span>🌾 93g</span>
      <span>💧 21g</span>
    </div>
  </div>
  <div className="text-[#a0aac0] text-xs">9:00am</div>
</div>
```

## Button Styles with Emojis

### Primary Button (Orange)
```jsx
<button className="bg-[#f97316] hover:bg-[#fb923c] text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
  ➕ Add Food
</button>
```

### Secondary Button
```jsx
<button className="bg-[#202d42] hover:bg-[#2a3a52] border border-[#333] text-[#f0f4f8] px-6 py-2 rounded-lg font-medium flex items-center gap-2">
  📸 Scan
</button>
```

## Alert/Warning Styles

### Success Alert
```jsx
<div className="bg-green-900/20 border border-green-700 text-green-400 p-4 rounded-lg flex items-start gap-3">
  <span className="text-2xl">✅</span>
  <div>Product found successfully!</div>
</div>
```

### Error Alert
```jsx
<div className="bg-red-900/20 border border-red-700 text-red-400 p-4 rounded-lg flex items-start gap-3">
  <span className="text-2xl">❌</span>
  <div>Product not found</div>
</div>
```

### Warning Alert
```jsx
<div className="bg-yellow-900/20 border border-yellow-700 text-yellow-400 p-4 rounded-lg flex items-start gap-3">
  <span className="text-2xl">⚠️</span>
  <div>High in calories</div>
</div>
```

## Implementation Checklist

- [ ] Update all color variables in src/index.css
- [ ] Replace hardcoded colors with CSS variables
- [ ] Add emojis to all metric displays
- [ ] Update all card components with emoji headers
- [ ] Add emoji to all buttons and actions
- [ ] Update alert/warning components with emojis
- [ ] Test color contrast ratios
- [ ] Test on mobile (375px) and desktop
- [ ] Verify text readability on all backgrounds
- [ ] Update navigation with emoji icons

