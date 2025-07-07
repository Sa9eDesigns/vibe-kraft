'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  FolderPlus, 
  Folder, 
  Code, 
  Play, 
  Trash2, 
  Download, 
  Upload,
  GitBranch,
  Clock,
  User,
  Settings,
  ExternalLink
} from 'lucide-react';
import type { DevSandbox } from '../core/dev-sandbox';

interface Project {
  id: string;
  name: string;
  type: 'python' | 'nodejs' | 'react' | 'vue' | 'cpp' | 'rust' | 'go' | 'custom';
  description: string;
  path: string;
  createdAt: Date;
  lastModified: Date;
  author: string;
  status: 'active' | 'archived' | 'template';
  tags: string[];
  gitUrl?: string;
  size: number; // in bytes
}

interface WorkspaceManagerProps {
  sandbox: DevSandbox | null;
  onProjectSelect?: (project: Project) => void;
  onProjectCreate?: (project: Omit<Project, 'id' | 'createdAt' | 'lastModified' | 'size'>) => void;
  className?: string;
}

const PROJECT_TYPES = [
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'nodejs', label: 'Node.js', icon: '🟢' },
  { value: 'react', label: 'React', icon: '⚛️' },
  { value: 'vue', label: 'Vue.js', icon: '💚' },
  { value: 'cpp', label: 'C++', icon: '⚡' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'go', label: 'Go', icon: '🔵' },
  { value: 'custom', label: 'Custom', icon: '📦' }
];

export function WorkspaceManager({ 
  sandbox, 
  onProjectSelect, 
  onProjectCreate,
  className 
}: WorkspaceManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // New project form state
  const [newProject, setNewProject] = useState({
    name: '',
    type: 'python' as Project['type'],
    description: '',
    author: 'User',
    tags: [] as string[],
    gitUrl: ''
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadProjects();
  }, [sandbox]);

  const loadProjects = async () => {
    if (!sandbox) return;

    setIsLoading(true);
    try {
      // List projects from the sandbox filesystem
      const result = await sandbox.executeCommand('find', ['/home/user/projects', '-maxdepth', '1', '-type', 'd']);
      const projectDirs = result.stdout.split('\n').filter(dir => dir && dir !== '/home/user/projects');

      const projectList: Project[] = [];
      
      for (const dir of projectDirs) {
        const projectName = dir.split('/').pop() || '';
        const metadataPath = `${dir}/.webvm-project.json`;
        
        try {
          // Try to read project metadata
          const metadataContent = await sandbox.readFile(metadataPath);
          const metadata = JSON.parse(metadataContent);
          
          projectList.push({
            id: metadata.id || projectName,
            name: metadata.name || projectName,
            type: metadata.type || 'custom',
            description: metadata.description || '',
            path: dir,
            createdAt: new Date(metadata.createdAt || Date.now()),
            lastModified: new Date(metadata.lastModified || Date.now()),
            author: metadata.author || 'Unknown',
            status: metadata.status || 'active',
            tags: metadata.tags || [],
            gitUrl: metadata.gitUrl,
            size: metadata.size || 0
          });
        } catch {
          // Create basic project info if no metadata exists
          projectList.push({
            id: projectName,
            name: projectName,
            type: 'custom',
            description: 'Legacy project',
            path: dir,
            createdAt: new Date(),
            lastModified: new Date(),
            author: 'Unknown',
            status: 'active',
            tags: [],
            size: 0
          });
        }
      }

      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    if (!sandbox || !newProject.name.trim()) return;

    setIsLoading(true);
    try {
      const projectId = `${newProject.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
      const projectPath = `/home/user/projects/${newProject.name}`;

      // Create project using AI tools
      const aiTools = await import('../ai/ai-tools');
      const tools = new aiTools.WebVMAITools(sandbox);
      const createTool = tools.getDevelopmentTools().find(tool => tool.name === 'create_project');

      if (createTool) {
        await createTool.execute({
          name: newProject.name,
          type: newProject.type,
          description: newProject.description
        });
      }

      // Create project metadata
      const metadata = {
        id: projectId,
        name: newProject.name,
        type: newProject.type,
        description: newProject.description,
        author: newProject.author,
        tags: newProject.tags,
        gitUrl: newProject.gitUrl,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: 'active',
        size: 0
      };

      await sandbox.writeFile(`${projectPath}/.webvm-project.json`, JSON.stringify(metadata, null, 2));

      // Reset form and close dialog
      setNewProject({
        name: '',
        type: 'python',
        description: '',
        author: 'User',
        tags: [],
        gitUrl: ''
      });
      setIsCreateDialogOpen(false);

      // Reload projects
      await loadProjects();

      // Notify parent component
      if (onProjectCreate) {
        onProjectCreate({
          ...metadata,
          path: projectPath,
          status: 'active' as const
        });
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectProject = (project: Project) => {
    setSelectedProject(project);
    if (onProjectSelect) {
      onProjectSelect(project);
    }
  };

  const deleteProject = async (project: Project) => {
    if (!sandbox || !confirm(`Are you sure you want to delete "${project.name}"?`)) return;

    try {
      await sandbox.executeCommand('rm', ['-rf', project.path]);
      await loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !newProject.tags.includes(newTag.trim())) {
      setNewProject(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewProject(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProjectTypeInfo = (type: Project['type']) => {
    return PROJECT_TYPES.find(t => t.value === type) || PROJECT_TYPES[PROJECT_TYPES.length - 1];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Workspace Manager
            <Badge variant="secondary">{projects.length} projects</Badge>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    placeholder="my-awesome-project"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectType">Project Type</Label>
                  <Select value={newProject.type} onValueChange={(value: Project['type']) => 
                    setNewProject(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectDescription">Description</Label>
                  <Textarea
                    id="projectDescription"
                    placeholder="Describe your project..."
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} variant="outline" size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {newProject.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createProject} disabled={!newProject.name.trim() || isLoading} className="flex-1">
                    {isLoading ? 'Creating...' : 'Create Project'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : projects.length === 0 ? (
          <Alert>
            <FolderPlus className="h-4 w-4" />
            <AlertDescription>
              No projects found. Create your first project to get started!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {projects.map(project => {
              const typeInfo = getProjectTypeInfo(project.type);
              return (
                <div
                  key={project.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedProject?.id === project.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => selectProject(project)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{typeInfo.icon}</span>
                        <h3 className="font-medium">{project.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {project.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {project.lastModified.toLocaleDateString()}
                        </span>
                        <span>{formatFileSize(project.size)}</span>
                      </div>
                      {project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        selectProject(project);
                      }}>
                        <Code className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
