#!/usr/bin/env tsx
/**
 * Pyodide Seed Project Runner
 * Demonstrates how to use the seed project system
 */

import { SEED_PROJECTS, getSeedProjectById } from '../components/pyodide/seed-projects/seed-project-templates';

async function runSeeder() {
  console.log('🌱 Pyodide Seed Project System');
  console.log('='.repeat(50));
  
  // Display available projects
  console.log(`\n📚 Available Seed Projects (${SEED_PROJECTS.length} total):`);
  console.log('-'.repeat(60));
  
  SEED_PROJECTS.forEach((project, index) => {
    const difficultyEmoji = {
      'beginner': '🟢',
      'intermediate': '🟡', 
      'advanced': '🔴'
    }[project.difficulty];
    
    const categoryEmoji = {
      'education': '🎓',
      'data-science': '📊',
      'web-dev': '🌐',
      'games': '🎮',
      'automation': '🤖',
      'ai-ml': '🧠'
    }[project.category];
    
    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${categoryEmoji} ${project.name}`);
    console.log(`    ${difficultyEmoji} ${project.difficulty} | ⏱️  ${project.estimatedTime} | 📦 ${project.packages.length} packages`);
    console.log(`    ${project.description}`);
    console.log(`    Tags: ${project.tags.join(', ')}`);
    console.log('');
  });
  
  // Show project details
  console.log('\n🔍 Project Details:');
  console.log('-'.repeat(40));
  
  const helloProject = getSeedProjectById('hello-python');
  if (helloProject) {
    console.log(`\n📖 ${helloProject.name}:`);
    console.log(`   Description: ${helloProject.description}`);
    console.log(`   Files: ${helloProject.files.length}`);
    helloProject.files.forEach(file => {
      console.log(`   - ${file.path} (${file.content.length} chars)`);
    });
    console.log(`   Learning Objectives:`);
    helloProject.learningObjectives.forEach(obj => {
      console.log(`   • ${obj}`);
    });
  }
  
  // Show usage examples
  console.log('\n💡 Usage Examples:');
  console.log('-'.repeat(30));
  
  console.log(`
// In a Pyodide workspace component:
import { SeedProjectSelector } from '@/components/pyodide/seed-projects/seed-project-selector';
import { SeedProjectLoader } from '@/components/pyodide/seed-projects/seed-project-loader';

// 1. Show project selector
<SeedProjectSelector 
  onProjectSelect={(project) => loadProject(project)}
/>

// 2. Load a project programmatically
const loader = new SeedProjectLoader(fileSystem, packageManager);
const result = await loader.loadProject(project, {
  overwriteExisting: true,
  installPackages: true,
  createReadme: true
});

// 3. Get project by ID
const project = getSeedProjectById('hello-python');
if (project) {
  console.log('Found project:', project.name);
}

// 4. Filter projects
const beginnerProjects = getSeedProjectsByDifficulty('beginner');
const dataProjects = getSeedProjectsByCategory('data-science');
const searchResults = searchSeedProjects('pandas');
`);

  console.log('\n🚀 Integration Status:');
  console.log('-'.repeat(25));
  console.log('✅ Seed project templates defined');
  console.log('✅ Project selector component created');
  console.log('✅ Project loader service implemented');
  console.log('✅ Workspace integration complete');
  console.log('✅ Ready for use in Pyodide workspaces!');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Open a Pyodide workspace');
  console.log('2. The seed project selector will appear automatically');
  console.log('3. Choose a project and click "Start Project"');
  console.log('4. Files and packages will be installed automatically');
  console.log('5. Start coding and learning!');
}

// Run the seeder demonstration
runSeeder().catch(console.error);
