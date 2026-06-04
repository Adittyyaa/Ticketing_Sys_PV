# Premium Minimalist Design System

## 🎨 Design Philosophy

**Core Principles:**
1. **Breathing Room** - Generous whitespace, no cluttered interfaces
2. **Typography First** - Clear hierarchy, readable fonts
3. **Subtle Interactions** - Smooth micro-animations, hover states
4. **Restrained Color** - Monochromatic base with accent highlights
5. **Purposeful Shadows** - Depth through elevation, not borders
6. **Glass Morphism** - Frosted glass effects for modals/cards
7. **Perfect Alignment** - Everything on a grid

---

## 🎯 Color Palette

### Base (Neutral Gray Scale)
```
Background:     #0A0E1A (Deep Navy-Black)
Surface:        #111827 (Dark Slate)
Surface Light:  #1F2937 (Lighter Slate)
Border:         #374151 (Subtle Gray)
Text Primary:   #F9FAFB (Almost White)
Text Secondary: #9CA3AF (Muted Gray)
Text Tertiary:  #6B7280 (Subtle Gray)
```

### Accent Colors
```
Primary:        #3B82F6 (Vivid Blue)
Primary Hover:  #2563EB (Deeper Blue)
Success:        #10B981 (Emerald)
Warning:        #F59E0B (Amber)
Error:          #EF4444 (Red)
Purple (Admin): #8B5CF6 (Purple)
```

---

## 📐 Spacing System

```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

---

## 🔤 Typography

### Font Stack
```css
Primary: 'Inter', -apple-system, system-ui, sans-serif
Mono:    'JetBrains Mono', 'Fira Code', monospace
```

### Scale
```
Hero:     48px / 3rem   (font-size)
H1:       36px / 2.25rem
H2:       30px / 1.875rem
H3:       24px / 1.5rem
H4:       20px / 1.25rem
Body:     16px / 1rem
Small:    14px / 0.875rem
Tiny:     12px / 0.75rem
```

### Weights
```
Light:    300
Regular:  400
Medium:   500
Semibold: 600
Bold:     700
```

---

## 🎭 Component Patterns

### Cards
```css
Background: rgba(17, 24, 39, 0.6)
Backdrop:   blur(20px)
Border:     1px solid rgba(255,255,255,0.08)
Radius:     16px
Shadow:     0 8px 32px rgba(0,0,0,0.12)
Padding:    24px
```

### Buttons
```css
/* Primary */
Background: #3B82F6
Hover:      #2563EB
Shadow:     0 4px 14px rgba(59,130,246,0.25)
Padding:    12px 24px
Radius:     12px
Font:       500 (medium)

/* Secondary */
Background: rgba(59,130,246,0.1)
Border:     1px solid rgba(59,130,246,0.3)
Color:      #3B82F6
```

### Inputs
```css
Background: rgba(31,41,55,0.5)
Border:     1px solid rgba(255,255,255,0.08)
Focus:      1px solid #3B82F6
Radius:     12px
Padding:    12px 16px
```

### Modals
```css
Backdrop:   rgba(0,0,0,0.75)
Background: rgba(17,24,39,0.95)
Blur:       blur(40px)
Border:     1px solid rgba(255,255,255,0.08)
Radius:     20px
Shadow:     0 20px 60px rgba(0,0,0,0.5)
```

---

## ✨ Micro-interactions

### Transitions
```css
Fast:       150ms cubic-bezier(0.4, 0, 0.2, 1)
Normal:     200ms cubic-bezier(0.4, 0, 0.2, 1)
Slow:       300ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Hover Effects
```css
Scale:      transform: scale(1.02)
Lift:       transform: translateY(-2px)
Glow:       box-shadow: 0 0 20px rgba(59,130,246,0.3)
```

---

## 🏗️ Layout

### Container Widths
```
Small:   640px  (mobile)
Medium:  768px  (tablet)
Large:   1024px (desktop)
XL:      1280px (wide)
Max:     1400px (ultra-wide)
```

### Grid
```
Columns:  12
Gutter:   24px
Margin:   32px (desktop), 16px (mobile)
```

---

## 🎪 Specific Components

### Header
- Height: 72px
- Backdrop filter with slight blur
- Subtle shadow on scroll
- Icons: 20px with hover glow
- Logo: 40px with subtle shadow

### Sidebar (if added)
- Width: 280px
- Glass morphism background
- Hover states with highlight
- Collapsible with smooth animation

### Tables
- Row hover: subtle highlight
- Alternate rows: very subtle bg
- Header: sticky with backdrop blur
- Borders: subtle, 1px rgba lines

### Badges/Tags
- Pill shape: 100px radius
- Padding: 4px 12px
- Font: 12px medium
- Subtle shadow

### Dropdowns
- Glass morphism
- Subtle entrance animation
- Backdrop blur
- Arrow indicator

---

## 📱 Responsive

### Breakpoints
```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

### Mobile Adaptations
- Reduce spacing by 30%
- Stack horizontally aligned items
- Increase tap target sizes (44px min)
- Simplify complex interactions

---

## 🔮 Advanced Effects

### Glass Morphism
```css
background: rgba(17, 24, 39, 0.7);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
```

### Gradient Accents
```css
background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
```

### Skeleton Loading
```css
background: linear-gradient(
  90deg,
  rgba(255,255,255,0.05) 25%,
  rgba(255,255,255,0.1) 50%,
  rgba(255,255,255,0.05) 75%
);
animation: shimmer 2s infinite;
```

---

## 🎬 Animation Guidelines

### Do's
- Fade in on mount
- Slide in from direction of origin
- Stagger list items (50ms delay)
- Scale buttons on click
- Smooth transitions between states

### Don'ts
- No spinning/rotating unless loading
- Avoid bouncing
- Don't animate layout properties (use transform)
- No animations over 500ms

---

## ♿ Accessibility

### Focus States
```css
outline: 2px solid #3B82F6;
outline-offset: 2px;
```

### Contrast Ratios
- Text on background: 7:1 (AA)
- Interactive elements: 3:1
- Non-text: 3:1

### Interactive Sizes
- Minimum: 44x44px
- Comfortable: 48x48px
- Generous: 56x56px

---

## 📚 Implementation Priority

### Phase 1: Foundation
1. Update global CSS with new color system
2. Add Inter font
3. Implement spacing tokens
4. Add glass morphism utilities

### Phase 2: Core Components
1. Header redesign
2. Button variants
3. Input fields
4. Cards/surfaces

### Phase 3: Features
1. Modals
2. Dropdowns
3. Tables
4. Forms

### Phase 4: Polish
1. Animations
2. Skeleton loaders
3. Empty states
4. Error states

---

This design system will transform your ticketing system into a premium, minimalist interface that feels modern, fast, and delightful to use.
