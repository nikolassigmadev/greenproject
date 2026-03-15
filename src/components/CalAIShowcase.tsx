/**
 * CalAI Design System Component Showcase
 *
 * This file demonstrates all the emoji-integrated components from the CalAI design system.
 * Use it as a reference for implementing the new components across your application.
 *
 * Import individual components as needed:
 * - NutritionDisplay: Show nutrition facts with calorie emoji
 * - FoodItemCard: Horizontal card for food items with macros
 * - AlertBox: Status messages with emoji indicators
 * - StatsDisplay: Grid of statistics with emoji labels
 * - CalAIButton: Buttons with optional emoji icons
 */

import React, { useState } from 'react';
import { NutritionDisplay, MacroBadge, CalorieDisplay } from './NutritionDisplay';
import { FoodItemCard } from './FoodItemCard';
import { AlertBox, AlertList } from './AlertBox';
import { StatsDisplay, StatBox } from './StatsDisplay';
import { CalAIButton, ButtonGroup } from './CalAIButton';

export const CalAIShowcase: React.FC = () => {
  const [alerts, setAlerts] = useState<Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; title?: string; message: string }>>([]);

  const addAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setAlerts([...alerts, { id, type, title, message }]);
    setTimeout(() => setAlerts((a) => a.filter((x) => x.id !== id)), 5000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: 'hsl(150 20% 15%)', marginBottom: '2rem' }}>
        🎨 CalAI Design System Showcase
      </h1>

      {/* Alert List */}
      {alerts.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'hsl(150 20% 15%)', marginBottom: '1rem' }}>Alert Examples</h2>
          <AlertList
            alerts={alerts}
            onRemove={(id) => setAlerts((a) => a.filter((x) => x.id !== id))}
          />
        </section>
      )}

      {/* Buttons */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'hsl(150 20% 15%)', marginBottom: '1rem' }}>Buttons with Emojis</h2>
        <ButtonGroup direction="column" gap="0.5rem">
          <ButtonGroup>
            <CalAIButton
              emoji="🔥"
              onClick={() => addAlert('success', 'Success!', 'Action completed successfully')}
            >
              Primary Action
            </CalAIButton>
            <CalAIButton
              variant="secondary"
              emoji="❌"
              onClick={() => addAlert('error', 'Error', 'Something went wrong')}
            >
              Secondary Action
            </CalAIButton>
          </ButtonGroup>
          <ButtonGroup>
            <CalAIButton size="sm" emoji="✅">
              Small Button
            </CalAIButton>
            <CalAIButton size="lg" emoji="🌟">
              Large Button
            </CalAIButton>
          </ButtonGroup>
          <ButtonGroup>
            <CalAIButton
              loading={true}
              onClick={() => addAlert('warning', 'Loading', 'Please wait...')}
            >
              Loading State
            </CalAIButton>
            <CalAIButton disabled emoji="🚫">
              Disabled State
            </CalAIButton>
          </ButtonGroup>
        </ButtonGroup>
      </section>

      {/* Nutrition Display */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'hsl(150 20% 15%)', marginBottom: '1rem' }}>Nutrition Display</h2>
        <NutritionDisplay calories={450} protein={25} carbs={55} fats={12} />
      </section>

      {/* Macro Badges */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'hsl(150 20% 15%)', marginBottom: '1rem' }}>Macro Badges</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <MacroBadge type="protein" value={25} />
          <MacroBadge type="carbs" value={55} />
          <MacroBadge type="fats" value={12} />
        </div>
      </section>

      {/* Calorie Display */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'hsl(150 20% 15%)', marginBottom: '1rem' }}>Calorie Display</h2>
        <CalorieDisplay calories={450} />
      </section>

      {/* Food Item Cards */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'hsl(150 20% 15%)', marginBottom: '1rem' }}>Food Item Cards</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FoodItemCard
            name="Grilled Salmon"
            brand="Atlantic Catch"
            calories={450}
            protein={35}
            carbs={0}
            fats={28}
            timestamp={new Date()}
            onClick={() => addAlert('info', 'Item Selected', 'You clicked on Grilled Salmon')}
          />
          <FoodItemCard
            name="Brown Rice Bowl"
            brand="Organic Farms"
            calories={250}
            protein={8}
            carbs={45}
            fats={3}
            timestamp={new Date(Date.now() - 3600000)}
          />
          <FoodItemCard
            name="Mixed Vegetables"
            calories={120}
            protein={4}
            carbs={22}
            fats={0.5}
            timestamp={new Date(Date.now() - 7200000)}
            onRemove={() => addAlert('warning', 'Removed', 'Item removed from list')}
          />
        </div>
      </section>

      {/* Stats Display */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'hsl(150 20% 15%)', marginBottom: '1rem' }}>Statistics</h2>
        <StatsDisplay
          stats={[
            { label: 'Total Calories', value: '2150', emoji: '🔥' },
            { label: 'Protein', value: '125g', emoji: '⚡' },
            { label: 'Carbs', value: '280g', emoji: '🌾' },
            { label: 'Fats', value: '68g', emoji: '💧' },
            { label: 'Water', value: '2.5L', emoji: '💧' },
            { label: 'Meals', value: '4', emoji: '🍽️' },
          ]}
          title="Daily Summary"
          columns={3}
        />
      </section>

      {/* Individual Stat Boxes */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'hsl(150 20% 15%)', marginBottom: '1rem' }}>Highlighted Stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <StatBox label="Goal Progress" value="75%" emoji="🎯" highlight={true} />
          <StatBox label="Streak" value="12" emoji="🔥" />
          <StatBox label="Level" value="7" emoji="⭐" />
        </div>
      </section>

      {/* Color Palette Reference */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'hsl(150 20% 15%)', marginBottom: '1rem' }}>Color Palette</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.5rem', borderRadius: '0.5rem', backgroundColor: 'hsl(40 33% 95%)', border: '1px solid hsl(40 20% 85%)' }}>
            <p style={{ color: 'hsl(150 20% 15%)', fontWeight: 'bold' }}>Background</p>
            <p style={{ color: 'hsl(150 10% 45%)', fontSize: '0.875rem' }}>#f0ebe1</p>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: '0.5rem', backgroundColor: 'hsl(40 30% 98%)', border: '1px solid hsl(40 20% 85%)' }}>
            <p style={{ color: 'hsl(150 20% 15%)', fontWeight: 'bold' }}>Card</p>
            <p style={{ color: 'hsl(150 10% 45%)', fontSize: '0.875rem' }}>#202d42</p>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: '0.5rem', backgroundColor: 'hsl(152 45% 30%)', border: '1px solid hsl(152 45% 40%)' }}>
            <p style={{ color: 'white', fontWeight: 'bold' }}>Primary (Green)</p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>#f97316</p>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: '0.5rem', backgroundColor: 'hsl(150 20% 15%)', border: '1px solid hsl(150 10% 70%)' }}>
            <p style={{ color: 'hsl(40 33% 95%)', fontWeight: 'bold' }}>Text</p>
            <p style={{ color: 'hsl(150 10% 45%)', fontSize: '0.875rem' }}>#f0f4f8</p>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ color: 'hsl(150 20% 15%)', marginBottom: '1rem' }}>Implementation Tips</h2>
        <div className="card" style={{ padding: '1.5rem' }}>
          <ul style={{ color: 'hsl(150 20% 15%)', lineHeight: '1.8', listStylePosition: 'inside' }}>
            <li>✅ All components use CSS classes from App.css</li>
            <li>✅ Emojis are built-in for better UX</li>
            <li>✅ Dark theme colors are predefined (HSL color system)</li>
            <li>✅ Components are fully composable and reusable</li>
            <li>✅ No external UI library dependencies needed</li>
            <li>📚 Reference this file when implementing new pages/components</li>
            <li>🎨 Keep emoji usage consistent across the app</li>
            <li>⚡ Use CalorieDisplay for prominent calorie metrics</li>
            <li>🥗 Use NutritionDisplay for detailed nutrition breakdowns</li>
            <li>🍽️ Use FoodItemCard for food lists and histories</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default CalAIShowcase;
