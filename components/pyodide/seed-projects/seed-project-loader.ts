/**
 * Seed Project Loader
 * Handles loading seed projects into Pyodide workspaces
 */

import { SeedProject } from './seed-project-templates';
import { PyodideFileSystem } from '../core/pyodide-filesystem';
import { PyodidePackageManager } from '../core/pyodide-packages';

export interface LoadProjectOptions {
  overwriteExisting?: boolean;
  installPackages?: boolean;
  createReadme?: boolean;
}

export interface LoadProjectResult {
  success: boolean;
  filesCreated: string[];
  packagesInstalled: string[];
  errors: string[];
  warnings: string[];
}

export class SeedProjectLoader {
  private fileSystem: PyodideFileSystem;
  private packageManager: PyodidePackageManager;

  constructor(fileSystem: PyodideFileSystem, packageManager: PyodidePackageManager) {
    this.fileSystem = fileSystem;
    this.packageManager = packageManager;
  }

  /**
   * Load a seed project into the workspace
   */
  async loadProject(
    project: SeedProject, 
    options: LoadProjectOptions = {}
  ): Promise<LoadProjectResult> {
    const {
      overwriteExisting = false,
      installPackages = true,
      createReadme = true
    } = options;

    const result: LoadProjectResult = {
      success: false,
      filesCreated: [],
      packagesInstalled: [],
      errors: [],
      warnings: []
    };

    try {
      console.log(`Loading seed project: ${project.name}`);

      // Check for existing files
      if (!overwriteExisting) {
        const conflicts = await this.checkForConflicts(project);
        if (conflicts.length > 0) {
          result.warnings.push(
            `The following files already exist and will be skipped: ${conflicts.join(', ')}`
          );
        }
      }

      // Install required packages
      if (installPackages && project.packages.length > 0) {
        console.log(`Installing ${project.packages.length} packages...`);
        const packageResults = await this.installProjectPackages(project.packages);
        result.packagesInstalled = packageResults.installed;
        result.errors.push(...packageResults.errors);
      }

      // Create project files
      console.log(`Creating ${project.files.length} project files...`);
      const fileResults = await this.createProjectFiles(project, overwriteExisting);
      result.filesCreated = fileResults.created;
      result.errors.push(...fileResults.errors);

      // Create README file
      if (createReadme) {
        try {
          const readmePath = 'README.md';
          const readmeExists = await this.fileSystem.exists(readmePath);
          
          if (!readmeExists || overwriteExisting) {
            await this.fileSystem.createFile(readmePath, project.readme);
            result.filesCreated.push(readmePath);
            console.log('Created README.md');
          } else {
            result.warnings.push('README.md already exists and was not overwritten');
          }
        } catch (error) {
          result.errors.push(`Failed to create README.md: ${error}`);
        }
      }

      // Create project metadata file
      try {
        const metadataPath = '.project-info.json';
        const metadata = {
          id: project.id,
          name: project.name,
          description: project.description,
          category: project.category,
          difficulty: project.difficulty,
          tags: project.tags,
          loadedAt: new Date().toISOString(),
          estimatedTime: project.estimatedTime,
          learningObjectives: project.learningObjectives
        };

        await this.fileSystem.createFile(
          metadataPath, 
          JSON.stringify(metadata, null, 2)
        );
        result.filesCreated.push(metadataPath);
      } catch (error) {
        result.warnings.push(`Failed to create project metadata: ${error}`);
      }

      result.success = result.errors.length === 0;
      
      if (result.success) {
        console.log(`Successfully loaded project: ${project.name}`);
        console.log(`Files created: ${result.filesCreated.length}`);
        console.log(`Packages installed: ${result.packagesInstalled.length}`);
      } else {
        console.error(`Failed to load project: ${project.name}`);
        console.error('Errors:', result.errors);
      }

    } catch (error) {
      result.errors.push(`Unexpected error loading project: ${error}`);
      result.success = false;
    }

    return result;
  }

  /**
   * Check for file conflicts before loading
   */
  private async checkForConflicts(project: SeedProject): Promise<string[]> {
    const conflicts: string[] = [];

    for (const file of project.files) {
      try {
        const exists = await this.fileSystem.exists(file.path);
        if (exists) {
          conflicts.push(file.path);
        }
      } catch (error) {
        // Ignore errors when checking existence
      }
    }

    return conflicts;
  }

