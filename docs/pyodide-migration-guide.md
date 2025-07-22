# Pyodide Workspace Migration Guide

This guide helps you integrate Pyodide workspace support into existing VibeKraft installations.

## Prerequisites

- Existing VibeKraft installation with WebVM/Firecracker support
- Node.js 18+ and pnpm
- PostgreSQL database
- Modern browser with WebAssembly support

## Step 1: Install Dependencies

Add required packages:

```bash
pnpm add pyodide @xterm/addon-search
```

The following packages should already be installed:
- `@xterm/xterm`
- `@xterm/addon-fit`
- `@xterm/addon-web-links`

## Step 2: Update Database Schema

Add PYODIDE to the WorkspaceType enum in your Prisma schema:

```prisma
// prisma/schema.prisma
enum WorkspaceType {
  WEBVM       // Browser-based WebVM workspaces
  FIRECRACKER // Firecracker microVM workspaces
  PYODIDE     // Python workspaces powered by Pyodide
}
```

Run the migration:

```bash
npx prisma db push
# or
npx prisma migrate dev --name add-pyodide-workspace-type
```

## Step 3: Copy Pyodide Components

Copy the entire Pyodide component structure to your project:

```bash
# Copy core components
cp -r components/pyodide/ your-project/components/

# Copy API routes
cp -r app/api/workspaces/[id]/pyodide/ your-project/app/api/workspaces/[id]/

# Copy workspace pages
cp -r app/workspace/pyodide/ your-project/app/workspace/

# Copy unified workspace launcher
cp components/workspace/unified-workspace-launcher.tsx your-project/components/workspace/
```

## Step 4: Update Existing Components

### Update WorkspaceLauncher

If you have an existing workspace launcher, integrate the unified launcher:

```tsx
// Before: Single workspace type launcher
import { FirecrackerWorkspaceLauncher } from './firecracker-workspace-launcher';

// After: Unified launcher supporting all types
import { UnifiedWorkspaceLauncher } from './unified-workspace-launcher';

function WorkspaceCreation({ projectId, userId }) {
  return (
    <UnifiedWorkspaceLauncher
      projectId={projectId}
      userId={userId}
      onLaunch={(workspaceId, type) => {
        if (type === 'PYODIDE') {
          router.push(`/workspace/pyodide/${workspaceId}`);
        } else {
          router.push(`/workspace/${workspaceId}`);
        }
      }}
    />
  );
}
```

### Update Workspace API

Extend your workspace creation API to handle Pyodide workspaces:

```typescript
// app/api/workspaces/route.ts
export async function POST(request: NextRequest) {
  const { type, ...otherData } = await request.json();
  
  // Validate workspace type
  if (!['WEBVM', 'FIRECRACKER', 'PYODIDE'].includes(type)) {
    return NextResponse.json({ error: 'Invalid workspace type' }, { status: 400 });
  }
  
  // Create workspace with type-specific configuration
  const workspace = await db.workspace.create({
    data: {
      ...otherData,
      type: type as WorkspaceType,
      config: getWorkspaceConfig(type, otherData.config)
    }
  });
  
  return NextResponse.json({ workspace });
}

function getWorkspaceConfig(type: string, userConfig: any) {
  switch (type) {
    case 'PYODIDE':
      return {
        environment: {
          WORKSPACE_TYPE: 'pyodide',
          PYTHON_VERSION: '3.11',
          ...userConfig?.environment
        },
        pythonPackages: userConfig?.pythonPackages || ['numpy', 'matplotlib']
      };
    // ... other cases
  }
}
```

### Update Navigation

Add Pyodide workspace routing to your navigation:

```tsx
// components/navigation/workspace-nav.tsx
function WorkspaceNavigation({ workspace }) {
  const getWorkspaceUrl = (workspace) => {
    switch (workspace.type) {
      case 'PYODIDE':
        return `/workspace/pyodide/${workspace.id}`;
      case 'FIRECRACKER':
      case 'WEBVM':
      default:
        return `/workspace/${workspace.id}`;
    }
  };

  return (
    <Link href={getWorkspaceUrl(workspace)}>
      {workspace.name}
    </Link>
  );
}
```

## Step 5: Update Dashboard Components

### Workspace Cards

Update workspace cards to show Pyodide workspaces:

```tsx
// components/dashboard/workspace-card.tsx
import { Python, Server, Globe } from 'lucide-react';

function WorkspaceCard({ workspace }) {
  const getWorkspaceIcon = (type) => {
    switch (type) {
      case 'PYODIDE':
        return <Python className="h-5 w-5 text-green-500" />;
      case 'FIRECRACKER':
        return <Server className="h-5 w-5 text-orange-500" />;
      case 'WEBVM':
        return <Globe className="h-5 w-5 text-blue-500" />;
      default:
        return <Server className="h-5 w-5" />;
    }
  };

  const getWorkspaceDescription = (type) => {
    switch (type) {
      case 'PYODIDE':
        return 'Python workspace powered by Pyodide';
      case 'FIRECRACKER':
        return 'High-performance microVM';
      case 'WEBVM':
        return 'Browser-based Linux environment';
      default:
        return 'Development workspace';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {getWorkspaceIcon(workspace.type)}
          <CardTitle>{workspace.name}</CardTitle>
        </div>
        <CardDescription>
          {getWorkspaceDescription(workspace.type)}
        </CardDescription>
      </CardHeader>
      {/* ... rest of card */}
    </Card>
  );
}
```

