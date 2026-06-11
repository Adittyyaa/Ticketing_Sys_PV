# Theme Colors Reference

## Quick Color Comparison

### Backgrounds

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| Base | `#0b0f1a` | `#ffffff` |
| Surface | `#111827` | `#f8fafc` |
| Elevated | `#1a2236` | `#f1f5f9` |
| Hover | `#1e293b` | `#e2e8f0` |
| Input | `#0f172a` | `#ffffff` |
| Sidebar | `#0b0f1a` | `#f8fafc` |

### Text

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| Primary | `#f0f4f8` | `#0f172a` |
| Secondary | `#94a3b8` | `#475569` |
| Tertiary | `#64748b` | `#64748b` |
| Link | `#60a5fa` | `#2563eb` |
| Placeholder | `#475569` | `#94a3b8` |

### Borders

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| Subtle | `#1e2d45` | `#e2e8f0` |
| Default | `#253347` | `#cbd5e1` |
| Strong | `#334155` | `#94a3b8` |
| Focus | `#3b82f6` | `#3b82f6` |

### Brand Colors (Same for both themes)

| Element | Color |
|---------|-------|
| Primary | `#3b82f6` |
| Primary Hover | `#2563eb` |
| Success | `#10b981` |
| Warning | `#f59e0b` |
| Error | `#ef4444` |
| Info | `#06b6d4` |

### Shadows

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| XS | `0 1px 2px rgba(0,0,0,0.3)` | `0 1px 2px rgba(0,0,0,0.05)` |
| SM | `0 2px 4px rgba(0,0,0,0.3)` | `0 2px 4px rgba(0,0,0,0.06)` |
| MD | `0 4px 8px rgba(0,0,0,0.4)` | `0 4px 8px rgba(0,0,0,0.08)` |
| LG | `0 8px 16px rgba(0,0,0,0.4)` | `0 8px 16px rgba(0,0,0,0.1)` |
| XL | `0 16px 32px rgba(0,0,0,0.5)` | `0 16px 32px rgba(0,0,0,0.12)` |

## CSS Variable Usage

### In Your Components

Instead of hardcoded colors:
```css
/* ❌ Don't do this */
background-color: #111827;
color: #f0f4f8;
```

Use CSS variables:
```css
/* ✅ Do this */
background-color: var(--bg-surface);
color: var(--text-primary);
```

### Available CSS Variables

#### Backgrounds
- `--bg-base`
- `--bg-surface`
- `--bg-elevated`
- `--bg-hover`
- `--bg-input`
- `--bg-sidebar`
- `--bg-sidebar-hover`
- `--bg-sidebar-active`

#### Text
- `--text-primary`
- `--text-secondary`
- `--text-tertiary`
- `--text-link`
- `--text-placeholder`

#### Borders
- `--border-subtle`
- `--border-default`
- `--border-strong`
- `--border-focus`

#### Brand
- `--accent-primary`
- `--accent-primary-hover`
- `--accent-success`
- `--accent-warning`
- `--accent-error`
- `--accent-info`

#### Shadows
- `--shadow-xs`
- `--shadow-sm`
- `--shadow-md`
- `--shadow-lg`
- `--shadow-xl`

#### Transitions
- `--transition-fast` (100ms)
- `--transition-normal` (200ms)
- `--transition-slow` (300ms)

## React/TypeScript Usage

### Using theme in inline styles:

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme } = useTheme()
  
  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#111827' : '#f8fafc',
      color: theme === 'dark' ? '#f0f4f8' : '#0f172a',
      padding: '16px',
      borderRadius: '8px',
    }}>
      Content
    </div>
  )
}
```

### Using theme with Tailwind:

```tsx
<div className={`p-4 rounded-lg ${
  theme === 'dark' 
    ? 'bg-gray-800 text-gray-100' 
    : 'bg-gray-50 text-gray-900'
}`}>
  Content
</div>
```

### Using theme with conditional classes:

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function Card({ children }) {
  const { theme } = useTheme()
  
  const cardClass = theme === 'dark' 
    ? 'dark-card' 
    : 'light-card'
  
  return (
    <div className={cardClass}>
      {children}
    </div>
  )
}
```

## Design Principles

### Dark Mode (Default)
- Deep, rich backgrounds for reduced eye strain
- Higher contrast for better readability
- Subtle borders to define boundaries
- Muted colors to avoid overwhelming users

### Light Mode
- Clean, bright backgrounds for clarity
- Professional appearance
- Softer shadows for depth
- High contrast text for readability

## Accessibility Notes

- Both themes maintain WCAG AA contrast ratios
- Focus states are clearly visible in both modes
- Interactive elements have sufficient touch targets
- Color is never the only indicator of state
