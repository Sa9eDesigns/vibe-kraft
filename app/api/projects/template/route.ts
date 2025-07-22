import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserOrganizationRole } from "@/lib/data/organization";
import { SEED_PROJECTS } from "@/components/pyodide/seed-projects/seed-project-templates";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, organizationId, customName } = body;

    if (!templateId || !organizationId) {
      return NextResponse.json({ 
        error: "Template ID and Organization ID are required" 
      }, { status: 400 });
    }

    // Check if user has permission to create projects in this organization
    const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole || (userRole !== "OWNER" && userRole !== "ADMIN" && userRole !== "MEMBER")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Find the template
    const template = SEED_PROJECTS.find(project => project.id === templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Create project from template
    const projectName = customName || template.name;
    
    const project = await db.project.create({
      data: {
        name: projectName,
        description: template.description,
        organizationId,
      },
    });

    // Create workspace
    const workspace = await db.workspace.create({
      data: {
        name: `${projectName} Workspace`,
        description: `Pyodide workspace for ${projectName}`,
        projectId: project.id,
        type: 'PYODIDE',
        status: 'INACTIVE',
        config: {
          category: template.category,
          difficulty: template.difficulty,
          tags: template.tags,
          packages: template.packages,
          estimatedTime: template.estimatedTime,
          learningObjectives: template.learningObjectives,
        },
      },
    });

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
    for (const file of template.files) {
      await createWorkspaceFile(workspace.id, file.path, file.content, template, file.description);
    }

    // Create README file
    await createWorkspaceFile(workspace.id, 'README.md', template.readme, template, 'Project documentation and getting started guide');

    // Create file indexes for searchability
    for (const file of template.files) {
      if (file.path.endsWith('.py') || file.path.endsWith('.md')) {
        await createFileIndex(workspace.id, file.path, file.content, file.path.split('.').pop() || 'text');
      }
    }

    // Create README index
    await createFileIndex(workspace.id, 'README.md', template.readme, 'md');

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        type: workspace.type,
      },
      filesCreated: template.files.length + 1, // +1 for README
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating project from template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function createWorkspaceFile(workspaceId: string, path: string, content: string, template: any, description?: string) {
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
        description: description || `${template.name} project file`,
        language: fileExtension === 'py' ? 'python' : fileExtension,
        category: template.category,
        difficulty: template.difficulty,
        createdBy: 'template',
      },
      version: 1,
    },
  });
}

async function createFileIndex(workspaceId: string, path: string, content: string, language: string) {
  try {
    // Simple tokenization for search
    const tokens = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2)
      .slice(0, 100); // Limit tokens

    // Extract basic symbols for Python files
    const symbols = language === 'py' ? extractPythonSymbols(content) : [];
    const imports = language === 'py' ? extractPythonImports(content) : [];

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
        dependencies: language === 'py' ? extractPythonDependencies(content) : [],
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

function extractPythonSymbols(content: string): any[] {
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

function extractPythonImports(content: string): any[] {
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

function extractPythonDependencies(content: string): string[] {
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
