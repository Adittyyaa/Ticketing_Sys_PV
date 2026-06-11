# Theme Toggle Architecture

## Component Hierarchy

```
app/layout.tsx (Root)
│
├── ThemeProvider (Context Provider)
│   │
│   ├── AntdThemeProvider (Ant Design Config)
│   │   │
│   │   ├── InactivityLogoutProvider
│   │   │   │
│   │   │   └── Page Content
│   │   │       │
│   │   │       ├── Login Pages
│   │   │       │   ├── /auth/login/user
│   │   │       │   │   └── <ThemeToggle /> (top-right)
│   │   │       │   │
│   │   │       │   └── /auth/login/admin
│   │   │       │       └── <ThemeToggle /> (top-right)
│   │   │       │
│   │   │       └── Authenticated Pages
│   │   │           └── <Header>
│   │   │               └── <ThemeToggle /> (in navigation)
```

## Data Flow

```
User clicks ThemeToggle
        ↓
toggleTheme() called
        ↓
ThemeContext updates state
        ↓
localStorage saves preference
        ↓
document.documentElement.setAttribute('data-theme', newTheme)
        ↓
        ├── CSS variables update (globals.css)
        │   └── All styled components re-render
        │
        └── AntdThemeProvider detects change
            └── ConfigProvider switches algorithm
                └── All Ant Design components re-render
```

## File Dependencies

```
contexts/ThemeContext.tsx
    ↓ provides useTheme hook
    ↓
    ├── components/ThemeToggle.tsx (uses hook)
    ├── components/AntdThemeProvider.tsx (uses hook)
    ├── app/auth/login/user/page.tsx (uses hook)
    ├── app/auth/login/admin/page.tsx (uses hook)
    └── Any custom component (can use hook)

app/globals.css
    ├── [data-theme="dark"] { CSS variables }
    └── [data-theme="light"] { CSS variables }
        ↓ used by
        └── All components via var(--variable-name)
```

## State Management

```
ThemeContext
    ├── State: theme ('light' | 'dark')
    ├── Action: toggleTheme()
    ├── Persistence: localStorage.getItem/setItem('theme')
    └── Side Effect: document.documentElement.setAttribute()
```

## CSS Variable Cascade

```
:root / [data-theme="dark"]
    ├── --bg-base: #0b0f1a
    ├── --bg-surface: #111827
    ├── --text-primary: #f0f4f8
    └── ... (other variables)

[data-theme="light"]
    ├── --bg-base: #ffffff
    ├── --bg-surface: #f8fafc
    ├── --text-primary: #0f172a
    └── ... (other variables)

↓ used in components

<div style={{ backgroundColor: 'var(--bg-surface)' }}>
    ↑ automatically gets correct color based on theme
```

## Ant Design Theme Integration

```
AntdThemeProvider
    ├── Reads: useTheme() → current theme
    │
    ├── Determines: algorithm
    │   ├── if dark → theme.darkAlgorithm
    │   └── if light → theme.defaultAlgorithm
    │
    ├── Configures: token colors
    │   ├── colorBgBase
    │   ├── colorBgContainer
    │   ├── colorTextBase
    │   └── ... (50+ tokens)
    │
    └── Wraps: <ConfigProvider>
        └── All children use configured theme
```

## Component Communication

```
┌─────────────────────────────────────────────────────┐
│                  ThemeContext                        │
│  ┌──────────────────────────────────────────────┐  │
│  │ State: { theme: 'dark' | 'light' }           │  │
│  │ Methods: { toggleTheme: () => void }         │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         ↓              ↓               ↓
    ┌────────┐   ┌──────────┐   ┌────────────┐
    │ Toggle │   │  Antd    │   │  Login     │
    │ Button │   │ Provider │   │  Pages     │
    └────────┘   └──────────┘   └────────────┘
         ↓              ↓               ↓
    Reads theme   Switches algo   Dynamic styles
```

## Theme Switching Flow

```
Initial Load
    ↓
Check localStorage
    ├── Has 'theme'? → Use saved value
    └── No 'theme'? → Check system preference
                        ├── prefers dark → Set 'dark'
                        └── prefers light → Set 'light'
    ↓
Set document attribute
    ↓
Render with theme
    ↓
User clicks toggle
    ↓
Call toggleTheme()
    ↓
Update state: 'dark' ↔ 'light'
    ↓
Save to localStorage
    ↓
Update document attribute
    ↓
React re-renders
    ├── CSS variables change
    └── Ant Design re-configures
    ↓
UI updates with new theme
```

## Browser Storage

```
localStorage
    └── 'theme': 'dark' | 'light'
        ├── Set by: ThemeContext
        ├── Read by: ThemeContext (on mount)
        ├── Persists: Across sessions
        └── Cleared by: User clears browser data
```

## DOM Structure

```html
<html lang="en" data-theme="dark">
  ↑ This attribute controls theme
  
  <head>...</head>
  
  <body>
    <ThemeProvider>
      <AntdThemeProvider>
        <div style="background-color: var(--bg-base);">
          ↑ CSS variable resolves based on data-theme
          
          <ThemeToggle />
          ↑ Button to switch themes
        </div>
      </AntdThemeProvider>
    </ThemeProvider>
  </body>
</html>
```

## CSS Selector Priority

```
CSS Specificity:

1. [data-theme="light"] { ... }    ← Light mode overrides
2. [data-theme="dark"] { ... }     ← Dark mode overrides  
3. :root { ... }                   ← Default/fallback

Example:
:root {
  --bg-base: #0b0f1a;              ← Used when no data-theme
}

[data-theme="dark"] {
  --bg-base: #0b0f1a;              ← Used when data-theme="dark"
}

[data-theme="light"] {
  --bg-base: #ffffff;              ← Used when data-theme="light"
}
```

## Event Flow Diagram

```
┌──────────────┐
│ User Action  │
│ (Click Toggle)│
└───────┬──────┘
        ↓
┌───────────────┐
│ toggleTheme() │
└───────┬───────┘
        ↓
┌──────────────────────┐
│ setTheme(newTheme)   │
│ (React state update) │
└──────────┬───────────┘
           ↓
    ┌──────────────┐
    │ useEffect    │
    │ triggers     │
    └──────┬───────┘
           ↓
    ┌─────────────────────────────┐
    │ localStorage.setItem()      │
    │ document.setAttribute()     │
    └─────────────┬───────────────┘
                  ↓
         ┌────────────────┐
         │ React re-render│
         └────────┬───────┘
                  ↓
    ┌─────────────────────────┐
    │ All theme-aware         │
    │ components update       │
    └─────────────────────────┘
```

## Performance Considerations

```
Theme Switch Performance:
    ├── CSS Variables: O(1) - Instant update
    ├── React Re-render: O(n) - Based on component tree
    ├── Ant Design Re-config: O(1) - Single provider update
    └── localStorage Write: O(1) - Async, non-blocking

Optimization:
    ├── CSS transitions smooth visual changes
    ├── Context prevents unnecessary re-renders
    ├── Theme computed once at provider level
    └── Child components only re-render if they use theme
```

## Testing Points

```
Unit Tests:
    ├── ThemeContext toggles correctly
    ├── useTheme hook returns current theme
    ├── localStorage saves/loads theme
    └── Document attribute updates

Integration Tests:
    ├── ThemeToggle changes theme
    ├── CSS variables apply correctly
    ├── Ant Design components adapt
    └── Login pages render both themes

E2E Tests:
    ├── User can toggle theme
    ├── Theme persists on reload
    ├── System preference detected
    └── All pages work in both themes
```
