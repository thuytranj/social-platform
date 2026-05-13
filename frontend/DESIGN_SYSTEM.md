# Stitch Design System - Component Reference Guide

## Overview

This document provides usage examples for all components in the Stitch Design System, matching the "Premium Minimalist Social" design specs.

---

## Color System

### Semantic Colors

- **Primary Blue**: `#0058bc` (Stitch primary) / `#1877f2` (Facebook blue override)
- **Secondary**: `#54606a` (Slate)
- **Surface Background**: `#f9f9ff` (Off-white, cool tint)
- **Text Primary**: `#181c23` (Near-black)
- **Error**: `#ba1a1a` (Red)

### Usage in Tailwind

```tsx
// Primary colors
className = 'bg-primary-600 text-primary-700';

// Surface colors
className = 'bg-surface-100 dark:bg-surface-200';

// Text utilities
className = 'text-text-primary dark:text-ink';

// Border colors
className = 'border-border-variant dark:border-border-variant';
```

---

## Typography

### Heading Levels

```tsx
// Headline XL (32px, 700 weight)
<h1 className="text-headline-xl">Page Title</h1>

// Headline LG (24px, 600 weight)
<h2 className="text-headline-lg">Section Title</h2>

// Headline MD (18px, 600 weight)
<h3 className="text-headline-md">Card Title</h3>

// Body Large (16px)
<p className="text-body-lg">Main content</p>

// Body Medium (14px)
<p className="text-body-md">Secondary text</p>

// Label Small (12px)
<label className="text-label-sm">Form Label</label>
```

### Font Families

- **Display**: Plus Jakarta Sans (headings, brand moments)
- **Body**: Inter (all body copy, UI labels)

```tsx
<h1 className="font-display font-bold">Heading</h1>
<p className="font-sans">Body text</p>
```

---

## Spacing

### 8px Grid System

```tsx
// Margin/Padding utilities
className = 'p-2'; // 8px
className = 'p-3'; // 12px
className = 'p-4'; // 16px
className = 'p-6'; // 24px
className = 'p-8'; // 32px

// Gap utilities
className = 'gap-2 md:gap-4';

// Stack spacing
className = 'space-y-4'; // Vertical rhythm
```

---

## Components

### Button

#### Variants

```tsx
// Primary (main CTAs)
<Button variant="primary">Send</Button>

// Secondary (alternative actions)
<Button variant="secondary">Edit</Button>

// Outline (pending/cancel states)
<Button variant="outline">Cancel</Button>

// Ghost (tertiary/hover-only)
<Button variant="ghost">More Options</Button>

// Danger (destructive actions)
<Button variant="danger">Delete</Button>
```

#### Sizes

```tsx
<Button size="sm">Small</Button>        {/* 32px */}
<Button size="md">Medium</Button>      {/* 40px */}
<Button size="lg">Large</Button>       {/* 48px */}
<Button size="icon">🔍</Button>        {/* 40x40 circle */}
```

#### Props

```tsx
<Button
  variant="primary"
  size="md"
  fullWidth
  isLoading={isLoading}
  disabled={isDisabled}
  onClick={handleClick}
>
  Click Me
</Button>
```

---

### Input

#### Basic Usage

```tsx
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### With Icons

```tsx
<Input
  label="Username"
  leftIcon={<User size={18} />}
  placeholder="@username"
/>

<Input
  label="Search"
  leftIcon={<Search size={18} />}
  rightIcon={<X size={18} />}
  placeholder="Search users..."
/>
```

#### With Error

```tsx
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  placeholder="••••••••"
/>
```

#### Styling (Stitch)

- Background: `#f0f2f5` (soft grey)
- Border Radius: 12px
- Focus State: White bg + 2px blue border
- Padding: 10px 16px

---

### Card

#### Basic Structure

```tsx
<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Save</Button>
  </CardFooter>
</Card>
```

#### Elevated Card

