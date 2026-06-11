# Quick Reference Card

## 🎯 Most Common Tasks

### Use Theme in a Component
```tsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme } = useTheme()
  
  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#111827' : '#f8fafc'
    }}>
      Content
    </div>
  )
}
```

### Add Theme Toggle Button
```tsx
import ThemeToggle from '@/components/ThemeToggle'

function MyPage() {
  return <ThemeToggle size="large" />
}
```

### Use CSS Variables
```css
.my-component {
  background-color: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
```

## 📂 File Locations

```
contexts/ThemeContext.tsx       ← Theme state management
components/ThemeToggle.tsx      ← Toggle button
components/AntdThemeProvider.tsx ← Ant Design theming
app/layout.tsx                  ← Root providers
app/globals.css                 ← Color definitions
```

## 🎨 CSS Variables Cheat Sheet

### Backgrounds
```css
--bg-base          /* Main background */
--bg-surface       /* Cards, panels */
--bg-elevated      /* Modals, dropdowns */
--bg-hover         /* Hover states */
--bg-input         /* Form inputs */
```

### Text
```css
--text-primary     /* Main text */
--text-secondary   /* Labels, less important */
--text-tertiary    /* Placeholders, disabled */
--text-link        /* Links */
```

### Borders
```css
--border-subtle    /* Light dividers */
--border-default   /* Normal borders */
--border-strong    /* Emphasized borders */
--border-focus     /* Focus indicators */
```

### Brand
```css
--accent-primary   /* Blue - main actions */
--accent-success   /* Green - success states */
--accent-warning   /* Orange - warnings */
--accent-error     /* Red - errors */
```

## 🔧 Common Patterns

### Dynamic Background
```tsx
<div style={{
  backgroundColor: theme === 'dark' ? '#0b0f1a' : '#ffffff'
}}>
```

### Dynamic Text Color
```tsx
<span style={{
  color: theme === 'dark' ? '#f0f4f8' : '#0f172a'
}}>
```

### Dynamic Border
```tsx
<div style={{
  border: `1px solid ${theme === 'dark' ? '#253347' : '#cbd5e1'}`
}}>
```

### CSS Class Toggle
```tsx
<div className={theme === 'dark' ? 'dark-mode' : 'light-mode'}>
```

## 🎯 Hook Usage

### Get Current Theme
```tsx
const { theme } = useTheme()
// Returns: 'light' | 'dark'
```

### Toggle Theme
```tsx
const { toggleTheme } = useTheme()
// Call: toggleTheme()
```

### Both Together
```tsx
const { theme, toggleTheme } = useTheme()

<button onClick={toggleTheme}>
  {theme === 'dark' ? '☀️' : '🌙'}
</button>
```

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📍 Theme Toggle Locations

1. **User Login**: Top-right corner
2. **Admin Login**: Top-right corner  
3. **App Header**: Between dashboard and notifications

## ✅ Quick Test

1. Open: `http://localhost:3000/auth/login/user`
2. Click: Sun/moon icon (top-right)
3. See: Colors change instantly
4. Reload: Theme persists
5. Success! ✨

## 🎨 Color Examples

### Dark Mode
```
Background: #0b0f1a (very dark blue)
Surface:    #111827 (dark gray)
Text:       #f0f4f8 (off-white)
```

### Light Mode
```
Background: #ffffff (white)
Surface:    #f8fafc (light gray)
Text:       #0f172a (dark blue-gray)
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Theme won't change | Check ThemeProvider is wrapping app |
| Colors wrong | Verify CSS variables in globals.css |
| Toggle not showing | Import ThemeToggle component |
| Not persisting | Check localStorage permissions |

## 💡 Pro Tips

1. **Always use CSS variables** for colors
2. **Test both themes** when adding new components
3. **Use theme context** instead of hardcoding colors
4. **Check contrast** for accessibility
5. **Add transitions** for smooth theme changes

## 📦 Component Props

### ThemeToggle
```tsx
<ThemeToggle 
  size="large"           // 'small' | 'middle' | 'large'
  style={{ ... }}        // Custom styles
/>
```

## 🎯 When to Use What

| Scenario | Use |
|----------|-----|
| Need current theme | `useTheme()` hook |
| Toggle button | `<ThemeToggle />` |
| Custom colors | CSS variables |
| Dynamic styles | `theme === 'dark' ? ... : ...` |
| New page | Add ThemeProvider wrapper |

## 📚 Documentation Files

- `SETUP_INSTRUCTIONS.md` - Getting started
- `THEME_TOGGLE_IMPLEMENTATION.md` - Full guide
- `THEME_COLORS_REFERENCE.md` - All colors
- `ARCHITECTURE_DIAGRAM.md` - How it works
- `QUICK_REFERENCE.md` - This file

## 🎉 That's It!

You now have everything you need to work with the theme system. Happy coding!
