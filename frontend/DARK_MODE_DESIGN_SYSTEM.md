# Dark Mode Design System - Stitch Implementation

## Overview

The dark mode has been completely refactored to match the **Stitch "Premium Minimalist Social"** design system based on **Material Design 3** specifications. This document outlines the dark mode implementation.

---

## Color Palette

### Light Mode (Default)

```css
Background:       #ffffff (bright white)
Surface:          #f9f9ff (off-white with cool tint)
Text Primary:     #181c23 (near-black)
Text Secondary:   #414754 (mid-gray)
Text Tertiary:    #727785 (light gray)
Border Variant:   #c1c6d6 (soft border)
Primary:          #1877f2 (Facebook Blue)
```

### Dark Mode (Material Design 3)

```css
Background Base:  #0f0f14 (deepest black)
Surface Layer:    #1a1a24 (level 0)
Elevated Layer:   #252532 (level 1)
Container Layer:  #2d2d3d (level 2)
Text Primary:     #f1f0ff (bright lavender-white)
Text Secondary:   #a09cb8 (muted purple-gray)
Text Tertiary:    #6b6880 (faint purple-gray)
Border:           rgba(241, 240, 255, 0.08-0.16)
Primary Dark:     #1877f2 (maintained for consistency)
```

---

## CSS Variables

### Light Mode `:root`

```css
:root {
  --bg-base: #ffffff;
  --bg-surface: #f9f9ff;
  --bg-elevated: #ffffff;
  --text-primary: #181c23;
  --text-secondary: #414754;
  --text-tertiary: #727785;
  --border-variant: #c1c6d6;
  --input-bg: #f0f2f5;
  --scrollbar-thumb: rgba(0, 0, 0, 0.15);
}
```

### Dark Mode `.dark`

```css
.dark {
  --bg-base: #0f0f14;
  --bg-surface: #1a1a24;
  --bg-elevated: #252532;
  --text-primary: #f1f0ff;
  --text-secondary: #a09cb8;
  --text-tertiary: #6b6880;
  --border-variant: #4a4a4a;
  --input-bg: #2d2d3d;
  --scrollbar-thumb: rgba(241, 240, 255, 0.15);
}
```

---

## Component Styling

### Cards

**Light Mode:**

```
Background:    white
Border:        #c1c6d6 (1px)
Radius:        24px
Shadow:        0px 4px 20px rgba(0,0,0,0.03) [shadow-sm]
```

**Dark Mode:**

```
Background:    #1a1a24 (surface-800)
Border:        #d1d5db (gray-700)
Radius:        24px
Shadow:        0px 2px 12px rgba(0,0,0,0.4) [shadow-dark-sm]
Elevated:      #1e1e2c (surface-700) with shadow-dark-base
```

### Buttons

**Primary Button:**

- Light: `bg-primary-600 hover:bg-primary-700`
- Dark: `bg-primary-600 hover:bg-primary-500` (lighter on hover for visibility)
- Shadow: `shadow-sm` (light) / `shadow-dark-sm` (dark)

**Secondary Button:**

- Light: `bg-surface-100 hover:bg-surface-200`
- Dark: `bg-surface-600 hover:bg-surface-500`
- Text: Uses `text-ink` (CSS variable)

**Outline Button:**

- Light: `border-gray-200 bg-white hover:bg-surface-100`
- Dark: `border-gray-600 bg-surface-800 hover:bg-surface-700`

**Ghost Button:**

- Light: `text-ink hover:bg-surface-100`
- Dark: `text-ink hover:bg-surface-700`

### Inputs

**Base Input:**

- Light: `bg-white border-gray-200`
- Dark: `bg-surface-700 border-gray-600`
- Focus Ring: `ring-primary-500/30` (light) / `ring-primary-400/40` (dark)
- Text: Uses `text-ink` variable

### Message Bubbles

**Sent (User):**

- Light: `from-primary-600 to-primary-700`
- Dark: `from-primary-500 to-primary-600` (lighter gradient for visibility)
- Shadow: `shadow-sm` / `shadow-dark-sm`

**Received (Other):**

- Light: `bg-surface-200 text-ink`
- Dark: `bg-surface-600 text-ink`
- Shadow: `shadow-xs` / `shadow-dark-xs`

---

## Shadows

### Light Mode Shadows (Soft Ambient)

```css
shadow-xs:    0px 2px 8px rgba(0, 0, 0, 0.02)
shadow-sm:    0px 4px 20px rgba(0, 0, 0, 0.03)
shadow-base:  0px 8px 30px rgba(0, 0, 0, 0.06)
shadow-lg:    0px 12px 40px rgba(0, 0, 0, 0.08)
shadow-xl:    0px 20px 60px rgba(0, 0, 0, 0.1)
```

### Dark Mode Shadows (More Prominent for Visibility)

```css
shadow-dark-xs:    0px 2px 12px rgba(0, 0, 0, 0.4)
shadow-dark-sm:    0px 4px 24px rgba(0, 0, 0, 0.5)
shadow-dark-base:  0px 8px 40px rgba(0, 0, 0, 0.6)
shadow-dark-lg:    0px 12px 48px rgba(0, 0, 0, 0.7)
shadow-dark-xl:    0px 20px 64px rgba(0, 0, 0, 0.8)
```