```tsx
<Card elevated onClick={() => navigate('/post/123')}>
  <CardContent className="p-4">Post content</CardContent>
</Card>
```

#### Specs (Stitch)

- Background: White
- Padding: 20px (CardContent)
- Border Radius: 24px
- Shadow: Soft ambient (0px 4px 20px rgba(0,0,0,0.03))
- Border: 1px #c1c6d6 (optional)

---

### Tabs

#### Basic Usage

```tsx
const [activeTab, setActiveTab] = useState('friends');

<Tabs
  tabs={[
    { label: 'Friends', value: 'friends' },
    { label: 'Requests', value: 'requests', badge: 3 },
    { label: 'Sent', value: 'sent' },
  ]}
  defaultValue="friends"
  onChange={setActiveTab}
>
  {activeTab === 'friends' && <FriendsList />}
  {activeTab === 'requests' && <RequestsList />}
  {activeTab === 'sent' && <SentList />}
</Tabs>;
```

#### With Icons

```tsx
<Tabs
  tabs={[
    {
      label: 'Discussion',
      value: 'discussion',
      icon: <MessageSquare size={18} />,
    },
    { label: 'Members', value: 'members', icon: <Users size={18} /> },
    { label: 'Manage', value: 'manage', icon: <Settings size={18} /> },
  ]}
/>
```

---

### Badge

#### Variants

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>
```

#### Sizes

```tsx
<Badge size="sm">Small</Badge>      {/* 12px */}
<Badge size="md">Medium</Badge>    {/* 14px */}
<Badge size="lg">Large</Badge>     {/* 16px */}
```

#### Use Cases

- Status indicators: `<Badge variant="success">Active</Badge>`
- Notification counts: `<Badge variant="error">5</Badge>`
- Category tags: `<Badge variant="primary">Feature Request</Badge>`

---

### Chip

#### Basic Usage

```tsx
<Chip>JavaScript</Chip>
<Chip variant="primary">React</Chip>
<Chip onRemove={() => removeTech('TypeScript')}>TypeScript ×</Chip>
```

#### Use Cases

- Tag/category lists
- Technology stacks
- Skill endorsements
- Dynamic filters

---

### Modal

#### Basic Usage

```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Delete"
  maxWidth="sm"
>
  <p className="text-text-secondary mb-6">
    Are you sure you want to delete this post?
  </p>
  <div className="flex gap-3 justify-end">
    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="danger">Delete</Button>
  </div>
</Modal>

<Button onClick={() => setIsOpen(true)}>Open Modal</Button>
```

#### Max Width Options

- `sm`: 384px
- `md`: 448px (default)
- `lg`: 512px
- `xl`: 576px
- `2xl`: 640px
- `full`: calc(100% - 2rem)

#### Specs (Stitch)

- Border Radius: 24px
- Background: White
- Backdrop: 70% black overlay + blur
- Shadow: `0px 18px 60px rgba(15,23,42,0.14)`

---

### Dropdown

#### Basic Usage

```tsx
<Dropdown
  items={[
    { label: 'Edit', icon: <Edit size={16} />, onClick: handleEdit },
    { label: 'Share', icon: <Share2 size={16} />, onClick: handleShare },
    {
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: handleDelete,
      danger: true,
    },
  ]}
/>
```

#### Custom Trigger

```tsx
<Dropdown
  trigger={<Button variant="ghost" size="icon">⋮</Button>}
  items={[...]}
  align="right"
