#!/usr/bin/env tsx

import { db } from "../lib/db";
import { getUserOrganizations } from "../lib/data/organization";

async function testPyodideProjects() {
  try {
    console.log('🧪 Testing Pyodide Projects Visibility');
    console.log('=====================================');
    
    // Get user
    const user = await db.user.findUnique({
      where: { email: 'thando@soimagine.co.za' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User: ${user.name} (${user.email})`);
    
    // Get organizations
    const organizations = await getUserOrganizations(user.id);
    console.log(`📋 Organizations: ${organizations.length}`);
    
    // Test the logic from dashboard
    let currentOrganization = organizations[0]; // Default to first
    
    console.log('\n🔍 Checking organizations for Pyodide projects...');
    
    for (const org of organizations) {
      console.log(`\n🏢 Checking: ${org.name}`);
      
      const projects = await db.project.findMany({
        where: { organizationId: org.id },
        include: {
          workspaces: {
            where: { type: 'PYODIDE' },
            select: { id: true, name: true, config: true }
          }
        },
        take: 5 // Limit for testing
      });
      
      const pyodideProjects = projects.filter(p => p.workspaces.length > 0);
      console.log(`   📁 Total projects: ${projects.length}`);
      console.log(`   🐍 Pyodide projects: ${pyodideProjects.length}`);
      
      if (pyodideProjects.length > 0) {
        console.log(`   ✨ Found Pyodide projects! Setting as current organization.`);
        currentOrganization = org;
        
        // Show some details
        pyodideProjects.forEach(project => {
          console.log(`      - ${project.name}`);
          project.workspaces.forEach(ws => {
            const config = ws.config as any;
            console.log(`        └─ ${ws.name} (${config?.difficulty || 'unknown'} difficulty)`);
          });
        });
        break;
      }
    }
    
    console.log(`\n🎯 Selected Organization: ${currentOrganization.name} (${currentOrganization.id})`);
    
    // Test API call simulation
    console.log('\n🌐 Simulating API call...');
    const apiProjects = await db.project.findMany({
      where: { organizationId: currentOrganization.id },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        workspaces: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            config: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    console.log(`📊 API would return ${apiProjects.length} projects`);
    
    const pyodideApiProjects = apiProjects.filter(p => 
      p.workspaces.some(w => w.type === 'PYODIDE')
    );
    
    console.log(`🐍 Pyodide projects in API response: ${pyodideApiProjects.length}`);
    
    // Test template card logic
    console.log('\n🎨 Testing template card logic...');
    pyodideApiProjects.forEach(project => {
      const primaryWorkspace = project.workspaces[0];
      const isPyodideTemplate = primaryWorkspace?.type === 'PYODIDE' && 
        primaryWorkspace?.config?.learningObjectives && 
        (primaryWorkspace.config.learningObjectives as any[]).length > 0;
      
      console.log(`   📄 ${project.name}:`);
      console.log(`      - Primary workspace: ${primaryWorkspace?.type || 'none'}`);
      console.log(`      - Has learning objectives: ${!!(primaryWorkspace?.config as any)?.learningObjectives}`);
      console.log(`      - Objectives count: ${((primaryWorkspace?.config as any)?.learningObjectives as any[])?.length || 0}`);
      console.log(`      - Will use template card: ${isPyodideTemplate ? '✅ YES' : '❌ NO'}`);
    });
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

testPyodideProjects();
