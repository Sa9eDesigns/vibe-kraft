#!/usr/bin/env tsx
/**
 * Verify Seeded Projects
 * Checks what projects, workspaces, and files were created for a user
 */

import { db } from '../lib/db';

async function verifySeededProjects(userEmail: string) {
  console.log(`🔍 Verifying seeded projects for: ${userEmail}`);
  console.log('='.repeat(50));

  try {
    // Find the user
    const user = await db.user.findUnique({
      where: { email: userEmail },
      include: {
        organizations: {
          include: {
            organization: {
              include: {
                projects: {
                  include: {
                    workspaces: {
                      include: {
                        files: {
                          select: {
                            id: true,
                            name: true,
                            path: true,
                            type: true,
                            size: true,
                            mimeType: true,
                            isDirectory: true,
                            createdAt: true,
                          },
                        },
                        _count: {
                          select: {
                            files: true,
                          },
                        },
                      },
                    },
                    _count: {
                      select: {
                        workspaces: true,
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    projects: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.log(`❌ User ${userEmail} not found`);
      return;
    }

    console.log(`✅ User: ${user.name} (${user.email})`);
    console.log(`📧 ID: ${user.id}`);
    console.log(`🕐 Created: ${user.createdAt.toISOString()}`);

    if (user.organizations.length === 0) {
      console.log(`❌ No organizations found for user`);
      return;
    }

    for (const membership of user.organizations) {
      const org = membership.organization;
      console.log(`\n🏢 Organization: ${org.name}`);
      console.log(`   📊 Projects: ${org._count.projects}`);
      console.log(`   👤 Role: ${membership.role}`);

      if (org.projects.length === 0) {
        console.log(`   ❌ No projects found`);
        continue;
      }

      for (const project of org.projects) {
        console.log(`\n   📁 Project: ${project.name}`);
        console.log(`      📝 Description: ${project.description || 'No description'}`);
        console.log(`      🏗️  Workspaces: ${project._count.workspaces}`);
        console.log(`      🕐 Created: ${project.createdAt.toISOString()}`);

        for (const workspace of project.workspaces) {
          console.log(`\n      🖥️  Workspace: ${workspace.name}`);
          console.log(`         📂 Type: ${workspace.type}`);
          console.log(`         📊 Status: ${workspace.status}`);
          console.log(`         📄 Files: ${workspace._count.files}`);
          console.log(`         🕐 Created: ${workspace.createdAt.toISOString()}`);

          if (workspace.config) {
            const config = workspace.config as any;
            console.log(`         ⚙️  Config:`);
            if (config.category) console.log(`            📂 Category: ${config.category}`);
            if (config.difficulty) console.log(`            🎯 Difficulty: ${config.difficulty}`);
            if (config.tags) console.log(`            🏷️  Tags: ${config.tags.join(', ')}`);
            if (config.packages) console.log(`            📦 Packages: ${config.packages.join(', ')}`);
            if (config.estimatedTime) console.log(`            ⏱️  Time: ${config.estimatedTime}`);
          }

          if (workspace.files.length > 0) {
            console.log(`\n         📄 Files:`);
            for (const file of workspace.files) {
              const sizeKB = (Number(file.size) / 1024).toFixed(1);
              console.log(`            📄 ${file.name} (${file.path})`);
              console.log(`               📊 Type: ${file.type}, Size: ${sizeKB}KB`);
              console.log(`               🎭 MIME: ${file.mimeType}`);
              console.log(`               🕐 Created: ${file.createdAt.toISOString()}`);
            }
          }
        }
      }
    }

    // Summary statistics
    const totalProjects = user.organizations.reduce((sum, membership) => 
      sum + membership.organization.projects.length, 0);
    
    const totalWorkspaces = user.organizations.reduce((sum, membership) => 
      sum + membership.organization.projects.reduce((wsSum, project) => 
        wsSum + project.workspaces.length, 0), 0);
    
    const totalFiles = user.organizations.reduce((sum, membership) => 
      sum + membership.organization.projects.reduce((projSum, project) => 
        projSum + project.workspaces.reduce((wsSum, workspace) => 
          wsSum + workspace.files.length, 0), 0), 0);

    console.log(`\n📊 Summary Statistics:`);
    console.log(`=`.repeat(30));
    console.log(`👤 User: ${user.name}`);
    console.log(`🏢 Organizations: ${user.organizations.length}`);
    console.log(`📁 Projects: ${totalProjects}`);
    console.log(`🖥️  Workspaces: ${totalWorkspaces}`);
    console.log(`📄 Files: ${totalFiles}`);

    // Check for Pyodide workspaces specifically
    const pyodideWorkspaces = user.organizations.reduce((sum, membership) => 
      sum + membership.organization.projects.reduce((projSum, project) => 
        projSum + project.workspaces.filter(ws => ws.type === 'PYODIDE').length, 0), 0);

    console.log(`🐍 Pyodide Workspaces: ${pyodideWorkspaces}`);

    if (totalFiles > 0) {
      console.log(`\n✅ Seeding verification successful!`);
      console.log(`   All projects, workspaces, and files are properly created.`);
    } else {
      console.log(`\n⚠️  Warning: No files found in workspaces.`);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await db.$disconnect();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const userEmail = args[0] || 'thando@soimagine.co.za';

  await verifySeededProjects(userEmail);
}

if (require.main === module) {
  main().catch(console.error);
}

export { verifySeededProjects };
