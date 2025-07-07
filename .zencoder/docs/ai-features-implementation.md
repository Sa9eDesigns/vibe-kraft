# AI Features Implementation Plan for VibeKraft

## Overview

This document outlines a plan to implement AI features in the VibeKraft SaaS platform using Vercel's AI SDK. The implementation will enhance user experience by providing intelligent assistance, data analysis, and automation capabilities.

## AI SDK Integration

### Installation

```bash
npm install ai @ai-sdk/react @ai-sdk/openai zod
```

### Configuration

1. Set up environment variables in `.env.local`:

```
OPENAI_API_KEY=your_openai_api_key
```

2. Create a provider configuration in `lib/ai/providers.ts`:

```typescript
import { openai } from '@ai-sdk/openai';

export const openaiProvider = openai(process.env.OPENAI_API_KEY);
```

## AI Features to Implement

### 1. AI Assistant Chatbot

#### Implementation Steps:

1. Create API route for chat in `app/api/chat/route.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    tools: {
      getOrganizationInfo: {
        description: 'Get information about the user\'s organizations',
        parameters: z.object({}),
        execute: async () => {
          const userId = session.user.id;
          const organizations = await db.organization.findMany({
            where: {
              members: {
                some: {
                  userId,
                }
              }
            },
            select: {
              id: true,
              name: true,
              slug: true,
            }
          });
          
          return { organizations };
        },
      },
      getProjectInfo: {
        description: 'Get information about projects in an organization',
        parameters: z.object({ 
          organizationId: z.string().describe('The ID of the organization')
        }),
        execute: async ({ organizationId }) => {
          const projects = await db.project.findMany({
            where: {
              organizationId,
            },
            select: {
              id: true,
              name: true,
              description: true,
            }
          });
          
          return { projects };
        },
      },
      getTaskInfo: {
        description: 'Get information about tasks in a project',
        parameters: z.object({ 
          projectId: z.string().describe('The ID of the project')
        }),
        execute: async ({ projectId }) => {
          const tasks = await db.task.findMany({
            where: {
              projectId,
            },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
            }
          });
          
          return { tasks };
        },
      },
    },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
```

2. Create a chat component in `components/ai/chat-assistant.tsx`:

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

