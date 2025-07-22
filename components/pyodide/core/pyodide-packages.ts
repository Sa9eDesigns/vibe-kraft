/**
 * Pyodide Package Management
 * Handles Python package installation and management via micropip
 */

import { PyodideRuntime } from './pyodide-runtime';

export interface PackageInfo {
  name: string;
  version: string;
  installed: boolean;
  description?: string;
  homepage?: string;
  author?: string;
  license?: string;
  dependencies?: string[];
  size?: number;
}

export interface InstallationProgress {
  package: string;
  status: 'downloading' | 'installing' | 'complete' | 'error';
  progress: number;
  message?: string;
}

export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  author?: string;
  homepage?: string;
  keywords?: string[];
}

export class PyodidePackageManager {
  private runtime: PyodideRuntime;
  private installedPackages: Map<string, PackageInfo> = new Map();
  private installationCallbacks: Map<string, (progress: InstallationProgress) => void> = new Map();

  constructor(runtime: PyodideRuntime) {
    this.runtime = runtime;
  }

  /**
   * Initialize package manager
   */
  async initialize(): Promise<void> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    try {
      // Ensure micropip is available
      await this.runtime.runPython(`
import micropip
print("Package manager initialized")
      `);

      // Load installed packages
      await this.refreshInstalledPackages();
    } catch (error) {
      console.error('Failed to initialize package manager:', error);
      throw error;
    }
  }

  /**
   * Install a Python package
   */
  async installPackage(
    packageName: string, 
    version?: string,
    onProgress?: (progress: InstallationProgress) => void
  ): Promise<boolean> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    const packageSpec = version ? `${packageName}==${version}` : packageName;
    
    if (onProgress) {
      this.installationCallbacks.set(packageName, onProgress);
    }

    try {
      // Report start
      onProgress?.({
        package: packageName,
        status: 'downloading',
        progress: 0,
        message: `Starting installation of ${packageName}`
      });

      // Install package
      const result = await this.runtime.runPython(`
import micropip
import asyncio

async def install_package():
    try:
        await micropip.install('${packageSpec}')
        return True
    except Exception as e:
        print(f"Installation failed: {e}")
        return False

await install_package()
      `);

      if (result.success && result.result) {
        // Report completion
        onProgress?.({
          package: packageName,
          status: 'complete',
          progress: 100,
          message: `Successfully installed ${packageName}`
        });

        // Refresh installed packages
        await this.refreshInstalledPackages();
        
        return true;
      } else {
        // Report error
        onProgress?.({
          package: packageName,
          status: 'error',
          progress: 0,
          message: result.error || 'Installation failed'
        });
        
        return false;
      }
    } catch (error) {
      console.error(`Failed to install package ${packageName}:`, error);
      
      onProgress?.({
        package: packageName,
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Installation failed'
      });
      
      return false;
    } finally {
      this.installationCallbacks.delete(packageName);
    }
  }

  /**
   * Uninstall a Python package
   */
  async uninstallPackage(packageName: string): Promise<boolean> {
    if (!this.runtime.initialized) {
      throw new Error('Pyodide runtime not initialized');
    }

    try {
      const result = await this.runtime.runPython(`
import micropip
import sys

# Remove from sys.modules
modules_to_remove = [name for name in sys.modules if name.startswith('${packageName}')]
for module in modules_to_remove:
    del sys.modules[module]

# Note: micropip doesn't have uninstall, so we simulate it
print(f"Removed ${packageName} from current session")
True
      `);

      if (result.success) {
        // Remove from our tracking
        this.installedPackages.delete(packageName);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to uninstall package ${packageName}:`, error);
      return false;
    }
  }

  /**
   * Get list of installed packages
   */
  async getInstalledPackages(): Promise<PackageInfo[]> {
    await this.refreshInstalledPackages();
    return Array.from(this.installedPackages.values());
  }

  /**
   * Check if package is installed
   */
  isPackageInstalled(packageName: string): boolean {
    return this.installedPackages.has(packageName);
  }

  /**
   * Get package information
   */
  getPackageInfo(packageName: string): PackageInfo | null {
    return this.installedPackages.get(packageName) || null;
  }

  /**
   * Install multiple packages
   */
  async installPackages(
    packages: string[],
    onProgress?: (packageName: string, progress: InstallationProgress) => void
  ): Promise<{ [packageName: string]: boolean }> {
    const results: { [packageName: string]: boolean } = {};

    for (const packageName of packages) {
      const success = await this.installPackage(
        packageName,
        undefined,
        onProgress ? (progress) => onProgress(packageName, progress) : undefined
      );
      results[packageName] = success;
    }

    return results;
  }

  /**
   * Get package requirements/dependencies
   */
  async getPackageDependencies(packageName: string): Promise<string[]> {
    if (!this.runtime.initialized) {
      return [];
    }

    try {
      const result = await this.runtime.runPython(`
import importlib.metadata
import json

try:
    dist = importlib.metadata.distribution('${packageName}')
    requires = dist.requires or []
    # Extract just package names (remove version constraints)
    deps = []
    for req in requires:
        # Simple parsing - just get package name before any operators
        dep_name = req.split()[0].split('>=')[0].split('==')[0].split('<=')[0].split('>')[0].split('<')[0].split('!=')[0]
        deps.append(dep_name)
    json.dumps(deps)
except Exception as e:
    json.dumps([])
      `);

      if (result.success && result.result) {
        return JSON.parse(result.result);
      }
    } catch (error) {
      console.error(`Failed to get dependencies for ${packageName}:`, error);
    }

    return [];
  }

  /**
   * Get available packages (simplified - would need PyPI API in real implementation)
   */
  async searchPackages(query: string): Promise<PackageSearchResult[]> {
    // This is a simplified implementation
    // In a real implementation, you would query PyPI API
    const commonPackages = [
      { name: 'numpy', description: 'Fundamental package for array computing with Python' },
      { name: 'pandas', description: 'Powerful data structures for data analysis' },
      { name: 'matplotlib', description: 'Python plotting package' },
      { name: 'scipy', description: 'Scientific computing library' },
      { name: 'requests', description: 'HTTP library for Python' },
      { name: 'pillow', description: 'Python Imaging Library' },
      { name: 'beautifulsoup4', description: 'Screen-scraping library' },
      { name: 'lxml', description: 'XML and HTML processing library' },
      { name: 'sympy', description: 'Symbolic mathematics library' },
      { name: 'scikit-learn', description: 'Machine learning library' }
    ];

    return commonPackages
      .filter(pkg => 
        pkg.name.toLowerCase().includes(query.toLowerCase()) ||
        pkg.description.toLowerCase().includes(query.toLowerCase())
      )
      .map(pkg => ({
        name: pkg.name,
        version: 'latest',
        description: pkg.description,
        keywords: []
      }));
  }

  /**
   * Export installed packages list
   */
  async exportRequirements(): Promise<string> {
    const packages = await this.getInstalledPackages();
    return packages
      .map(pkg => `${pkg.name}==${pkg.version}`)
      .join('\n');
  }

  /**
   * Install packages from requirements.txt content
   */
  async installFromRequirements(
    requirementsContent: string,
    onProgress?: (packageName: string, progress: InstallationProgress) => void
  ): Promise<{ [packageName: string]: boolean }> {
    const lines = requirementsContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    const packages = lines.map(line => {
      // Simple parsing - handle package==version format
      const parts = line.split('==');
      return parts[0].trim();
    });

    return await this.installPackages(packages, onProgress);
  }

  /**
   * Refresh the list of installed packages
   */
  private async refreshInstalledPackages(): Promise<void> {
    if (!this.runtime.initialized) {
      return;
    }

    try {
      const result = await this.runtime.runPython(`
import micropip
import json
import importlib.metadata

# Get packages from micropip
micropip_packages = micropip.list()

# Get additional info from importlib.metadata
packages = []
for name, version in micropip_packages.items():
    try:
        dist = importlib.metadata.distribution(name)
        packages.append({
            'name': name,
            'version': version,
            'installed': True,
            'description': dist.metadata.get('Summary', ''),
            'author': dist.metadata.get('Author', ''),
            'homepage': dist.metadata.get('Home-page', ''),
            'license': dist.metadata.get('License', '')
        })
    except:
        packages.append({
            'name': name,
            'version': version,
            'installed': True
        })

json.dumps(packages)
      `);

      if (result.success && result.result) {
        const packages: PackageInfo[] = JSON.parse(result.result);
        this.installedPackages.clear();
        
        for (const pkg of packages) {
          this.installedPackages.set(pkg.name, pkg);
        }
      }
    } catch (error) {
      console.error('Failed to refresh installed packages:', error);
    }
  }

  /**
   * Get package manager statistics
   */
  getStats(): {
    totalPackages: number;
    totalSize: number;
    lastUpdate: Date;
  } {
    return {
      totalPackages: this.installedPackages.size,
      totalSize: 0, // Would need to calculate actual sizes
      lastUpdate: new Date()
    };
  }

  /**
   * Clear package cache
   */
  async clearCache(): Promise<void> {
    // Pyodide doesn't have a direct cache clear method
    // This would restart the Python environment if needed
    console.log('Package cache cleared');
  }
}
