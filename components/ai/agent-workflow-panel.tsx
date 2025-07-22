'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Bot, 
  Code, 
  GitBranch, 
  Server, 
  TestTube, 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Workflow,
  Settings,
  Zap,
  Brain,
  Target,
  FileText,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  progress: number;
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  dependencies?: string[];
  tools?: string[];
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  agentType: 'development' | 'review' | 'devops' | 'testing';
  steps: WorkflowStep[];
  status: 'idle' | 'running' | 'completed' | 'error' | 'paused';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  config?: Record<string, any>;
}

interface AgentWorkflowPanelProps {
  className?: string;
  onWorkflowStart?: (workflow: AgentWorkflow) => void;
  onWorkflowPause?: (workflowId: string) => void;
  onWorkflowStop?: (workflowId: string) => void;
  onWorkflowResume?: (workflowId: string) => void;
  workspaceContext?: any;
}

export function AgentWorkflowPanel({
  className,
  onWorkflowStart,
  onWorkflowPause,
  onWorkflowStop,
  onWorkflowResume,
  workspaceContext
}: AgentWorkflowPanelProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedAgent, setSelectedAgent] = useState<'development' | 'review' | 'devops' | 'testing'>('development');
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [customWorkflow, setCustomWorkflow] = useState({
    name: '',
    description: '',
    requirements: ''
  });

  // Predefined workflow templates
  const workflowTemplates = {
    development: [
      {
        name: 'Full-Stack App Creation',
        description: 'Create a complete full-stack application with frontend, backend, and database',
        steps: [
          'Analyze requirements and create project structure',
          'Set up development environment and dependencies',
          'Generate backend API with database models',
          'Create frontend components and pages',
          'Implement authentication and authorization',
          'Add testing suite and documentation',
          'Set up deployment configuration'
        ]
      },
      {
        name: 'Feature Implementation',
        description: 'Implement a new feature with tests and documentation',
        steps: [
          'Analyze feature requirements',
          'Design implementation approach',
          'Generate code for the feature',
          'Create comprehensive tests',
          'Update documentation',
          'Review and optimize code'
        ]
      },
      {
        name: 'Bug Fix Workflow',
        description: 'Identify, fix, and test bug fixes',
        steps: [
          'Analyze bug report and reproduce issue',
          'Identify root cause and impact',
          'Implement fix with minimal changes',
          'Create regression tests',
          'Verify fix and run test suite',
          'Update documentation if needed'
        ]
      }
    ],
    review: [
      {
        name: 'Code Quality Review',
        description: 'Comprehensive code review focusing on quality and best practices',
        steps: [
          'Analyze code structure and architecture',
          'Check for security vulnerabilities',
          'Review performance implications',
          'Verify test coverage and quality',
          'Check documentation completeness',
          'Generate improvement recommendations'
        ]
      },
      {
        name: 'Security Audit',
        description: 'Security-focused code review and vulnerability assessment',
        steps: [
          'Scan for common security vulnerabilities',
          'Review authentication and authorization',
          'Check input validation and sanitization',
          'Analyze data handling and storage',
          'Review third-party dependencies',
          'Generate security report and recommendations'
        ]
      }
    ],
    devops: [
      {
        name: 'CI/CD Pipeline Setup',
        description: 'Set up complete CI/CD pipeline with testing and deployment',
        steps: [
          'Analyze project structure and requirements',
          'Configure build and test automation',
          'Set up staging and production environments',
          'Implement deployment strategies',
          'Configure monitoring and logging',
          'Create deployment documentation'
        ]
      },
      {
        name: 'Infrastructure as Code',
        description: 'Create infrastructure configuration and deployment scripts',
        steps: [
          'Design infrastructure architecture',
          'Create infrastructure configuration files',
          'Set up container orchestration',
          'Configure networking and security',
          'Implement backup and disaster recovery',
          'Create operational runbooks'
        ]
      }
    ],
    testing: [
      {
        name: 'Test Suite Creation',
        description: 'Create comprehensive test suite with unit, integration, and e2e tests',
        steps: [
          'Analyze codebase and identify test requirements',
          'Create unit tests for core functionality',
          'Implement integration tests for APIs',
          'Set up end-to-end test scenarios',
          'Configure test automation and reporting',
          'Create test documentation and guidelines'
        ]
      },
      {
        name: 'Performance Testing',
        description: 'Set up performance testing and optimization workflow',
        steps: [
          'Identify performance critical paths',
          'Create performance test scenarios',
          'Set up load testing infrastructure',
          'Run performance benchmarks',
          'Analyze results and identify bottlenecks',
          'Generate optimization recommendations'
        ]
      }
    ]
  };

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'development':
        return <Code className="w-4 h-4" />;
      case 'review':
        return <GitBranch className="w-4 h-4" />;
      case 'devops':
        return <Server className="w-4 h-4" />;
      case 'testing':
        return <TestTube className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <Square className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const createWorkflowFromTemplate = useCallback((template: any) => {
    const workflow: AgentWorkflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      description: template.description,
      agentType: selectedAgent,
      steps: template.steps.map((stepTitle: string, index: number) => ({
        id: `step_${index}`,
        title: stepTitle,
        description: '',
        status: 'pending' as const,
        progress: 0,
        dependencies: index > 0 ? [`step_${index - 1}`] : []
      })),
      status: 'idle',
      progress: 0,
      config: {
        workspaceContext,
        agentType: selectedAgent
      }
    };

    setWorkflows(prev => [...prev, workflow]);
    
    if (onWorkflowStart) {
      onWorkflowStart(workflow);
    }
    
    toast.success(`Started ${template.name} workflow`);
  }, [selectedAgent, workspaceContext, onWorkflowStart]);

  const createCustomWorkflow = useCallback(() => {
    if (!customWorkflow.name.trim() || !customWorkflow.requirements.trim()) {
      toast.error('Please provide workflow name and requirements');
      return;
    }

    const workflow: AgentWorkflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customWorkflow.name,
      description: customWorkflow.description || 'Custom workflow',
      agentType: selectedAgent,
      steps: [
        {
          id: 'step_0',
          title: 'Analyze Requirements',
          description: 'Analyze the provided requirements and create execution plan',
          status: 'pending',
          progress: 0
        },
        {
          id: 'step_1',
          title: 'Execute Workflow',
          description: 'Execute the custom workflow based on requirements',
          status: 'pending',
          progress: 0,
          dependencies: ['step_0']
        }
      ],
      status: 'idle',
      progress: 0,
      config: {
        workspaceContext,
        agentType: selectedAgent,
        requirements: customWorkflow.requirements
      }
    };

    setWorkflows(prev => [...prev, workflow]);
    
    if (onWorkflowStart) {
      onWorkflowStart(workflow);
    }
    
    // Reset form
    setCustomWorkflow({ name: '', description: '', requirements: '' });
    
    toast.success(`Started custom ${selectedAgent} workflow`);
  }, [customWorkflow, selectedAgent, workspaceContext, onWorkflowStart]);

  const renderWorkflowStep = (step: WorkflowStep, index: number) => (
    <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
      <div className="flex-shrink-0">
        {getStatusIcon(step.status)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium truncate">{step.title}</h4>
          <Badge variant="outline" className="text-xs">
            {step.status}
          </Badge>
        </div>
        
        {step.description && (
          <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
        )}
        
        {step.status === 'running' && (
          <Progress value={step.progress} className="h-1" />
        )}
        
        {step.error && (
          <div className="text-xs text-red-500 mt-1">{step.error}</div>
        )}
      </div>
    </div>
  );

  const renderActiveWorkflows = () => (
    <div className="space-y-4">
      {workflows.length === 0 ? (
        <div className="text-center py-8">
          <Workflow className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No active workflows</p>
        </div>
      ) : (
        workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAgentIcon(workflow.agentType)}
                  <CardTitle className="text-sm">{workflow.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {workflow.agentType}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1">
                  {workflow.status === 'running' && onWorkflowPause && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onWorkflowPause(workflow.id)}
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {workflow.status === 'paused' && onWorkflowResume && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onWorkflowResume(workflow.id)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {onWorkflowStop && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onWorkflowStop(workflow.id)}
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{workflow.description}</p>
                <div className="flex items-center gap-2">
                  <Progress value={workflow.progress} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground">
                    {workflow.progress}%
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {workflow.steps.map((step, index) => renderWorkflowStep(step, index))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Agent Workflows</h3>
        </div>
        
        <Select value={selectedAgent} onValueChange={(value: any) => setSelectedAgent(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="review">Code Review</SelectItem>
            <SelectItem value="devops">DevOps</SelectItem>
            <SelectItem value="testing">Testing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="active">Active ({workflows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-3">
          <div className="grid gap-3">
            {workflowTemplates[selectedAgent].map((template, index) => (
              <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => createWorkflowFromTemplate(template)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">{template.name}</h4>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                      <div className="text-xs text-muted-foreground">
                        {template.steps.length} steps
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Workflow Name</label>
              <Input
                value={customWorkflow.name}
                onChange={(e) => setCustomWorkflow(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter workflow name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={customWorkflow.description}
                onChange={(e) => setCustomWorkflow(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the workflow"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Requirements</label>
              <Textarea
                value={customWorkflow.requirements}
                onChange={(e) => setCustomWorkflow(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="Describe what you want the AI agent to accomplish..."
                rows={4}
              />
            </div>
            
            <Button 
              onClick={createCustomWorkflow}
              disabled={!customWorkflow.name.trim() || !customWorkflow.requirements.trim()}
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              Start Custom Workflow
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="active">
          {renderActiveWorkflows()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