  /**
   * Install project packages
   */
  private async installProjectPackages(packages: string[]): Promise<{
    installed: string[];
    errors: string[];
  }> {
    const installed: string[] = [];
    const errors: string[] = [];

    for (const packageName of packages) {
      try {
        console.log(`Installing package: ${packageName}`);
        const success = await this.packageManager.installPackage(packageName);
        
        if (success) {
          installed.push(packageName);
          console.log(`Successfully installed: ${packageName}`);
        } else {
          errors.push(`Failed to install package: ${packageName}`);
        }
      } catch (error) {
        errors.push(`Error installing ${packageName}: ${error}`);
      }
    }

    return { installed, errors };
  }

  /**
   * Create project files
   */
  private async createProjectFiles(
    project: SeedProject, 
    overwrite: boolean
  ): Promise<{
    created: string[];
    errors: string[];
  }> {
    const created: string[] = [];
    const errors: string[] = [];

    for (const file of project.files) {
      try {
        const exists = await this.fileSystem.exists(file.path);
        
        if (exists && !overwrite) {
          console.log(`Skipping existing file: ${file.path}`);
          continue;
        }

        // Create directory if needed
        const pathParts = file.path.split('/');
        if (pathParts.length > 1) {
          const dirPath = pathParts.slice(0, -1).join('/');
          try {
            await this.fileSystem.createDirectory(dirPath);
          } catch (error) {
            // Directory might already exist, ignore error
          }
        }

        // Create the file
        await this.fileSystem.createFile(file.path, file.content);
        created.push(file.path);
        console.log(`Created file: ${file.path}`);

      } catch (error) {
        errors.push(`Failed to create ${file.path}: ${error}`);
      }
    }

    return { created, errors };
  }

  /**
   * Get project information from workspace
   */
  async getProjectInfo(): Promise<any | null> {
    try {
      const metadataPath = '.project-info.json';
      const exists = await this.fileSystem.exists(metadataPath);
      
      if (!exists) {
        return null;
      }

      const content = await this.fileSystem.readFile(metadataPath);
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read project info:', error);
      return null;
    }
  }

  /**
   * Check if workspace has a loaded seed project
   */
  async hasLoadedProject(): Promise<boolean> {
    try {
      const info = await this.getProjectInfo();
      return info !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear workspace (remove all files)
   */
  async clearWorkspace(): Promise<void> {
    try {
      const files = await this.fileSystem.listDirectory();
      
      for (const file of files) {
        try {
          await this.fileSystem.delete(file.path);
          console.log(`Deleted: ${file.path}`);
        } catch (error) {
          console.error(`Failed to delete ${file.path}:`, error);
        }
      }

      console.log('Workspace cleared');
    } catch (error) {
      console.error('Failed to clear workspace:', error);
      throw error;
    }
  }

  /**
   * Create a custom project structure
   */
  async createCustomProject(
    name: string,
    files: { path: string; content: string }[],
    packages: string[] = []
  ): Promise<LoadProjectResult> {
    const customProject: SeedProject = {
      id: 'custom-' + Date.now(),
      name,
      description: 'Custom project',
      category: 'education',
      difficulty: 'beginner',
      tags: ['custom'],
      packages,
      files,
      readme: `# ${name}\n\nA custom Python project.\n`,
      estimatedTime: 'Variable',
      learningObjectives: ['Practice Python programming']
    };

    return this.loadProject(customProject);
  }

  /**
   * Export current workspace as a seed project template
   */
  async exportAsTemplate(
    name: string,
    description: string,
    category: SeedProject['category'] = 'education',
    difficulty: SeedProject['difficulty'] = 'beginner',
    tags: string[] = []
  ): Promise<SeedProject> {
    try {
      const files = await this.fileSystem.listDirectory();
      const projectFiles: SeedProject['files'] = [];

      for (const file of files) {
        if (file.type === 'file' && !file.name.startsWith('.')) {
          try {
            const content = await this.fileSystem.readFile(file.path);
            projectFiles.push({
              path: file.path,
              content,
              description: `${file.name} file`
            });
          } catch (error) {
            console.error(`Failed to read ${file.path}:`, error);
          }
        }
      }

      // Get installed packages
      const installedPackages = await this.packageManager.getInstalledPackages();
      const packages = installedPackages
        .filter(pkg => pkg.installed && !['micropip'].includes(pkg.name))
        .map(pkg => pkg.name);

      const template: SeedProject = {
        id: 'exported-' + Date.now(),
        name,
        description,
        category,
        difficulty,
        tags,
        packages,
        files: projectFiles,
        readme: `# ${name}\n\n${description}\n\n## Files\n\n${projectFiles.map(f => `- \`${f.path}\``).join('\n')}\n`,
        estimatedTime: 'Variable',
        learningObjectives: ['Learn from this exported project']
      };

      return template;
    } catch (error) {
      console.error('Failed to export workspace as template:', error);
      throw error;
    }
  }
}
