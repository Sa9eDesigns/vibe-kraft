
# VibeKraft Information

## Summary
VibeKraft is a modern SaaS platform built with Next.js, designed for teams and organizations. It features a comprehensive dashboard, authentication system, and organization management capabilities. The application follows a multi-tenant architecture with organizations, projects, and tasks.

## Structure
- **app/**: Next.js application routes and pages
  - **(auth)**: Authentication-related pages
  - **(dashboard)**: Dashboard and protected routes
  - **api/**: API endpoints
- **components/**: React components organized by feature
  - **auth/**: Authentication components
  - **dashboard/**: Dashboard UI components
  - **landing/**: Landing page components
  - **ui/**: Reusable UI components
- **lib/**: Utility functions and business logic
  - **data/**: Data access functions
  - **store/**: State management with Zustand
  - **validations/**: Form validation schemas
- **prisma/**: Database schema and migrations

## Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5+
**Framework**: Next.js 15.3.4
**Runtime**: Node.js (React 19.0.0)
**Build System**: Next.js build system with Turbopack
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- **Next.js**: React framework for server-rendered applications
- **React**: UI library (v19.0.0)
- **NextAuth**: Authentication solution (v5.0.0-beta.29)
- **Prisma**: ORM for database access (v6.11.0)
- **Radix UI**: Headless UI component primitives
- **Zod**: Schema validation library
- **Zustand**: State management
- **Recharts**: Charting library
- **React Hook Form**: Form handling

**Development Dependencies**:
- **ESLint**: Code linting
- **TailwindCSS**: Utility-first CSS framework (v4)
- **TypeScript**: Static type checking

## Database
**ORM**: Prisma
**Database**: PostgreSQL
**Models**: User, Account, Session, Organization, Project, Task
**Schema**: Located in `prisma/schema.prisma`

## Authentication
**Framework**: NextAuth.js v5
**Providers**: 
- Credentials (email/password)
- Google OAuth
- GitHub OAuth
**Features**:
- JWT sessions
- Protected routes via middleware
- Role-based access control

## Build & Installation
```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Development server
npm run dev

# Production build
npm run build
npm start
```

## Testing
No specific testing framework configuration was found in the repository.

## Main Entry Points
- **app/page.tsx**: Landing page
- **app/(dashboard)/dashboard/page.tsx**: Main dashboard
- **app/(auth)/auth/login/page.tsx**: Login page
- **middleware.ts**: Route protection and authentication flow

## State Management
- **Zustand**: Client-side state management
- **Server Components**: Server-side state handling with Next.js
- **Store files**: Located in `lib/store/` directory