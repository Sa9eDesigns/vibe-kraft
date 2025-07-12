"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  Bot, 
  Settings, 
  Trash2, 
  Edit, 
  Play, 
  Pause,
  BarChart3,
  Zap,
  Shield,
  Key,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  model: string;
  description: string;
  capabilities: string[];
  pricing: {
    inputTokens: number;
    outputTokens: number;
    currency: string;
  };
  limits: {
    maxTokens: number;
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  config: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  isEnabled: boolean;
  isDefault: boolean;
  status: 'active' | 'inactive' | 'error';
  usage: {
    requestsToday: number;
    tokensUsed: number;
    avgResponseTime: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AIConfigurationProps {
  organizationId: string;
}

export function AIConfiguration({ organizationId }: AIConfigurationProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("models");

  useEffect(() => {
    fetchAIModels();
  }, [organizationId]);

  const fetchAIModels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/models?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Failed to fetch AI models:', error);
      toast.error('Failed to load AI models');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async (modelData: Partial<AIModel>) => {
    try {
      const response = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...modelData, organizationId }),
      });

      if (response.ok) {
        toast.success('AI model configured successfully');
        setIsCreateDialogOpen(false);
        fetchAIModels();
      } else {
        throw new Error('Failed to configure model');
      }
    } catch (error) {
      console.error('Error configuring model:', error);
      toast.error('Failed to configure AI model');
    }
  };

  const handleToggleModel = async (modelId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/ai/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: enabled }),
      });

      if (response.ok) {
        toast.success(`Model ${enabled ? 'enabled' : 'disabled'} successfully`);
        fetchAIModels();
      } else {
        throw new Error('Failed to update model');
      }
    } catch (error) {
      console.error('Error updating model:', error);
      toast.error('Failed to update model status');
    }
  };

  const handleSetDefault = async (modelId: string) => {
    try {
      const response = await fetch(`/api/ai/models/${modelId}/default`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Default model updated successfully');
        fetchAIModels();
      } else {
        throw new Error('Failed to set default model');
      }
    } catch (error) {
      console.error('Error setting default model:', error);
      toast.error('Failed to set default model');
    }
  };

  const getProviderBadge = (provider: AIModel['provider']) => {
    const variants = {
      openai: 'default',
      anthropic: 'secondary',
      google: 'outline',
      local: 'destructive'
    } as const;
    
    return <Badge variant={variants[provider]}>{provider.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: AIModel['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="gap-1"><Pause className="h-3 w-3" />Inactive</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>Loading AI models...</CardDescription>
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
              <Bot className="h-5 w-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>
              Manage AI models, providers, and configurations
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Model
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configure AI Model</DialogTitle>
                <DialogDescription>
                  Add a new AI model configuration
                </DialogDescription>
              </DialogHeader>
              <ModelForm onSubmit={handleCreateModel} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
              <TabsTrigger value="settings">Global Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="models" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Usage Today</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {model.name}
                            {model.isDefault && (
                              <Badge variant="outline" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {model.model}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getProviderBadge(model.provider)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{model.usage.requestsToday} requests</div>
                          <div className="text-muted-foreground">
                            {(model.usage.tokensUsed / 1000).toFixed(1)}K tokens
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{model.usage.avgResponseTime}ms avg</div>
                          <div className="text-muted-foreground">
                            {model.limits.requestsPerMinute}/min limit
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(model.status)}
                          <Switch
                            checked={model.isEnabled}
                            onCheckedChange={(checked) => handleToggleModel(model.id, checked)}
                            size="sm"
                          />
                        </div>
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
                              setSelectedModel(model);
                              setIsEditDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Config
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSetDefault(model.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="h-4 w-4 mr-2" />
                              Test Model
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="usage" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {models.reduce((sum, model) => sum + model.usage.requestsToday, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(models.reduce((sum, model) => sum + model.usage.tokensUsed, 0) / 1000).toFixed(1)}K
                    </div>
                    <p className="text-xs text-muted-foreground">Total tokens</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(models.reduce((sum, model) => sum + model.usage.avgResponseTime, 0) / models.length)}ms
                    </div>
                    <p className="text-xs text-muted-foreground">Across all models</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Models</CardTitle>
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {models.filter(model => model.isEnabled).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      of {models.length} configured
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Configure AI security and privacy settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Data Retention</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically delete conversation data after 30 days
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Content Filtering</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable content filtering for AI responses
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Usage Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Collect usage analytics for optimization
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      API Keys
                    </CardTitle>
                    <CardDescription>
                      Manage API keys for AI providers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>OpenAI API Key</Label>
                          <Input type="password" placeholder="sk-..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Anthropic API Key</Label>
                          <Input type="password" placeholder="sk-ant-..." />
                        </div>
                      </div>
                      <Button>Update API Keys</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Model configuration form
function ModelForm({ model, onSubmit }: { model?: AIModel; onSubmit: (data: Partial<AIModel>) => void }) {
  const [formData, setFormData] = useState({
    name: model?.name || '',
    provider: model?.provider || 'openai',
    model: model?.model || '',
    description: model?.description || '',
    config: {
      temperature: model?.config.temperature || 0.7,
      maxTokens: model?.config.maxTokens || 2048,
      topP: model?.config.topP || 1,
      frequencyPenalty: model?.config.frequencyPenalty || 0,
      presencePenalty: model?.config.presencePenalty || 0,
    },
    limits: {
      maxTokens: model?.limits.maxTokens || 4096,
      requestsPerMinute: model?.limits.requestsPerMinute || 60,
      requestsPerDay: model?.limits.requestsPerDay || 1000,
    },
    isEnabled: model?.isEnabled ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Model Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="GPT-4o"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select
            value={formData.provider}
            onValueChange={(value) => setFormData({ ...formData, provider: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="local">Local</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model ID</Label>
        <Input
          id="model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          placeholder="gpt-4o"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this model..."
          rows={2}
        />
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Model Configuration</h4>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Temperature: {formData.config.temperature}</Label>
            <Slider
              value={[formData.config.temperature]}
              onValueChange={([value]) => setFormData({
                ...formData,
                config: { ...formData.config, temperature: value }
              })}
              max={2}
              min={0}
              step={0.1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={formData.config.maxTokens}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, maxTokens: parseInt(e.target.value) }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topP">Top P</Label>
              <Input
                id="topP"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.config.topP}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, topP: parseFloat(e.target.value) }
                })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          {model ? 'Update' : 'Add'} Model
        </Button>
      </div>
    </form>
  );
}