/>
```

---

### Avatar

#### Sizes

```tsx
<Avatar src={photoUrl} alt="John Doe" size="xs" />    {/* 24px */}
<Avatar src={photoUrl} alt="John Doe" size="sm" />    {/* 32px */}
<Avatar src={photoUrl} alt="John Doe" size="md" />    {/* 40px */}
<Avatar src={photoUrl} alt="John Doe" size="lg" />    {/* 48px */}
<Avatar src={photoUrl} alt="John Doe" size="xl" />    {/* 64px */}
<Avatar src={photoUrl} alt="John Doe" size="2xl" />   {/* 96px */}
```

#### With Online Indicator

```tsx
<Avatar src={photoUrl} alt="John Doe" size="lg" isOnline={true} />
```

#### Fallback (No Image)

```tsx
// Shows initials in gradient blue background
<Avatar alt="Jane Smith" size="md" />  {/* JS */}
```

#### Specs (Stitch)

- Border Radius: Circular (9999px)
- Fallback: Gradient blue bg (#0058bc to #0070eb)
- Border: 1px border-variant
- Online dot: Green circle (bottom-right)

---

## Design Patterns

### Loading State

```tsx
import { Skeleton } from '@/components/ui';

<div className="space-y-4">
  {Array.from({ length: 3 }).map((_, i) => (
    <Card key={i} className="p-4 animate-pulse">
      <div className="flex gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
    </Card>
  ))}
</div>;
```

### Empty State

```tsx
import { Card } from '@/components/ui';
import { Inbox } from 'lucide-react';

<Card className="p-12 text-center">
  <Inbox size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
  <h3 className="font-semibold text-text-primary mb-1">No messages</h3>
  <p className="text-text-secondary text-sm">
    Start a conversation to see messages here
  </p>
</Card>;
```

### Error State

```tsx
<Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-4">
  <p className="text-red-700 dark:text-red-300 font-semibold">
    Error loading data
  </p>
  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
    Please try again later
  </p>
</Card>
```

### Form Pattern

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  <Input
    label="Full Name"
    placeholder="John Doe"
    error={errors.name}
    {...register('name')}
  />

  <Input
    label="Email"
    type="email"
    placeholder="john@example.com"
    error={errors.email}
    {...register('email')}
  />

  <div className="flex gap-3 justify-end pt-4 border-t border-border-variant">
    <Button variant="outline" type="button">
      Cancel
    </Button>
    <Button variant="primary" type="submit" isLoading={isSubmitting}>
      Save
    </Button>
  </div>
</form>
```

---

## Responsive Design

### Breakpoints

- `xs`: 320px
- `sm`: 640px
- `md`: 768px (desktop default)
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Example

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Single column on mobile, 2 on small screens, 3 on large */}
</div>
```

---

## Dark Mode

### Automatic with Tailwind Class

```tsx
// Light mode (default)
className = 'bg-white text-black';

// Dark mode (with .dark class on <html>)
className = 'bg-white dark:bg-surface-50 text-black dark:text-ink';
```

### CSS Variables

```css
:root {
  --bg-base: #ffffff;
  --text-primary: #181c23;
}

.dark {
  --bg-base: #0f0f14;
  --text-primary: #f1f0ff;
}
```

---

## Accessibility

### Focus States

All interactive elements have built-in focus rings:

```tsx
className = 'focus:outline-none focus:ring-2 focus:ring-primary-500/40';
```

### ARIA Labels

```tsx
<button aria-label="Close menu" onClick={handleClose}>✕</button>
<input aria-label="Search users" placeholder="Search..." />
```

### Color Contrast

- Text Primary (`#181c23`) on Surface (`#f9f9ff`): **18.5:1** ✓ WCAG AAA
- Primary (`#0058bc`) on Surface (`#ffffff`): **8.5:1** ✓ WCAG AA

---

## Best Practices

1. **Use semantic HTML**: `<button>`, `<input>`, `<form>` over `<div>` when possible
2. **Maintain consistent spacing**: Use 8px grid multiples
3. **Keyboard navigation**: All modals, dropdowns must be keyboard accessible
4. **Loading states**: Always show loading spinner for async operations
5. **Error messages**: Be specific and actionable
6. **Empty states**: Guide users on what to do next
7. **Dark mode**: Test all components in both light and dark modes

---

## Token Export

For use in CSS, JSON, or other formats:
See `frontend/src/constants/design-tokens.ts`

Includes: colors, typography, spacing, shadows, border-radius, transitions, component sizes, breakpoints
