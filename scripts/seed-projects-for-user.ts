#!/usr/bin/env tsx
/**
 * Seed Projects and Files for User
 * Creates projects and workspaces with seed project templates for a specific user
 */

import { WorkspaceType } from '../lib/generated/prisma';
import { SEED_PROJECTS } from '../components/pyodide/seed-projects/seed-project-templates';
import { db } from '../lib/db';
import { createHash } from 'crypto';

interface SeedingStats {
  projectsCreated: number;
  workspacesCreated: number;
  filesCreated: number;
  errors: Array<{ item: string; error: string }>;
}

class ProjectSeeder {
  private stats: SeedingStats = {
    projectsCreated: 0,
    workspacesCreated: 0,
    filesCreated: 0,
    errors: [],
  };

  async seedProjectsForUser(userEmail: string) {
    console.log(`🌱 Seeding projects for user: ${userEmail}`);
    console.log('='.repeat(50));

    try {
      // 1. Find the user
      const user = await db.user.findUnique({
        where: { email: userEmail },
        include: {
          organizations: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
      }

      console.log(`✅ Found user: ${user.name} (${user.email})`);

      // 2. Get or create organization
      let organization;
      if (user.organizations.length > 0) {
        organization = user.organizations[0].organization;
        console.log(`✅ Using existing organization: ${organization.name}`);
      } else {
        // Create a personal organization
        organization = await db.organization.create({
          data: {
            name: `${user.name}'s Organization`,
            slug: `${user.name?.toLowerCase().replace(/\s+/g, '-')}-org`,
            description: 'Personal organization for development projects',
            members: {
              create: {
                userId: user.id,
                role: 'OWNER',
              },
            },
          },
        });
        console.log(`✅ Created organization: ${organization.name}`);
      }

      // 3. Create projects and workspaces for each seed project
      for (const seedProject of SEED_PROJECTS) {
        await this.createProjectFromSeed(seedProject, organization.id, user.id);
      }

      // 4. Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    } finally {
      // db.$disconnect() is handled by the db module
    }
  }

  private async createProjectFromSeed(seedProject: any, organizationId: string, userId: string) {
    try {
      console.log(`\n📁 Creating project: ${seedProject.name}`);

      // Create project
      const project = await db.project.create({
        data: {
          name: seedProject.name,
          description: seedProject.description,
          organizationId,
        },
      });

      console.log(`✅ Created project: ${project.name} (${project.id})`);
      this.stats.projectsCreated++;

      // Create workspace
      const workspace = await db.workspace.create({
        data: {
          name: `${seedProject.name} Workspace`,
          description: `Pyodide workspace for ${seedProject.name}`,
          projectId: project.id,
          type: WorkspaceType.PYODIDE,
          status: 'INACTIVE',
          config: {
            category: seedProject.category,
            difficulty: seedProject.difficulty,
            tags: seedProject.tags,
            packages: seedProject.packages,
            estimatedTime: seedProject.estimatedTime,
            learningObjectives: seedProject.learningObjectives,
          },
        },
      });

      console.log(`✅ Created workspace: ${workspace.name} (${workspace.id})`);
      this.stats.workspacesCreated++;

      // Create workspace persistence
      await db.workspacePersistence.create({
        data: {
          workspaceId: workspace.id,
          storageSize: 0,
          backupCount: 0,
          config: {
            autoBackup: true,
            retentionDays: 30,
          },
        },
      });

      // Create files
      await this.createFilesForWorkspace(workspace.id, seedProject);

      // Create README file
      await this.createReadmeFile(workspace.id, seedProject);

      // Store files in storage backend (if configured)
      await this.storeFilesInStorage(workspace.id, seedProject);

    } catch (error) {
      console.error(`❌ Failed to create project ${seedProject.name}:`, error);
      this.stats.errors.push({
        item: seedProject.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async createFilesForWorkspace(workspaceId: string, seedProject: any) {
    console.log(`  📄 Creating ${seedProject.files.length} files...`);

    for (const file of seedProject.files) {
      try {
        await this.createWorkspaceFile(workspaceId, file.path, file.content, seedProject, file.description);
        console.log(`    ✅ Created file: ${file.path}`);
        this.stats.filesCreated++;
      } catch (error) {
        console.error(`    ❌ Failed to create file ${file.path}:`, error);
        this.stats.errors.push({
          item: `${seedProject.name}/${file.path}`,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async createReadmeFile(workspaceId: string, seedProject: any) {
    try {
      await this.createWorkspaceFile(workspaceId, 'README.md', seedProject.readme, seedProject, 'Project documentation and getting started guide');
      console.log(`    ✅ Created README.md`);
      this.stats.filesCreated++;
    } catch (error) {
      console.error(`    ❌ Failed to create README.md:`, error);
      this.stats.errors.push({
        item: `${seedProject.name}/README.md`,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async storeFilesInStorage(workspaceId: string, seedProject: any) {
    try {
      console.log(`  💾 Attempting to store files in storage backend...`);

      // Dynamically import the storage service to avoid initialization errors
      const { WorkspaceFileStorage } = await import('../lib/workspace/services/file-storage');
      const fileStorage = new WorkspaceFileStorage(workspaceId);

      // Store all project files
      for (const file of seedProject.files) {
        try {
          await fileStorage.storeFile(file.path, file.content, {
            description: file.description || `${seedProject.name} project file`,
            category: seedProject.category,
            difficulty: seedProject.difficulty,
            language: file.path.endsWith('.py') ? 'python' : 'text',
            createdBy: 'seed-script',
          });
          console.log(`    💾 Stored in backend: ${file.path}`);
        } catch (error) {
          console.warn(`    ⚠️  Storage warning for ${file.path}:`, (error as Error).message);
          // Don't fail the entire process for storage issues
        }
      }

      // Store README
      try {
        await fileStorage.storeFile('README.md', seedProject.readme, {
          description: 'Project documentation and getting started guide',
          category: seedProject.category,
          difficulty: seedProject.difficulty,
          language: 'markdown',
          createdBy: 'seed-script',
        });
        console.log(`    💾 Stored in backend: README.md`);
      } catch (error) {
        console.warn(`    ⚠️  Storage warning for README.md:`, (error as Error).message);
      }

    } catch (error) {
      console.warn(`  ⚠️  Storage backend not available:`, (error as Error).message);
      console.log(`  ℹ️  Files are still stored in the database`);
      // Don't fail the seeding process if storage is not configured
    }
  }

  private async createWorkspaceFile(workspaceId: string, path: string, content: string, seedProject: any, description?: string) {
    const fileHash = createHash('sha256').update(content).digest('hex');
    const fileName = path.split('/').pop() || path;
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Determine file type and MIME type
    const mimeTypeMap: Record<string, string> = {
      'py': 'text/x-python',
      'md': 'text/markdown',
      'txt': 'text/plain',
      'json': 'application/json',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'html': 'text/html',
      'css': 'text/css',
    };

    const mimeType = mimeTypeMap[fileExtension] || 'text/plain';
    const fileType = fileExtension === 'py' ? 'PYTHON' : 'TEXT';

    // Create the file record
    await db.workspaceFile.create({
      data: {
        workspaceId,
        path: path.startsWith('/') ? path : `/${path}`,
        name: fileName,
        type: fileType,
        size: Buffer.byteLength(content, 'utf8'),
        mimeType,
        encoding: 'utf-8',
        content,
        hash: fileHash,
        isDirectory: false,
        permissions: {
          read: true,
          write: true,
          execute: fileExtension === 'py',
        },
        metadata: {
          description: description || `${seedProject.name} project file`,
          language: fileExtension === 'py' ? 'python' : fileExtension,
          category: seedProject.category,
          difficulty: seedProject.difficulty,
          createdBy: 'seed-script',
        },
        version: 1,
      },
    });

    // Create file index for searchability
    if (fileType === 'PYTHON' || fileExtension === 'md') {
      await this.createFileIndex(workspaceId, path, content, fileExtension);
    }
  }

  private async createFileIndex(workspaceId: string, path: string, content: string, language: string) {
    try {
      // Simple tokenization for search
      const tokens = content
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 2)
        .slice(0, 100); // Limit tokens

      // Extract basic symbols for Python files
      const symbols = language === 'py' ? this.extractPythonSymbols(content) : [];
      const imports = language === 'py' ? this.extractPythonImports(content) : [];

      await db.fileIndex.create({
        data: {
          workspaceId,
          path: path.startsWith('/') ? path : `/${path}`,
          content,
          tokens,
          language,
          symbols,
          imports,
          exports: [],
          dependencies: language === 'py' ? this.extractPythonDependencies(content) : [],
          complexity: {
            lines: content.split('\n').length,
            functions: symbols.filter((s: any) => s.type === 'function').length,
            classes: symbols.filter((s: any) => s.type === 'class').length,
          },
        },
      });
    } catch (error) {
      console.warn(`Warning: Failed to create file index for ${path}:`, error);
    }
  }

  private extractPythonSymbols(content: string): any[] {
    const symbols = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Extract function definitions
      const funcMatch = line.match(/^def\s+(\w+)\s*\(/);
      if (funcMatch) {
        symbols.push({
          name: funcMatch[1],
          type: 'function',
          line: i + 1,
        });
      }

      // Extract class definitions
      const classMatch = line.match(/^class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          type: 'class',
          line: i + 1,
        });
      }
    }

    return symbols;
  }

  private extractPythonImports(content: string): any[] {
    const imports = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Extract import statements
      const importMatch = trimmed.match(/^import\s+(.+)/);
      if (importMatch) {
        imports.push({
          module: importMatch[1].split(',')[0].trim(),
          type: 'import',
        });
      }

      // Extract from imports
      const fromMatch = trimmed.match(/^from\s+(\S+)\s+import/);
      if (fromMatch) {
        imports.push({
          module: fromMatch[1],
          type: 'from_import',
        });
      }
    }

    return imports;
  }

  private extractPythonDependencies(content: string): string[] {
    const dependencies = new Set<string>();
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Common Python packages
      const packages = ['pandas', 'numpy', 'matplotlib', 'requests', 'beautifulsoup4', 'math', 'random', 'datetime', 'json'];
      
      for (const pkg of packages) {
        if (trimmed.includes(pkg)) {
          dependencies.add(pkg);
        }
      }
    }

    return Array.from(dependencies);
  }

  private printSummary() {
    console.log('\n📊 Seeding Summary:');
    console.log('='.repeat(30));
    console.log(`✅ Projects created: ${this.stats.projectsCreated}`);
    console.log(`✅ Workspaces created: ${this.stats.workspacesCreated}`);
    console.log(`✅ Files created: ${this.stats.filesCreated}`);
    console.log(`❌ Errors: ${this.stats.errors.length}`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ Error Details:');
      this.stats.errors.forEach(({ item, error }) => {
        console.log(`  - ${item}: ${error}`);
      });
    }

    const successRate = ((this.stats.projectsCreated / SEED_PROJECTS.length) * 100).toFixed(1);
    console.log(`\n📈 Success rate: ${successRate}%`);
    console.log('\n🎉 Seeding completed!');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const userEmail = args[0] || 'thando@soimagine.co.za';

  console.log('🌱 VibeKraft Project Seeder');
  console.log('='.repeat(40));
  console.log(`Target user: ${userEmail}`);
  console.log(`Seed projects: ${SEED_PROJECTS.length}`);

  const seeder = new ProjectSeeder();
  await seeder.seedProjectsForUser(userEmail);
}

if (require.main === module) {
  main().catch(console.error);
}

export { ProjectSeeder };
