#!/usr/bin/env tsx
/**
 * Database Seeder for Pyodide Workspaces
 * Creates sample Pyodide workspaces with seed projects
 */

import { PrismaClient } from '@prisma/client';
import { SEED_PROJECTS } from '../components/pyodide/seed-projects/seed-project-templates';

const prisma = new PrismaClient();

async function seedPyodideWorkspaces() {
  console.log('🌱 Seeding Pyodide Workspaces...');
  console.log('=' * 40);

  try {
    // Create a demo organization if it doesn't exist
    let organization = await prisma.organization.findFirst({
      where: { name: 'Demo Organization' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Demo Organization',
          slug: 'demo-org',
          description: 'Demo organization for seed projects'
        }
      });
      console.log('✅ Created demo organization');
    }

    // Create a demo user if it doesn't exist
    let user = await prisma.user.findFirst({
      where: { email: 'demo@example.com' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User',
          emailVerified: new Date()
        }
      });
      console.log('✅ Created demo user');
    }

    // Create a demo project if it doesn't exist
    let project = await prisma.project.findFirst({
      where: { 
        name: 'Python Learning Projects',
        organizationId: organization.id 
      }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'Python Learning Projects',
          description: 'Collection of Python learning projects using Pyodide',
          organizationId: organization.id,
          visibility: 'PUBLIC',
          settings: {
            allowPublicAccess: true,
            defaultWorkspaceType: 'PYODIDE'
          }
        }
      });
      console.log('✅ Created demo project');
    }

    // Create Pyodide workspaces for each seed project
    console.log('\n📦 Creating Pyodide workspaces...');
    
    for (const seedProject of SEED_PROJECTS) {
      // Check if workspace already exists
      const existingWorkspace = await prisma.workspace.findFirst({
        where: {
          name: `${seedProject.name} - Demo`,
          projectId: project.id,
          type: 'PYODIDE'
        }
      });

      if (existingWorkspace) {
        console.log(`⏭️  Workspace "${seedProject.name}" already exists, skipping...`);
        continue;
      }

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: `${seedProject.name} - Demo`,
          description: `Demo workspace for ${seedProject.description}`,
          type: 'PYODIDE',
          projectId: project.id,
          status: 'STOPPED',
          config: {
            workspaceConfig: {
              pythonPackages: seedProject.packages,
              seedProjectId: seedProject.id,
              environment: {
                WORKSPACE_TYPE: 'pyodide',
                PYTHON_VERSION: '3.11',
                SEED_PROJECT: seedProject.id
              }
            }
          },
          resources: {
            memory: '512MB',
            storage: '1GB',
            cpu: '0.5'
          }
        }
      });

      console.log(`✅ Created workspace: ${workspace.name}`);

      // Create workspace files from seed project
      for (const file of seedProject.files) {
        await prisma.workspaceFile.create({
          data: {
            workspaceId: workspace.id,
            path: file.path,
            name: file.path.split('/').pop() || file.path,
            type: 'file',
            size: BigInt(Buffer.byteLength(file.content, 'utf8')),
            mimeType: file.path.endsWith('.py') ? 'text/x-python' : 'text/plain',
            encoding: 'utf-8',
            content: file.content,
            hash: require('crypto').createHash('sha256').update(file.content).digest('hex'),
            isDirectory: false,
            permissions: {
              read: true,
              write: true,
              execute: false
            },
            metadata: {
              language: file.path.endsWith('.py') ? 'python' : 'text',
              seedProject: seedProject.id,
              description: file.description || `File from ${seedProject.name} seed project`
            },
            version: 1,
            lastAccessedAt: new Date()
          }
        });
      }

      // Create README.md file
      await prisma.workspaceFile.create({
        data: {
          workspaceId: workspace.id,
          path: 'README.md',
          name: 'README.md',
          type: 'file',
          size: BigInt(Buffer.byteLength(seedProject.readme, 'utf8')),
          mimeType: 'text/markdown',
          encoding: 'utf-8',
          content: seedProject.readme,
          hash: require('crypto').createHash('sha256').update(seedProject.readme).digest('hex'),
          isDirectory: false,
          permissions: {
            read: true,
            write: true,
            execute: false
          },
          metadata: {
            language: 'markdown',
            seedProject: seedProject.id,
            description: 'Project documentation'
          },
          version: 1,
          lastAccessedAt: new Date()
        }
      });

      // Create workspace state with installed packages
      await prisma.workspaceState.create({
        data: {
          workspaceId: workspace.id,
          sessionId: 'default',
          environment: {
            variables: {
              WORKSPACE_TYPE: 'pyodide',
              PYTHON_VERSION: '3.11',
              SEED_PROJECT: seedProject.id
            },
            path: ['/workspace'],
            workingDirectory: '/workspace',
            shell: 'python',
            locale: 'en_US.UTF-8',
            timezone: 'UTC'
          },
          processes: [],
          openFiles: seedProject.files.map(file => ({
            path: file.path,
            content: file.content,
            modified: false
          })),
          terminalSessions: [],
          editorState: {
            activeFile: seedProject.files[0]?.path,
            openTabs: seedProject.files.map(f => f.path),
            layout: {
              sidebarCollapsed: false,
              bottomCollapsed: false,
              panelSizes: {}
            }
          },
          gitState: {},
          installedPackages: seedProject.packages.map(pkg => ({
            name: pkg,
            version: 'latest',
            installed: true,
            installedAt: new Date().toISOString()
          })),
          customSettings: {
            seedProject: {
              id: seedProject.id,
              name: seedProject.name,
              loadedAt: new Date().toISOString()
            }
          }
        }
      });

      console.log(`   📁 Created ${seedProject.files.length + 1} files`);
      console.log(`   📦 Configured ${seedProject.packages.length} packages`);
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Organizations: 1`);
    console.log(`   Users: 1`);
    console.log(`   Projects: 1`);
    console.log(`   Workspaces: ${SEED_PROJECTS.length}`);
    console.log(`   Total Files: ${SEED_PROJECTS.reduce((acc, p) => acc + p.files.length + 1, 0)}`);

    console.log('\n🚀 Next Steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to /projects to see the demo project');
    console.log('3. Open any workspace to see the seed project in action');
    console.log('4. Try the different project types and difficulty levels');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedPyodideWorkspaces()
    .then(() => {
      console.log('\n✅ Database seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database seeding failed:', error);
      process.exit(1);
    });
}

export { seedPyodideWorkspaces };
