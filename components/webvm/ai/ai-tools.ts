// AI Tools for WebVM Integration
import type { DevSandbox } from '../core/dev-sandbox';
import type { AITool, CommandResult, FileInfo } from '../types';

export class WebVMAITools {
  private sandbox: DevSandbox;

  constructor(sandbox: DevSandbox) {
    this.sandbox = sandbox;
  }

  // Bash tool for terminal control
  getBashTool(): AITool {
    return {
      name: 'bash',
      description: 'Execute bash commands in the WebVM terminal. Use this to run commands, install packages, compile code, etc.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The bash command to execute'
          }
        },
        required: ['command']
      },
      execute: async ({ command }: { command: string }) => {
        try {
          const result = await this.sandbox.executeCommand('/bin/bash', ['-c', command], {
            env: [
              'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
              'HOME=/home/user',
              'USER=user',
              'SHELL=/bin/bash',
              'TERM=xterm-256color'
            ],
            cwd: '/home/user'
          });

          return {
            success: result.exitCode === 0,
            output: result.stdout,
            error: result.stderr,
            exitCode: result.exitCode,
            command: command
          };
        } catch (error) {
          return {
            success: false,
            output: '',
            error: error instanceof Error ? error.message : String(error),
            exitCode: 1,
            command: command
          };
        }
      }
    };
  }

  // File system tools
  getFileSystemTools(): AITool[] {
    return [
      {
        name: 'read_file',
        description: 'Read the contents of a file',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The file path to read'
            }
          },
          required: ['path']
        },
        execute: async ({ path }: { path: string }) => {
          try {
            const content = await this.sandbox.readFile(path);
            return {
              success: true,
              content,
              path
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
              path
            };
          }
        }
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The file path to write to'
            },
            content: {
              type: 'string',
              description: 'The content to write to the file'
            }
          },
          required: ['path', 'content']
        },
        execute: async ({ path, content }: { path: string; content: string }) => {
          try {
            await this.sandbox.writeFile(path, content);
            return {
              success: true,
              path,
              message: `Successfully wrote to ${path}`
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
              path
            };
          }
        }
      },
      {
        name: 'list_files',
        description: 'List files and directories in a path',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The directory path to list',
              default: '/home/user'
            }
          }
        },
        execute: async ({ path = '/home/user' }: { path?: string }) => {
          try {
            const files = await this.sandbox.listFiles(path);
            return {
              success: true,
              files: files.map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
                permissions: file.permissions
              })),
              path
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
              path
            };
          }
        }
      }
    ];
  }

  // Development tools
  getDevelopmentTools(): AITool[] {
    return [
      {
        name: 'create_project',
        description: 'Create a new development project with a specific structure',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name'
            },
            type: {
              type: 'string',
              enum: ['python', 'nodejs', 'react', 'vue', 'cpp', 'rust', 'go'],
              description: 'Project type'
            },
            description: {
              type: 'string',
              description: 'Project description'
            }
          },
          required: ['name', 'type']
        },
        execute: async ({ name, type, description = '' }: { 
          name: string; 
          type: string; 
          description?: string; 
        }) => {
          try {
            const projectPath = `/home/user/projects/${name}`;
            
            // Create project directory
            await this.sandbox.executeCommand('mkdir', ['-p', projectPath]);
            
            // Create project structure based on type
            const templates = this.getProjectTemplates();
            const template = templates[type as keyof typeof templates];
            
            if (template) {
              for (const file of template.files) {
                const filePath = `${projectPath}/${file.path}`;
                const dir = filePath.substring(0, filePath.lastIndexOf('/'));
                
                // Create directory if needed
                if (dir !== projectPath) {
                  await this.sandbox.executeCommand('mkdir', ['-p', dir]);
                }
                
                // Write file content
                await this.sandbox.writeFile(filePath, file.content.replace('{{PROJECT_NAME}}', name).replace('{{DESCRIPTION}}', description));
              }
            }
            
            return {
              success: true,
              projectPath,
              type,
              message: `Created ${type} project: ${name}`
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        }
      },
      {
        name: 'run_tests',
        description: 'Run tests for a project',
        parameters: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory'
            },
            testCommand: {
              type: 'string',
              description: 'Custom test command (optional)'
            }
          },
          required: ['projectPath']
        },
        execute: async ({ projectPath, testCommand }: { projectPath: string; testCommand?: string }) => {
          try {
            // Auto-detect test command if not provided
            let command = testCommand;
            
            if (!command) {
              const packageJsonExists = await this.fileExists(`${projectPath}/package.json`);
              const requirementsExists = await this.fileExists(`${projectPath}/requirements.txt`);
              const cargoTomlExists = await this.fileExists(`${projectPath}/Cargo.toml`);
              
              if (packageJsonExists) {
                command = 'npm test';
              } else if (requirementsExists) {
                command = 'python -m pytest';
              } else if (cargoTomlExists) {
                command = 'cargo test';
              } else {
                command = 'echo "No test framework detected"';
              }
            }
            
            const result = await this.sandbox.executeCommand('/bin/bash', ['-c', command], {
              cwd: projectPath
            });
            
            return {
              success: result.exitCode === 0,
              output: result.stdout,
              error: result.stderr,
              command,
              projectPath
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        }
      }
    ];
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await this.sandbox.executeCommand('test', ['-f', path]);
      return true;
    } catch {
      return false;
    }
  }

  private getProjectTemplates() {
    return {
      python: {
        files: [
          {
            path: 'main.py',
            content: `#!/usr/bin/env python3
"""
{{PROJECT_NAME}}
{{DESCRIPTION}}
"""

def main():
    print("Hello from {{PROJECT_NAME}}!")

if __name__ == "__main__":
    main()
`
          },
          {
            path: 'requirements.txt',
            content: `# {{PROJECT_NAME}} dependencies
pytest>=7.0.0
`
          },
          {
            path: 'README.md',
            content: `# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Installation

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage

\`\`\`bash
python main.py
\`\`\`

## Testing

\`\`\`bash
pytest
\`\`\`
`
          }
        ]
      },
      nodejs: {
        files: [
          {
            path: 'package.json',
            content: `{
  "name": "{{PROJECT_NAME}}",
  "version": "1.0.0",
  "description": "{{DESCRIPTION}}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
`
          },
          {
            path: 'index.js',
            content: `// {{PROJECT_NAME}}
// {{DESCRIPTION}}

console.log('Hello from {{PROJECT_NAME}}!');

module.exports = {
  greet: (name) => \`Hello, \${name}!\`
};
`
          },
          {
            path: 'README.md',
            content: `# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`
`
          }
        ]
      }
    };
  }

  // Get all available tools
  getAllTools(): AITool[] {
    return [
      this.getBashTool(),
      ...this.getFileSystemTools(),
      ...this.getDevelopmentTools()
    ];
  }
}
