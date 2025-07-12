# Enhanced Dashboard Layout Components

This directory contains enhanced dashboard layout components built using Shadcn UI components, specifically leveraging the Sidebar and Command components for a modern, accessible, and feature-rich dashboard experience.

## Components Overview

### 1. DashboardSidebar (`dashboard-sidebar.tsx`)

A comprehensive sidebar component built with Shadcn's Sidebar primitives.

**Features:**
- **Collapsible Navigation**: Automatic responsive behavior with mobile support
- **Hierarchical Menu Structure**: Support for nested navigation items with collapsible groups
- **Active State Management**: Automatic highlighting of current page and parent sections
- **Search Integration**: Built-in search input for quick navigation
- **Status Indicator**: Real-time system status display in footer
- **Keyboard Navigation**: Full keyboard accessibility support
- **Tooltips**: Helpful tooltips for collapsed state

**Key Components Used:**
- `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`
- `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`
- `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`
- `Collapsible` for expandable menu sections

### 2. DashboardHeader (`dashboard-header.tsx`)

A feature-rich header component with organization switching, search, and user management.

**Features:**
- **Organization Selector**: Dropdown with role indicators and search
- **Global Search**: Command palette integration with keyboard shortcuts (⌘K)
- **Quick Actions**: Dropdown menu for common actions with shortcuts
- **Notifications**: Badge-enabled notification center
- **Theme Toggle**: Light/dark/system theme switching
- **User Menu**: Profile, settings, and logout options
- **Responsive Design**: Mobile-optimized layout

**Key Components Used:**
- `SidebarTrigger` for sidebar control
- `Command` components for organization search
- `DropdownMenu` for various menus
- `Avatar` for user profile display

### 3. DashboardLayout (`dashboard-layout.tsx`)

Main layout wrapper that combines sidebar and header with proper responsive behavior.

**Features:**
- **SidebarProvider**: Manages sidebar state and responsive behavior
- **SidebarInset**: Proper content area with sidebar integration
- **Responsive Design**: Automatic mobile/desktop layout switching
- **Keyboard Shortcuts**: Global keyboard navigation support

### 4. CommandPalette (`command-palette.tsx`)

A comprehensive command palette for quick navigation and actions.

**Features:**
- **Global Search**: Search across all navigation items and actions
- **Keyboard Shortcuts**: Extensive keyboard shortcut support
- **Grouped Commands**: Organized by categories (Navigation, Quick Actions, etc.)
- **Action Execution**: Direct navigation and custom action support
- **Fuzzy Search**: Smart search with description matching

**Command Categories:**
- Navigation (Dashboard, Projects, Workspaces, etc.)
- Quick Actions (Create Project, New Workspace, etc.)
- Organization (Team, Analytics, Security)
- Settings & Support

### 5. QuickActions (`quick-actions.tsx`)

Organized dropdown menu for common creation and management actions.

**Features:**
- **Grouped Actions**: Organized by type (Create, Deploy, Import)
- **Keyboard Shortcuts**: Quick access via shortcuts
- **Rich Descriptions**: Helpful descriptions for each action
- **Icon Support**: Visual icons for better UX

### 6. StatusIndicator (`status-indicator.tsx`)

Real-time system status display with detailed tooltips.

**Features:**
- **Connection Status**: Cloud connectivity and online status
- **System Metrics**: Running instances and active workspaces
- **Last Sync Time**: Real-time sync status
- **Visual Indicators**: Color-coded status dots
- **Detailed Tooltips**: Comprehensive status information

## Usage Examples

### Basic Layout Setup

```tsx
import { DashboardLayout } from "@/components/dashboard/layout/dashboard-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout user={session.user}>
      {children}
    </DashboardLayout>
  );
}
```

### Using Command Palette

```tsx
import { CommandPalette } from "@/components/dashboard/layout/command-palette";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Command Palette</button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
```

### Custom Navigation Items

```tsx
// Add to navigationItems array in dashboard-sidebar.tsx
{
  title: "Custom Section",
  icon: CustomIcon,
  children: [
    {
      title: "Custom Page",
      href: "/dashboard/custom",
      icon: PageIcon,
    },
  ],
}
```

## Keyboard Shortcuts

- `⌘K` - Open command palette
- `⌘D` - Navigate to dashboard
- `⌘P` - Navigate to projects
- `⌘W` - Navigate to workspaces
- `⌘I` - Navigate to instances
- `⌘T` - Navigate to WebVM workspace
- `⌘⇧P` - Create new project
- `⌘⇧W` - Create new workspace
- `⌘⇧I` - Launch new instance
- `⌘,` - Open settings
- `⌘?` - Open help

## Customization

### Adding New Navigation Items

1. Add to `navigationItems` array in `dashboard-sidebar.tsx`
2. Add corresponding commands to `commands` array in `command-palette.tsx`
3. Update keyboard shortcuts in `command-palette.tsx`

### Styling

All components use Shadcn's design system and can be customized through:
- CSS variables for colors and spacing
- Tailwind classes for layout and styling
- Component variants for different states

### Responsive Behavior

The layout automatically adapts to different screen sizes:
- **Desktop**: Full sidebar with expanded navigation
- **Tablet**: Collapsible sidebar with icons
- **Mobile**: Overlay sidebar with full navigation

## Dependencies

- `@/components/ui/sidebar` - Shadcn Sidebar components
- `@/components/ui/command` - Shadcn Command components
- `@/components/ui/dropdown-menu` - Dropdown menus
- `@/components/ui/avatar` - User avatar display
- `@/components/ui/badge` - Status badges
- `@/components/ui/button` - Interactive buttons
- `@/components/ui/input` - Form inputs
- `@/components/ui/tooltip` - Helpful tooltips
- `next/navigation` - Next.js navigation
- `next-themes` - Theme management

## Accessibility

All components are built with accessibility in mind:
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Logical focus order and visible focus indicators
- **Color Contrast**: Meets WCAG guidelines
- **Responsive Text**: Scales appropriately with user preferences