### Workspace Metrics

Update metrics to include Pyodide workspaces:

```tsx
// components/dashboard/workspace-metrics.tsx
function WorkspaceMetrics({ workspaces }) {
  const metrics = workspaces.reduce((acc, workspace) => {
    acc[workspace.type] = (acc[workspace.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        title="WebVM Workspaces"
        value={metrics.WEBVM || 0}
        icon={<Globe className="h-4 w-4" />}
      />
      <MetricCard
        title="Firecracker Workspaces"
        value={metrics.FIRECRACKER || 0}
        icon={<Server className="h-4 w-4" />}
      />
      <MetricCard
        title="Python Workspaces"
        value={metrics.PYODIDE || 0}
        icon={<Python className="h-4 w-4" />}
      />
    </div>
  );
}
```

## Step 6: Update Tests

Add Pyodide tests to your test suite:

```bash
# Copy test files
cp -r __tests__/pyodide/ your-project/__tests__/

# Copy Jest configuration
cp jest.config.pyodide.js your-project/

# Update package.json scripts
```

```json
{
  "scripts": {
    "test:pyodide": "jest --config=jest.config.pyodide.js",
    "test:pyodide:watch": "jest --config=jest.config.pyodide.js --watch",
    "test:pyodide:coverage": "jest --config=jest.config.pyodide.js --coverage"
  }
}
```

## Step 7: Environment Configuration

No additional environment variables are required for Pyodide, but you may want to configure CDN settings:

```env
# .env.local (optional)
NEXT_PUBLIC_PYODIDE_CDN_URL=https://cdn.jsdelivr.net/pyodide/v0.28.0/full/
```

## Step 8: Update Documentation

Update your project documentation:

```markdown
# Your Project README.md

## Workspace Types

Your project now supports three types of workspaces:

1. **WebVM**: Browser-based Linux environment
2. **Firecracker**: High-performance microVMs
3. **Python**: Browser-based Python environment powered by Pyodide

### Creating Python Workspaces

```tsx
import { UnifiedWorkspaceLauncher } from '@/components/workspace/unified-workspace-launcher';

<UnifiedWorkspaceLauncher
  userId={userId}
  projectId={projectId}
/>
```
```

## Step 9: Deployment Considerations

### CDN Configuration

Ensure your CDN/proxy allows Pyodide assets:

```nginx
# nginx.conf
location /pyodide/ {
    proxy_pass https://cdn.jsdelivr.net/pyodide/;
    proxy_cache_valid 200 1d;
    add_header Cache-Control "public, max-age=86400";
}
```

### Content Security Policy

Update CSP headers to allow Pyodide:

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/workspace/pyodide/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net;
              worker-src 'self' blob:;
              wasm-src 'self' https://cdn.jsdelivr.net;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  }
};
```

## Step 10: Testing the Integration

1. **Create a Pyodide workspace**:
   ```bash
   curl -X POST http://localhost:3000/api/workspaces \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Python Workspace",
       "type": "PYODIDE",
       "projectId": "your-project-id"
     }'
   ```

2. **Access the workspace**:
   Navigate to `/workspace/pyodide/{workspace-id}`

3. **Test Python execution**:
   ```python
   print("Hello from Pyodide!")
   import numpy as np
   print(np.array([1, 2, 3]))
   ```

4. **Test file operations**:
   - Create Python files
   - Upload/download files
   - Install packages

## Troubleshooting

### Common Issues

1. **Pyodide fails to load**
   - Check network connectivity to CDN
   - Verify CSP headers allow Pyodide assets
   - Check browser console for errors

2. **Database migration fails**
   - Ensure no existing workspaces conflict
   - Check Prisma schema syntax
   - Verify database permissions

3. **Components not rendering**
   - Check import paths
   - Verify all dependencies installed
   - Check for TypeScript errors

4. **API routes not working**
   - Verify route file structure
   - Check authentication middleware
   - Test with curl/Postman

### Debug Mode

Enable debug logging:

```typescript
// Add to your Pyodide configuration
const runtime = new PyodideRuntime({
  stdout: console.log,
  stderr: console.error
});
```

## Rollback Plan

If you need to rollback the changes:

1. **Remove Pyodide components**:
   ```bash
   rm -rf components/pyodide/
   rm -rf app/api/workspaces/[id]/pyodide/
   rm -rf app/workspace/pyodide/
   ```

2. **Revert database schema**:
   ```prisma
   enum WorkspaceType {
     WEBVM
     FIRECRACKER
     // Remove PYODIDE
   }
   ```

3. **Remove dependencies**:
   ```bash
   pnpm remove pyodide @xterm/addon-search
   ```

4. **Revert component changes**:
   Use git to revert changes to existing components

## Support

For issues during migration:

1. Check the troubleshooting section
2. Review component documentation
3. Test with minimal configuration
4. Contact development team

## Next Steps

After successful migration:

1. **Monitor performance**: Check Pyodide loading times
2. **User feedback**: Gather feedback on Python workspace experience
3. **Package requests**: Track which Python packages users need
4. **Feature requests**: Plan additional Pyodide features
5. **Documentation**: Update user guides and tutorials
