# Project Seeding for VibeKraft

This document explains how to seed the database with projects and files for users, specifically using the Pyodide seed project templates.

## Overview

The project seeding system creates complete projects with workspaces and files for users, making it easy to get started with development. It uses the seed project templates from `components/pyodide/seed-projects/seed-project-templates.ts`.

## Seed Projects Available

The system includes 5 comprehensive seed projects:

### 1. **Hello Python** (Beginner)
- **Category**: Education
- **Files**: `main.py`, `exercises.py`, `README.md`
- **Focus**: Python basics, variables, functions, loops
- **Time**: 15 minutes

### 2. **Data Analysis with Pandas** (Intermediate)
- **Category**: Data Science
- **Files**: `data_analysis.py`, `data_exercises.py`, `README.md`
- **Packages**: pandas, numpy, matplotlib
- **Focus**: Data manipulation, visualization, statistics
- **Time**: 45 minutes

### 3. **Web Scraping with Requests** (Intermediate)
- **Category**: Web Development
- **Files**: `web_scraper.py`, `README.md`
- **Packages**: requests, beautifulsoup4
- **Focus**: HTTP requests, API interaction, JSON parsing
- **Time**: 30 minutes

### 4. **Interactive Calculator** (Beginner)
- **Category**: Education
- **Files**: `calculator.py`, `README.md`
- **Packages**: math
- **Focus**: Classes, user input, error handling, math operations
- **Time**: 25 minutes

### 5. **Text Adventure Game** (Intermediate)
- **Category**: Games
- **Files**: `adventure_game.py`, `README.md`
- **Packages**: random
- **Focus**: OOP, game mechanics, state management
- **Time**: 40 minutes

## How It Works

### Database Structure

For each seed project, the system creates:

1. **Project** - Main project container
2. **Workspace** - Pyodide workspace linked to the project
3. **WorkspaceFiles** - All project files stored in the database
4. **FileIndex** - Search indexes for Python and Markdown files
5. **WorkspacePersistence** - Persistence configuration

### File Storage

Files are stored in two places:
- **Database**: File metadata and content in `WorkspaceFile` table
- **Storage Backend**: File content in MinIO/Appwrite (if configured)

### File Indexing

Python and Markdown files are automatically indexed with:
- **Tokens**: For full-text search
- **Symbols**: Functions and classes extracted from Python code
- **Imports**: Import statements and dependencies
- **Complexity**: Lines of code, function count, class count

## Usage

### Command Line

```bash
# Seed projects for default user (thando@soimagine.co.za)
pnpm run seed:projects

# Seed projects for specific user
pnpm run seed:projects:user user@example.com

# Using the shell script
./scripts/run-seed-projects.sh user@example.com

# Direct execution
npx tsx scripts/seed-projects-for-user.ts user@example.com
```

### Programmatic Usage

```typescript
import { ProjectSeeder } from './scripts/seed-projects-for-user';

const seeder = new ProjectSeeder();
await seeder.seedProjectsForUser('user@example.com');
```

## Requirements

### Database
- PostgreSQL database configured
- Prisma schema up to date
- User must exist in the database

### Environment
- `DATABASE_URL` configured
- Storage backend optional (MinIO/Appwrite)

### Dependencies
- All required packages installed (`pnpm install`)
- TypeScript execution environment (`tsx`)

## What Gets Created

### For User: `thando@soimagine.co.za`

The script will create:
- **5 Projects** - One for each seed project template
- **5 Workspaces** - Pyodide workspaces for each project
- **15+ Files** - All project files including README files
- **File Indexes** - Search indexes for Python and Markdown files
- **Persistence Config** - Backup and storage configuration

### Project Structure Example

```
📁 Hello Python
├── 🏗️ Hello Python Workspace (Pyodide)
│   ├── 📄 main.py
│   ├── 📄 exercises.py
│   └── 📄 README.md
└── ⚙️ Configuration
    ├── Category: education
    ├── Difficulty: beginner
    ├── Tags: [basics, introduction, tutorial]
    └── Learning Objectives: [...]
```

## Features

### Comprehensive Metadata
- Project categories and difficulty levels
- Learning objectives and estimated time
- File descriptions and language detection
- Package dependencies tracking

### Search Integration
- Full-text search across all files
- Symbol-based code navigation
- Import and dependency tracking
- Language-aware indexing

### Storage Integration
- Database storage for metadata
- Optional backend storage (MinIO/Appwrite)
- File versioning and hashing
- Automatic backup configuration

### Error Handling
- Graceful error handling for individual files
- Detailed error reporting
- Partial success support
- Storage backend fallback

## Monitoring

The script provides detailed output:

```
🌱 Seeding projects for user: thando@soimagine.co.za
==================================================
✅ Found user: Thando Zungu (thando@soimagine.co.za)
✅ Using existing organization: Thando Zungu's Organization

📁 Creating project: Hello Python
✅ Created project: Hello Python (cuid123...)
✅ Created workspace: Hello Python Workspace (cuid456...)
  📄 Creating 2 files...
    ✅ Created file: main.py
    ✅ Created file: exercises.py
    ✅ Created README.md
  💾 Storing files in storage backend...
    💾 Stored in backend: main.py
    💾 Stored in backend: exercises.py
    💾 Stored in backend: README.md

📊 Seeding Summary:
==============================
✅ Projects created: 5
✅ Workspaces created: 5
✅ Files created: 15
❌ Errors: 0
📈 Success rate: 100.0%
🎉 Seeding completed!
```

## Troubleshooting

### Common Issues

1. **User not found**
   ```
   Error: User with email user@example.com not found
   ```
   **Solution**: Create the user first or use existing user email

2. **Database connection failed**
   ```
   Error: Can't reach database server
   ```
   **Solution**: Check `DATABASE_URL` and database status

3. **Storage backend warnings**
   ```
   Warning: Storage backend not available
   ```
   **Solution**: Configure MinIO/Appwrite or ignore (files still stored in DB)

### Verification

After seeding, verify the results:

```sql
-- Check created projects
SELECT p.name, p.description, o.name as organization
FROM "Project" p
JOIN "Organization" o ON p."organizationId" = o.id
WHERE o.name LIKE '%Thando%';

-- Check workspaces
SELECT w.name, w.type, w.status, p.name as project
FROM "Workspace" w
JOIN "Project" p ON w."projectId" = p.id
WHERE w.type = 'PYODIDE';

-- Check files
SELECT wf.name, wf.path, wf.type, w.name as workspace
FROM "WorkspaceFile" wf
JOIN "Workspace" w ON wf."workspaceId" = w.id
WHERE w.type = 'PYODIDE';
```

## Next Steps

After seeding:

1. **Login** as the user to see the projects
2. **Create Workspaces** from the projects in the UI
3. **Start Coding** with the pre-loaded templates
4. **Explore Features** like file search and code navigation
5. **Customize** projects by adding more files or modifying existing ones

The seeded projects provide a comprehensive starting point for learning Python development in the browser with Pyodide!
