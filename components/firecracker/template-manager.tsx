/**
 * Firecracker Template Manager
 * Create and manage workspace templates for quick deployment
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Template,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  MoreHorizontal,
  Code,
  Database,
  Globe,
  Terminal,
  Cpu,
  MemoryStick,
  HardDrive,
  Package,
  Star,
  Clock,
  Users,
  Rocket,
  RefreshCw,
} from 'lucide-react';
import { useFirecracker } from '@/hooks/use-firecracker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface TemplateManagerProps {
  className?: string;
}

interface CreateTemplateData {
  name: string;
  description: string;
  image: string;
  memory: string;
  cpuCount: number;
  diskSize: string;
  category: 'development' | 'data-science' | 'web' | 'mobile' | 'custom';
  preInstalledSoftware: string[];
  isPublic: boolean;
}

// Mock templates data
const mockTemplates = [
  {
    id: 'tpl-1',
    name: 'Full Stack Development',
    description: 'Complete development environment with Node.js, Python, Docker, and common tools',
    image: 'vibecraft/fullstack:latest',
    memory: '4GB',
    cpuCount: 4,
    diskSize: '20GB',
    category: 'development' as const,
    preInstalledSoftware: ['Node.js 18', 'Python 3.11', 'Docker', 'Git', 'VS Code Server'],
    isPublic: true,
    usageCount: 156,
    createdAt: new Date(Date.now() - 86400000 * 7),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'tpl-2',
    name: 'Data Science Lab',
    description: 'Jupyter, pandas, scikit-learn, TensorFlow, and ML tools',
    image: 'vibecraft/datascience:latest',
    memory: '8GB',
    cpuCount: 4,
    diskSize: '30GB',
    category: 'data-science' as const,
    preInstalledSoftware: ['Jupyter Lab', 'Python 3.11', 'pandas', 'scikit-learn', 'TensorFlow'],
    isPublic: true,
    usageCount: 89,
    createdAt: new Date(Date.now() - 86400000 * 14),
    updatedAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: 'tpl-3',
    name: 'React Development',
    description: 'Modern React development with Next.js, TypeScript, and Tailwind CSS',
    image: 'vibecraft/react:latest',
    memory: '2GB',
    cpuCount: 2,
    diskSize: '15GB',
    category: 'web' as const,
    preInstalledSoftware: ['Node.js 18', 'React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    isPublic: false,
    usageCount: 34,
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000),
  },
];

const categoryIcons = {
  development: Code,
  'data-science': Database,
  web: Globe,
  mobile: Terminal,
  custom: Package,
};

const categoryColors = {
  development: 'bg-blue-100 text-blue-700',
  'data-science': 'bg-green-100 text-green-700',
  web: 'bg-purple-100 text-purple-700',
  mobile: 'bg-orange-100 text-orange-700',
  custom: 'bg-gray-100 text-gray-700',
};

export function TemplateManager({ className }: TemplateManagerProps) {
  const [templates, setTemplates] = useState(mockTemplates);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createData, setCreateData] = useState<CreateTemplateData>({
    name: '',
    description: '',
    image: '',
    memory: '2GB',
    cpuCount: 2,
    diskSize: '10GB',
    category: 'development',
    preInstalledSoftware: [],
    isPublic: false,
  });

  const { createTemplate, deleteTemplate, refreshAll } = useFirecracker();

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateTemplate = useCallback(async () => {
    if (!createData.name.trim()) {
      toast.error('Please provide a template name');
      return;
    }

    try {
      const template = await createTemplate(createData);
      
      // Add to local state (in real app, this would come from API)
      const newTemplate = {
        id: `tpl-${Date.now()}`,
        ...createData,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setTemplates(prev => [newTemplate, ...prev]);
      setShowCreateDialog(false);
      setCreateData({
        name: '',
        description: '',
        image: '',
        memory: '2GB',
        cpuCount: 2,
        diskSize: '10GB',
        category: 'development',
        preInstalledSoftware: [],
        isPublic: false,
      });
      toast.success('Template created successfully');
      refreshAll();
    } catch (error) {
      toast.error(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [createData, createTemplate, refreshAll]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setDeleteTemplateId(null);
      toast.success('Template deleted successfully');
      refreshAll();
    } catch (error) {
      toast.error(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [deleteTemplate, refreshAll]);

  const handleCloneTemplate = useCallback((template: any) => {
    setCreateData({
      name: `${template.name} (Copy)`,
      description: template.description,
      image: template.image,
      memory: template.memory,
      cpuCount: template.cpuCount,
      diskSize: template.diskSize,
      category: template.category,
      preInstalledSoftware: [...template.preInstalledSoftware],
      isPublic: false,
    });
    setShowCreateDialog(true);
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Template Manager</h2>
          <p className="text-muted-foreground">
            Create and manage workspace templates for quick deployment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template for quick workspace deployment
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        placeholder="e.g., React Development"
                        value={createData.name}
                        onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-category">Category</Label>
                      <Select
                        value={createData.category}
                        onValueChange={(value: any) => setCreateData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="data-science">Data Science</SelectItem>
                          <SelectItem value="web">Web Development</SelectItem>
                          <SelectItem value="mobile">Mobile Development</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      placeholder="Describe what this template includes..."
                      value={createData.description}
                      onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-image">Container Image</Label>
                    <Input
                      id="template-image"
                      placeholder="e.g., ubuntu:22.04 or custom/image:latest"
                      value={createData.image}
                      onChange={(e) => setCreateData(prev => ({ ...prev, image: e.target.value }))}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="config" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Memory</Label>
                      <Select
                        value={createData.memory}
                        onValueChange={(value) => setCreateData(prev => ({ ...prev, memory: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1GB">1GB</SelectItem>
                          <SelectItem value="2GB">2GB</SelectItem>
                          <SelectItem value="4GB">4GB</SelectItem>
                          <SelectItem value="8GB">8GB</SelectItem>
                          <SelectItem value="16GB">16GB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>CPU Cores</Label>
                      <Select
                        value={createData.cpuCount.toString()}
                        onValueChange={(value) => setCreateData(prev => ({ ...prev, cpuCount: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Core</SelectItem>
                          <SelectItem value="2">2 Cores</SelectItem>
                          <SelectItem value="4">4 Cores</SelectItem>
                          <SelectItem value="8">8 Cores</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Disk Size</Label>
                      <Select
                        value={createData.diskSize}
                        onValueChange={(value) => setCreateData(prev => ({ ...prev, diskSize: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10GB">10GB</SelectItem>
                          <SelectItem value="20GB">20GB</SelectItem>
                          <SelectItem value="50GB">50GB</SelectItem>
                          <SelectItem value="100GB">100GB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="software-list">Pre-installed Software (one per line)</Label>
                    <Textarea
                      id="software-list"
                      placeholder="Node.js 18&#10;Python 3.11&#10;Docker&#10;Git"
                      value={createData.preInstalledSoftware.join('\n')}
                      onChange={(e) => setCreateData(prev => ({ 
                        ...prev, 
                        preInstalledSoftware: e.target.value.split('\n').filter(s => s.trim()) 
                      }))}
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  <Template className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="data-science">Data Science</SelectItem>
            <SelectItem value="web">Web Development</SelectItem>
            <SelectItem value="mobile">Mobile Development</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Template className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'No templates match your search criteria.' 
                : 'Create your first template to get started.'
              }
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const CategoryIcon = categoryIcons[template.category];
            
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', categoryColors[template.category])}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {template.category.replace('-', ' ')}
                          </Badge>
                          {template.isPublic && (
                            <Badge variant="secondary" className="text-xs">
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleCloneTemplate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Clone Template
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Template
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export Template
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTemplateId(template.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Template
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>

                  {/* Resource Specs */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MemoryStick className="h-3 w-3" />
                      {template.memory}
                    </div>
                    <div className="flex items-center gap-1">
                      <Cpu className="h-3 w-3" />
                      {template.cpuCount} CPU
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {template.diskSize}
                    </div>
                  </div>

                  {/* Software List */}
                  {template.preInstalledSoftware.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Includes:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.preInstalledSoftware.slice(0, 3).map((software, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {software}
                          </Badge>
                        ))}
                        {template.preInstalledSoftware.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.preInstalledSoftware.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {template.usageCount} uses
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(template.updatedAt)} ago
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Rocket className="h-3 w-3 mr-1" />
                      Use Template
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCloneTemplate(template)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
              Existing workspaces using this template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateId && handleDeleteTemplate(deleteTemplateId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