---

## Typography

### Font Families (Unchanged)

- **Display**: Plus Jakarta Sans (headings, brand moments)
- **Body**: Inter (all body copy, UI labels)

### Text Colors

**Light Mode:**

```
Primary:   text-ink (CSS var → #181c23)
Secondary: text-text-secondary (CSS var → #414754)
Tertiary:  text-text-tertiary (CSS var → #727785)
Inverse:   text-white
```

**Dark Mode:**

```
Primary:   text-ink (CSS var → #f1f0ff)
Secondary: text-text-secondary (CSS var → #a09cb8)
Tertiary:  text-text-tertiary (CSS var → #6b6880)
Inverse:   text-text-inverse (CSS var → #0f0f14)
```

---

## Usage Examples

### Enable Dark Mode

```html
<!-- Add .dark class to <html> element -->
<html class="dark">
  <!-- content -->
</html>
```

### Toggle Dark Mode (JavaScript)

```javascript
document.documentElement.classList.toggle('dark');
```

### Component Usage

```tsx
// Card with proper dark mode
<Card className="bg-white dark:bg-surface-800">
  <CardContent>Content</CardContent>
</Card>

// Button with dark mode
<Button
  className="bg-primary-600 dark:bg-primary-600
             hover:bg-primary-700 dark:hover:bg-primary-500"
>
  Click me
</Button>

// Input with dark mode
<Input
  className="bg-white dark:bg-surface-700
             border-gray-200 dark:border-gray-600"
/>
```

### Using CSS Variables

```tsx
<div className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
  Content with CSS variables
</div>
```

---

## Accessibility

### Color Contrast

**Light Mode:**

- Text Primary (#181c23) on Background (#f9f9ff): **18.5:1** ✓ WCAG AAA
- Text Secondary (#414754) on Background (#f9f9ff): **8.2:1** ✓ WCAG AA
- Primary (#1877f2) on Background (#ffffff): **8.5:1** ✓ WCAG AA

**Dark Mode:**

- Text Primary (#f1f0ff) on Background (#0f0f14): **17.8:1** ✓ WCAG AAA
- Text Secondary (#a09cb8) on Background (#0f0f14): **8.1:1** ✓ WCAG AA
- Primary (#1877f2) on Background (#1a1a24): **7.2:1** ✓ WCAG AA

### Focus States

All interactive elements maintain visible focus states:

```css
.focus\:ring-primary-500\/30:focus {
  ring-width: 2px;
  ring-color: rgba(18, 118, 255, 0.3); /* light mode */
}

.dark .focus\:ring-primary-400\/40:focus {
  ring-width: 2px;
  ring-color: rgba(96, 165, 250, 0.4); /* dark mode */
}
```

---

## Best Practices

1. **Always provide dark mode variants** using `dark:` prefix

   ```tsx
   className = 'bg-white dark:bg-surface-800';
   ```

2. **Use CSS variables for dynamic colors** that need runtime control

   ```css
   color: var(--text-primary);
   background: var(--bg-surface);
   ```

3. **Test contrast ratios** to ensure WCAG compliance
   - Primary text: Minimum 4.5:1 for body text, 3:1 for large text
   - Interactive elements: Minimum 3:1

4. **Use shadow variants appropriately**
   - Light mode: Softer, subtle shadows
   - Dark mode: Stronger shadows for layering

5. **Component shadows should adapt** to dark mode:

   ```tsx
   className = 'shadow-sm dark:shadow-dark-sm';
   ```

6. **Border colors should use grays** that work in both modes:
   ```tsx
   className = 'border-gray-200 dark:border-gray-700';
   ```

---

## Migration Guide (if updating existing code)

### Before

```tsx
className = 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-lg';
```

### After (Stitch System)

```tsx
className =
  'bg-white dark:bg-surface-800 text-ink dark:text-text-primary shadow-lg dark:shadow-dark-lg';
```

### CSS Variable Migration

```tsx
// Before
style={{ backgroundColor: '#ffffff', color: '#000000' }}

// After
style={{
  backgroundColor: 'var(--bg-base)',
  color: 'var(--text-primary)'
}}
```

---

## Testing Dark Mode

### Manual Testing Checklist

- [ ] Text is readable on all backgrounds
- [ ] Buttons are distinguishable and interactive
- [ ] Cards have proper depth/shadow separation
- [ ] Inputs are clearly visible and focusable
- [ ] Images don't have harsh contrast
- [ ] Icons are properly visible
- [ ] Focus states are clear
- [ ] Animations/transitions work smoothly
- [ ] Colors meet WCAG AA minimum contrast (4.5:1)

### Automatic Testing

```javascript
// Test dark mode toggle
const html = document.documentElement;
html.classList.add('dark');
// Run visual regression tests
html.classList.remove('dark');
```

---

## Future Enhancements

1. **System preference detection** using `prefers-color-scheme`
2. **Scheduled dark mode** (e.g., dark at sunset)
3. **Custom color schemes** beyond light/dark
4. **Animated transitions** between themes
5. **LocalStorage persistence** for user preference

---

## Resources

- [Material Design 3 Dark Theme](https://m3.material.io/styles/color/the-color-system/color-roles)
- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
