# Firecracker Workspace Components

A comprehensive set of React components for managing Firecracker-powered workspaces in VibeKraft. These components provide a complete interface for creating, managing, and monitoring high-performance microVM workspaces.

## Components Overview

### 🚀 WorkspaceLauncher
**File:** `workspace-launcher.tsx`

The main component for creating and launching new Firecracker workspace instances.

**Features:**
- Quick start with preset configurations (Development, Data Science, Web, Minimal)
- Template-based deployment
- Custom configuration options
- Resource allocation (CPU, Memory, Disk)
- VNC and networking configuration
- Real-time launch progress tracking

**Usage:**
```tsx
import { WorkspaceLauncher } from '@/components/firecracker';

<WorkspaceLauncher
  userId="user-123"
  workspaceId="workspace-456"
  onLaunch={(instanceId) => console.log('Launched:', instanceId)}
/>
```

### 📊 WorkspaceDashboard
**File:** `workspace-dashboard.tsx`

Main dashboard for managing multiple Firecracker workspace instances.

**Features:**
- Grid and list view of workspace instances
- Real-time status monitoring
- Resource usage visualization
- Quick actions (start, stop, restart, delete)
- Search and filtering capabilities
- Bulk operations support

**Usage:**
```tsx
import { WorkspaceDashboard } from '@/components/firecracker';

<WorkspaceDashboard userId="user-123" />
```

### 🖥️ WorkspaceInstance
**File:** `workspace-instance.tsx`

Detailed view and management interface for individual Firecracker instances.

**Features:**
- Instance overview and configuration details
- Real-time resource monitoring
- Network configuration display
- Quick access to SSH, VNC, and IDE
- Performance metrics visualization
- Instance lifecycle management

**Usage:**
```tsx
import { WorkspaceInstance } from '@/components/firecracker';

<WorkspaceInstance instanceId="fc-instance-123" />
```

### 📈 WorkspaceMetrics
**File:** `workspace-metrics.tsx`

Real-time metrics and monitoring dashboard for Firecracker workspaces.

**Features:**
- CPU, Memory, Disk, and Network monitoring
- Interactive charts and graphs
- Time range selection (1h, 6h, 24h, 7d)
- Instance status distribution
- Performance analytics
- Resource utilization trends

**Usage:**
```tsx
import { WorkspaceMetrics } from '@/components/firecracker';

<WorkspaceMetrics 
  userId="user-123" 
  instances={instances}
/>
```

### 💻 WorkspaceTerminal
**File:** `workspace-terminal.tsx`

Web-based terminal interface for Firecracker instances.

**Features:**
- Multiple terminal sessions
- Command execution via SSH
- Terminal history and scrollback
- Customizable themes and font sizes
- Quick command shortcuts
- Session management (create, close, clear)
- Copy/paste functionality

**Usage:**
```tsx
import { WorkspaceTerminal } from '@/components/firecracker';

<WorkspaceTerminal instanceId="fc-instance-123" />
```

### 📸 WorkspaceSnapshots
**File:** `workspace-snapshots.tsx`

Snapshot management for backup and restore operations.

**Features:**
- Create point-in-time snapshots
- Restore from snapshots
- Snapshot metadata and descriptions
- Size and creation date tracking
- Export and import capabilities
- Bulk snapshot operations

**Usage:**
```tsx
import { WorkspaceSnapshots } from '@/components/firecracker';

<WorkspaceSnapshots instanceId="fc-instance-123" />
```

### 🎨 TemplateManager
**File:** `template-manager.tsx`

Create and manage workspace templates for quick deployment.

**Features:**
- Template creation wizard
- Category-based organization
- Resource specification
- Pre-installed software configuration
- Template cloning and sharing
- Usage analytics
- Public/private template management

**Usage:**
```tsx
import { TemplateManager } from '@/components/firecracker';

<TemplateManager />
```

## Integration with Infrastructure

These components integrate seamlessly with the VibeKraft infrastructure:

### Hooks Integration
All components use the `useFirecracker` hook from `@/hooks/use-firecracker` for:
- Instance management (create, start, stop, delete)
- Template operations
- Snapshot management
- Command execution
- Real-time data fetching

### API Integration
Components communicate with the infrastructure through:
- `/api/infrastructure/firecracker/*` - Instance management
- `/api/infrastructure/metrics/*` - Performance monitoring
- `/api/infrastructure/storage/*` - Snapshot storage

### Type Safety
All components use TypeScript interfaces from:
- `@/lib/infrastructure/types` - Core infrastructure types
- Component-specific interfaces for props and state

## Design System

### UI Components
Built using Shadcn/UI components:
- `Card`, `Button`, `Input`, `Select`
- `Dialog`, `AlertDialog`, `Tabs`
- `Progress`, `Badge`, `Skeleton`
- `Chart` components for metrics visualization

### Styling
- Tailwind CSS for styling
- Consistent color scheme and spacing
- Responsive design for mobile and desktop
- Dark/light theme support

### Icons
Lucide React icons for consistent iconography:
- `Rocket`, `Server`, `Terminal` for workspace actions
- `Cpu`, `MemoryStick`, `HardDrive` for resources
- `Play`, `Square`, `RotateCcw` for controls

## State Management

### Local State
Components manage local state using React hooks:
- `useState` for component state
- `useCallback` for memoized functions
- `useEffect` for side effects

### Global State
Integration with global state through:
- SWR for data fetching and caching
- Custom hooks for infrastructure operations
- Context providers for shared state

## Error Handling

### User Feedback
- Toast notifications for success/error states
- Loading states with progress indicators
- Error boundaries for component isolation
- Graceful degradation for offline scenarios

### Validation
- Zod schemas for input validation
- Form validation with error messages
- Resource limit checking
- Permission validation

## Performance Optimization

### Rendering
- Memoized components and callbacks
- Virtualized lists for large datasets
- Lazy loading for heavy components
- Optimistic updates for better UX

### Data Fetching
- SWR for efficient data caching
- Background refresh for real-time updates
- Pagination for large datasets
- Debounced search inputs

## Accessibility

### Keyboard Navigation
- Full keyboard support
- Focus management
- ARIA labels and descriptions
- Screen reader compatibility

### Visual Design
- High contrast color schemes
- Scalable font sizes
- Clear visual hierarchy
- Consistent interaction patterns

## Testing

### Unit Tests
- Component rendering tests
- User interaction testing
- Hook testing with React Testing Library
- Mock API responses

### Integration Tests
- End-to-end workflow testing
- API integration testing
- Error scenario testing
- Performance testing

## Future Enhancements

### Planned Features
- Real-time collaboration
- Advanced monitoring and alerting
- Custom workspace environments
- Integration with external tools
- Enhanced security features

### Performance Improvements
- WebSocket integration for real-time updates
- Advanced caching strategies
- Component code splitting
- Progressive loading

## Contributing

When contributing to these components:

1. Follow the existing code style and patterns
2. Add TypeScript types for all props and state
3. Include error handling and loading states
4. Write tests for new functionality
5. Update documentation for API changes
6. Ensure accessibility compliance

## Dependencies

### Core Dependencies
- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- Lucide React
- date-fns

### UI Dependencies
- Shadcn/UI components
- Recharts for data visualization
- SWR for data fetching
- Sonner for notifications

### Infrastructure Dependencies
- Custom hooks from `@/hooks/use-firecracker`
- Infrastructure types from `@/lib/infrastructure/types`
- API routes for backend communication