export function ChatAssistant() {
  const [inputValue, setInputValue] = useState('');
  
  const { messages, sendMessage, isLoading } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    maxSteps: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.parts.map((part, partIndex) => {
                  if (part.type === 'text') {
                    return <p key={partIndex}>{part.text}</p>;
                  }
                  
                  if (part.type === 'tool-invocation') {
                    switch (part.toolInvocation.state) {
                      case 'partial-call':
                        return (
                          <div key={partIndex} className="text-xs text-muted-foreground">
                            Thinking...
                          </div>
                        );
                      case 'call':
                        return (
                          <div key={partIndex} className="text-xs text-muted-foreground">
                            Looking up information...
                          </div>
                        );
                      case 'result':
                        return (
                          <div key={partIndex} className="text-xs text-muted-foreground">
                            Found information
                          </div>
                        );
                    }
                  }
                  
                  if (part.type === 'step-start') {
                    return index > 0 ? (
                      <div key={partIndex} className="text-gray-500">
                        <hr className="my-2 border-gray-300" />
                      </div>
                    ) : null;
                  }
                  
                  return null;
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
```

3. Add the chat assistant to the dashboard in `app/(dashboard)/dashboard/ai-assistant/page.tsx`:

```typescript
import { Metadata } from "next";
import { auth } from "@/auth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ChatAssistant } from "@/components/ai/chat-assistant";

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Get help from your AI assistant",
};

export default async function AIAssistantPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="AI Assistant"
        text="Ask questions about your organizations, projects, and tasks."
      />
      <div className="grid gap-6">
        <ChatAssistant />
      </div>
    </DashboardShell>
  );
}
```

### 2. AI-Powered Task Analysis

#### Implementation Steps:

1. Create API route for task analysis in `app/api/ai/task-analysis/route.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { projectId } = await req.json();
  
  // Get project tasks
  const tasks = await db.task.findMany({
    where: {
      projectId,
      project: {
        organization: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  if (!tasks.length) {
    return Response.json({ analysis: "No tasks found for this project." });
  }

  // Generate analysis with AI
  const result = await generateText({
    model: openai('gpt-4o'),
    prompt: `
      Analyze the following project tasks and provide insights:
      - Task completion rate
      - Distribution of task priorities
      - Estimated time to completion based on current progress
      - Suggestions for task organization
      
      Tasks: ${JSON.stringify(tasks)}
      
      Format your response as JSON with the following structure:
      {
        "completionRate": number, // percentage
        "priorityDistribution": { "HIGH": number, "MEDIUM": number, "LOW": number },
        "estimatedCompletion": string, // e.g., "2 weeks"
        "suggestions": string[], // array of suggestions
        "summary": string // brief text summary
      }
    `,
  });

  return Response.json({ analysis: result.text });
}
```

2. Create a task analysis component in `components/ai/task-analysis.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface TaskAnalysisProps {
  projectId: string;
  projectName: string;
}

interface AnalysisResult {
  completionRate: number;
  priorityDistribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  estimatedCompletion: string;
  suggestions: string[];
  summary: string;
}

export function TaskAnalysis({ projectId, projectName }: TaskAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/task-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }
      
      const data = await response.json();
      setAnalysis(JSON.parse(data.analysis));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate task analysis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Task Analysis for {projectName}</CardTitle>
      </CardHeader>
      <CardContent>
        {!analysis ? (
          <div className="flex flex-col items-center gap-4">
            <p>Generate an AI-powered analysis of your project tasks</p>
            <Button onClick={generateAnalysis} disabled={loading}>
              {loading ? 'Analyzing...' : 'Generate Analysis'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Summary</h3>
              <p>{analysis.summary}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-3">
                <h4 className="text-sm font-medium">Completion Rate</h4>
                <p className="text-2xl font-bold">{analysis.completionRate}%</p>
              </div>
              
              <div className="rounded-lg border p-3">
                <h4 className="text-sm font-medium">Estimated Completion</h4>
                <p className="text-2xl font-bold">{analysis.estimatedCompletion}</p>
              </div>
              
              <div className="rounded-lg border p-3">
                <h4 className="text-sm font-medium">Priority Distribution</h4>
                <div className="text-sm">
                  <div>High: {analysis.priorityDistribution.HIGH}</div>
                  <div>Medium: {analysis.priorityDistribution.MEDIUM}</div>
                  <div>Low: {analysis.priorityDistribution.LOW}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Suggestions</h3>
              <ul className="list-disc pl-5">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
            
            <Button onClick={generateAnalysis} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh Analysis'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

3. Add the task analysis component to the project page in `app/(dashboard)/dashboard/projects/[projectId]/page.tsx`.

### 3. AI-Generated Project Documentation

#### Implementation Steps:

1. Create API route for documentation generation in `app/api/ai/generate-docs/route.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { projectId, type } = await req.json();
  
  // Get project and tasks
  const project = await db.project.findUnique({
    where: {
      id: projectId,
      organization: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    },
    include: {
      tasks: true,
    }
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  let prompt = '';
  
  switch (type) {
    case 'readme':
      prompt = `
        Generate a README.md file for the following project:
        
        Project Name: ${project.name}
        Description: ${project.description || 'No description provided'}
        
        Tasks:
        ${project.tasks.map(task => `- ${task.title}: ${task.description || 'No description'} (Status: ${task.status}, Priority: ${task.priority})`).join('\n')}
        
        The README should include:
        1. Project title and description
        2. Overview of the project structure
        3. Key features
        4. Installation/setup instructions (if applicable)
        5. Usage examples
        6. Contributors section
        
        Format the response as Markdown.
      `;
      break;
      
    case 'projectPlan':
      prompt = `
        Generate a detailed project plan for the following project:
        
        Project Name: ${project.name}
        Description: ${project.description || 'No description provided'}
        
        Current Tasks:
        ${project.tasks.map(task => `- ${task.title}: ${task.description || 'No description'} (Status: ${task.status}, Priority: ${task.priority})`).join('\n')}
        
        The project plan should include:
        1. Executive summary
        2. Project goals and objectives
        3. Scope and deliverables
        4. Timeline and milestones
        5. Resource requirements
        6. Risk assessment and mitigation strategies
        7. Success criteria
        
        Format the response as Markdown.
      `;
      break;
      
    default:
      return Response.json({ error: "Invalid documentation type" }, { status: 400 });
  }

  // Generate documentation with AI
  const result = await generateText({
    model: openai('gpt-4o'),
    prompt,
  });

  return Response.json({ content: result.text });
}
```

2. Create a documentation generator component in `components/ai/doc-generator.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';

interface DocGeneratorProps {
  projectId: string;
  projectName: string;
}

export function DocGenerator({ projectId, projectName }: DocGeneratorProps) {
  const [docType, setDocType] = useState<'readme' | 'projectPlan'>('readme');
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateDoc = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, type: docType }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate documentation');
      }
      
      const data = await response.json();
      setContent(data.content);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate documentation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDoc = () => {
    if (!content) return;
    
    const filename = docType === 'readme' ? 'README.md' : 'PROJECT_PLAN.md';
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Documentation Generator for {projectName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={docType} onValueChange={(value: 'readme' | 'projectPlan') => setDocType(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="readme">README.md</SelectItem>
                <SelectItem value="projectPlan">Project Plan</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={generateDoc} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Document'}
            </Button>
            
            {content && (
              <Button variant="outline" onClick={downloadDoc}>
                Download
              </Button>
            )}
          </div>
          
          {content && (
            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="border rounded-md p-4 mt-2">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </TabsContent>
              <TabsContent value="markdown" className="border rounded-md p-4 mt-2">
                <pre className="whitespace-pre-wrap text-sm font-mono">{content}</pre>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

3. Add the documentation generator to the project page.

## Additional Dependencies

```bash
npm install react-markdown
```

## Integration Points

1. Add AI Assistant to the dashboard sidebar in `components/dashboard/sidebar.tsx`
2. Add Task Analysis to project pages
3. Add Documentation Generator to project pages

## Security Considerations

1. Ensure all AI API routes are protected with authentication
2. Implement rate limiting for AI endpoints
3. Validate user permissions before accessing organization/project data
4. Sanitize AI-generated content before displaying it to users

## Future Enhancements

1. **AI-Powered Task Creation**: Generate tasks based on project descriptions
2. **Meeting Summarization**: Transcribe and summarize meetings
3. **Code Generation**: Generate code snippets for common tasks
4. **Data Visualization**: AI-suggested charts and visualizations for project data
5. **Predictive Analytics**: Forecast project completion based on historical data