"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  Code, 
  Server,
  Monitor,
  Settings,
  Download,
  Upload
} from "lucide-react";
import { toast } from "sonner";

interface WebVMTemplate {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'ai' | 'data-science' | 'web' | 'mobile' | 'custom';
  diskImage: string;
  config: {
    cpu: number;
    memory: number;
    storage: number;
    ports: number[];
    environment: Record<string, string>;
    preInstalledSoftware: string[];
  };
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WebVMTemplatesProps {
  organizationId: string;
}

export function WebVMTemplates({ organizationId }: WebVMTemplatesProps) {
  const [templates, setTemplates] = useState<WebVMTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WebVMTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [organizationId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/webvm/templates?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load WebVM templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: Partial<WebVMTemplate>) => {
    try {
      const response = await fetch('/api/webvm/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...templateData, organizationId }),
      });

      if (response.ok) {
        toast.success('Template created successfully');
        setIsCreateDialogOpen(false);
        fetchTemplates();
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/webvm/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleCloneTemplate = async (template: WebVMTemplate) => {
    try {
      const clonedTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        id: undefined,
      };

      await handleCreateTemplate(clonedTemplate);
    } catch (error) {
      console.error('Error cloning template:', error);
      toast.error('Failed to clone template');
    }
  };

  const getCategoryBadgeVariant = (category: WebVMTemplate['category']) => {
    switch (category) {
      case 'development': return 'default';
      case 'ai': return 'secondary';
      case 'data-science': return 'outline';
      case 'web': return 'default';
      case 'mobile': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WebVM Templates</CardTitle>
          <CardDescription>Loading templates...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              WebVM Templates
            </CardTitle>
            <CardDescription>
              Manage and deploy WebVM instance templates
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create WebVM Template</DialogTitle>
                <DialogDescription>
                  Create a new template for WebVM instances
                </DialogDescription>
              </DialogHeader>
              <TemplateForm onSubmit={handleCreateTemplate} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadgeVariant(template.category)}>
                      {template.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{template.config.cpu} CPU • {template.config.memory}GB RAM</div>
                      <div className="text-muted-foreground">{template.config.storage}GB Storage</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{template.usageCount} deployments</div>
                      <div className="text-muted-foreground">
                        {template.isPublic ? 'Public' : 'Private'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedTemplate(template);
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCloneTemplate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Clone
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Play className="h-4 w-4 mr-2" />
                          Deploy
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Template form component
function TemplateForm({ 
  template, 
  onSubmit 
}: { 
  template?: WebVMTemplate; 
  onSubmit: (data: Partial<WebVMTemplate>) => void;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'development',
    diskImage: template?.diskImage || '',
    config: {
      cpu: template?.config.cpu || 2,
      memory: template?.config.memory || 4,
      storage: template?.config.storage || 20,
      ports: template?.config.ports || [3000, 8080],
      environment: template?.config.environment || {},
      preInstalledSoftware: template?.config.preInstalledSoftware || [],
    },
    isPublic: template?.isPublic || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter template name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="ai">AI/ML</SelectItem>
              <SelectItem value="data-science">Data Science</SelectItem>
              <SelectItem value="web">Web Development</SelectItem>
              <SelectItem value="mobile">Mobile Development</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this template..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpu">CPU Cores</Label>
          <Input
            id="cpu"
            type="number"
            min="1"
            max="16"
            value={formData.config.cpu}
            onChange={(e) => setFormData({
              ...formData,
              config: { ...formData.config, cpu: parseInt(e.target.value) }
            })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="memory">Memory (GB)</Label>
          <Input
            id="memory"
            type="number"
            min="1"
            max="64"
            value={formData.config.memory}
            onChange={(e) => setFormData({
              ...formData,
              config: { ...formData.config, memory: parseInt(e.target.value) }
            })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="storage">Storage (GB)</Label>
          <Input
            id="storage"
            type="number"
            min="10"
            max="500"
            value={formData.config.storage}
            onChange={(e) => setFormData({
              ...formData,
              config: { ...formData.config, storage: parseInt(e.target.value) }
            })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          {template ? 'Update' : 'Create'} Template
        </Button>
      </div>
    </form>
  );
}
