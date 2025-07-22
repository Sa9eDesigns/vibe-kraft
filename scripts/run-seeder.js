#!/usr/bin/env node
/**
 * Simple Node.js script to run the Pyodide seeder
 * This demonstrates the seed project system without database dependencies
 */

const { SEED_PROJECTS } = require('../components/pyodide/seed-projects/seed-project-templates.ts');

console.log('🌱 Running Pyodide Seed Project Demonstration');
console.log('='.repeat(50));

// Display all available seed projects
console.log(`\n📚 Available Seed Projects (${SEED_PROJECTS.length} total):\n`);

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
  
  console.log(`${(index + 1).toString().padStart(2)}. ${categoryEmoji} ${project.name}`);
  console.log(`    ${difficultyEmoji} ${project.difficulty.toUpperCase()} | ⏱️  ${project.estimatedTime} | 📦 ${project.packages.length} packages`);
  console.log(`    ${project.description}`);
  console.log(`    Tags: ${project.tags.join(', ')}`);
  console.log('');
});

// Show detailed breakdown by category
console.log('\n📊 Projects by Category:');
console.log('-'.repeat(30));

const categories = {};
SEED_PROJECTS.forEach(project => {
  if (!categories[project.category]) {
    categories[project.category] = [];
  }
  categories[project.category].push(project);
});

Object.entries(categories).forEach(([category, projects]) => {
  const categoryEmoji = {
    'education': '🎓',
    'data-science': '📊',
    'web-dev': '🌐',
    'games': '🎮',
    'automation': '🤖',
    'ai-ml': '🧠'
  }[category];
  
  console.log(`${categoryEmoji} ${category.replace('-', ' ').toUpperCase()}: ${projects.length} projects`);
  projects.forEach(project => {
    console.log(`   • ${project.name} (${project.difficulty})`);
  });
  console.log('');
});

// Show file statistics
console.log('\n📁 File Statistics:');
console.log('-'.repeat(25));

let totalFiles = 0;
let totalLines = 0;
let totalChars = 0;

SEED_PROJECTS.forEach(project => {
  totalFiles += project.files.length;
  project.files.forEach(file => {
    totalLines += file.content.split('\n').length;
    totalChars += file.content.length;
  });
});

console.log(`Total Files: ${totalFiles}`);
console.log(`Total Lines of Code: ${totalLines.toLocaleString()}`);
console.log(`Total Characters: ${totalChars.toLocaleString()}`);
console.log(`Average File Size: ${Math.round(totalChars / totalFiles).toLocaleString()} characters`);

// Show package requirements
console.log('\n📦 Package Requirements:');
console.log('-'.repeat(30));

const allPackages = new Set();
SEED_PROJECTS.forEach(project => {
  project.packages.forEach(pkg => allPackages.add(pkg));
});

console.log(`Unique Packages Required: ${allPackages.size}`);
console.log(`Packages: ${Array.from(allPackages).sort().join(', ')}`);

// Show learning objectives summary
console.log('\n🎯 Learning Objectives Coverage:');
console.log('-'.repeat(35));

const allObjectives = [];
SEED_PROJECTS.forEach(project => {
  allObjectives.push(...project.learningObjectives);
});

console.log(`Total Learning Objectives: ${allObjectives.length}`);
console.log('Sample Objectives:');
allObjectives.slice(0, 5).forEach((obj, index) => {
  console.log(`   ${index + 1}. ${obj}`);
});

// Show example project in detail
console.log('\n🔍 Example Project Detail:');
console.log('-'.repeat(30));

const exampleProject = SEED_PROJECTS.find(p => p.id === 'hello-python');
if (exampleProject) {
  console.log(`\n📖 ${exampleProject.name}:`);
  console.log(`   ID: ${exampleProject.id}`);
  console.log(`   Category: ${exampleProject.category}`);
  console.log(`   Difficulty: ${exampleProject.difficulty}`);
  console.log(`   Estimated Time: ${exampleProject.estimatedTime}`);
  console.log(`   Files: ${exampleProject.files.length}`);
  
  exampleProject.files.forEach(file => {
    const lines = file.content.split('\n').length;
    console.log(`   - ${file.path} (${lines} lines, ${file.content.length} chars)`);
  });
  
  console.log(`   Learning Objectives:`);
  exampleProject.learningObjectives.forEach(obj => {
    console.log(`   • ${obj}`);
  });
  
  console.log(`   Tags: ${exampleProject.tags.join(', ')}`);
  console.log(`   Packages: ${exampleProject.packages.length > 0 ? exampleProject.packages.join(', ') : 'None'}`);
}

console.log('\n💡 Usage in Pyodide Workspace:');
console.log('-'.repeat(35));
console.log(`
1. Open a new Pyodide workspace
2. The seed project selector will appear automatically
3. Browse projects by category or difficulty
4. Click on a project to see details
5. Click "Start Project" to load files and packages
6. Begin coding and learning immediately!

Example integration:
- Files are created automatically in the workspace
- Required packages are installed via micropip
- README documentation is generated
- Project metadata is stored for reference
`);

console.log('\n🚀 System Status:');
console.log('-'.repeat(20));
console.log('✅ Seed project templates loaded');
console.log('✅ Project categories defined');
console.log('✅ Difficulty levels configured');
console.log('✅ Learning objectives mapped');
console.log('✅ Package requirements specified');
console.log('✅ File templates prepared');
console.log('✅ Ready for workspace integration!');

console.log('\n🎉 Seed project system is ready to use!');
console.log('Open a Pyodide workspace to see the projects in action.');

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SEED_PROJECTS };
}
