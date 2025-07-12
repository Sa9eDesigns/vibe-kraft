import { generateText, streamText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { webvmTools } from './webvm-tools';

/**
 * AI Agent system for WebVM workspaces
 * Implements various agent patterns for complex development workflows
 */

// Agent configuration
export interface AgentConfig {
  model: 'gpt-4o' | 'claude-3-5-sonnet-20241022' | 'gemini-1.5-pro';
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
}

// Get model instance based on configuration
function getModel(config: AgentConfig) {
  switch (config.model) {
    case 'claude-3-5-sonnet-20241022':
      return anthropic('claude-3-5-sonnet-20241022');
    case 'gemini-1.5-pro':
      return google('gemini-1.5-pro');
    default:
      return openai('gpt-4o');
  }
}

// Development workflow agent
export class DevelopmentAgent {
  constructor(private config: AgentConfig) {}

  async createFullStackApp(requirements: {
    name: string;
    description: string;
    frontend: 'react' | 'vue' | 'angular' | 'svelte';
    backend: 'node' | 'python' | 'go' | 'rust';
    database: 'postgresql' | 'mongodb' | 'sqlite' | 'mysql';
    features: string[];
  }) {
    const model = getModel(this.config);
    
    const plan = await generateObject({
      model,
      schema: z.object({
        steps: z.array(z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          tools: z.array(z.string()),
          dependencies: z.array(z.string()),
          estimatedTime: z.number()
        })),
        architecture: z.object({
          frontend: z.object({
            framework: z.string(),
            components: z.array(z.string()),
            routing: z.string(),
            stateManagement: z.string()
          }),
          backend: z.object({
            framework: z.string(),
            endpoints: z.array(z.string()),
            middleware: z.array(z.string()),
            authentication: z.string()
          }),
          database: z.object({
            type: z.string(),
            schema: z.array(z.object({
              table: z.string(),
              fields: z.array(z.string())
            }))
          })
        }),
        fileStructure: z.array(z.object({
          path: z.string(),
          type: z.enum(['file', 'directory']),
          content: z.string().optional()
        }))
      }),
      prompt: `Create a detailed development plan for a full-stack application with the following requirements:
      
      Name: ${requirements.name}
      Description: ${requirements.description}
      Frontend: ${requirements.frontend}
      Backend: ${requirements.backend}
      Database: ${requirements.database}
      Features: ${requirements.features.join(', ')}
      
      Provide a step-by-step plan with architecture decisions and file structure.`
    });

    return plan.object;
  }

  async implementFeature(feature: {
    name: string;
    description: string;
    files: string[];
    dependencies: string[];
  }) {
    const model = getModel(this.config);

    const result = await streamText({
      model,
      tools: webvmTools,
      maxSteps: 10,
      prompt: `Implement the following feature in the WebVM workspace:
      
      Feature: ${feature.name}
      Description: ${feature.description}
      Files to modify: ${feature.files.join(', ')}
      Dependencies: ${feature.dependencies.join(', ')}
      
      Use the available tools to:
      1. Read existing files to understand the current codebase
      2. Install any required dependencies
      3. Generate and write the necessary code
      4. Create tests for the feature
      5. Update documentation
      
      Be thorough and follow best practices.`
    });

    return result;
  }

  async debugIssue(issue: {
    description: string;
    errorMessage?: string;
    stackTrace?: string;
    affectedFiles?: string[];
  }) {
    const model = getModel(this.config);

    const result = await streamText({
      model,
      tools: webvmTools,
      maxSteps: 8,
      prompt: `Debug the following issue in the WebVM workspace:
      
      Issue: ${issue.description}
      ${issue.errorMessage ? `Error: ${issue.errorMessage}` : ''}
      ${issue.stackTrace ? `Stack Trace: ${issue.stackTrace}` : ''}
      ${issue.affectedFiles ? `Affected Files: ${issue.affectedFiles.join(', ')}` : ''}
      
      Use the available tools to:
      1. Analyze the error and stack trace
      2. Read relevant files to understand the issue
      3. Identify the root cause
      4. Propose and implement a fix
      5. Test the fix to ensure it works
      
      Provide clear explanations for each step.`
    });

    return result;
  }
}

// Code review agent
export class CodeReviewAgent {
  constructor(private config: AgentConfig) {}

  async reviewCode(code: {
    content: string;
    language: string;
    context?: string;
  }) {
    const model = getModel(this.config);

    const review = await generateObject({
      model,
      schema: z.object({
        overall_score: z.number().min(1).max(10),
        summary: z.string(),
        issues: z.array(z.object({
          type: z.enum(['bug', 'security', 'performance', 'style', 'maintainability']),
          severity: z.enum(['low', 'medium', 'high', 'critical']),
          line: z.number().optional(),
          description: z.string(),
          suggestion: z.string()
        })),
        strengths: z.array(z.string()),
        recommendations: z.array(z.string()),
        refactoring_suggestions: z.array(z.object({
          description: z.string(),
          benefit: z.string(),
          effort: z.enum(['low', 'medium', 'high'])
        }))
      }),
      prompt: `Review the following ${code.language} code and provide detailed feedback:

      ${code.context ? `Context: ${code.context}` : ''}
      
      Code:
      \`\`\`${code.language}
      ${code.content}
      \`\`\`
      
      Analyze for:
      - Bugs and potential issues
      - Security vulnerabilities
      - Performance problems
      - Code style and best practices
      - Maintainability and readability
      - Architecture and design patterns
      
      Provide constructive feedback with specific suggestions for improvement.`
    });

    return review.object;
  }

  async suggestRefactoring(code: {
    content: string;
    language: string;
    goals: string[];
  }) {
    const model = getModel(this.config);

    const result = await streamText({
      model,
      tools: webvmTools,
      maxSteps: 5,
      prompt: `Refactor the following ${code.language} code to achieve these goals: ${code.goals.join(', ')}
      
      Original Code:
      \`\`\`${code.language}
      ${code.content}
      \`\`\`
      
      Use the available tools to:
      1. Analyze the current code structure
      2. Identify refactoring opportunities
      3. Generate improved code
      4. Explain the changes and benefits
      5. Provide the refactored code
      
      Focus on improving code quality while maintaining functionality.`
    });

    return result;
  }
}

// DevOps agent
export class DevOpsAgent {
  constructor(private config: AgentConfig) {}

  async setupCI(project: {
    type: 'frontend' | 'backend' | 'fullstack';
    framework: string;
    testCommand?: string;
    buildCommand?: string;
    deployTarget?: string;
  }) {
    const model = getModel(this.config);

    const result = await streamText({
      model,
      tools: webvmTools,
      maxSteps: 6,
      prompt: `Set up CI/CD pipeline for a ${project.type} ${project.framework} project:
      
      Project Type: ${project.type}
      Framework: ${project.framework}
      Test Command: ${project.testCommand || 'npm test'}
      Build Command: ${project.buildCommand || 'npm run build'}
      Deploy Target: ${project.deployTarget || 'not specified'}
      
      Use the available tools to:
      1. Create GitHub Actions workflow file
      2. Set up testing pipeline
      3. Configure build process
      4. Add deployment steps (if target specified)
      5. Create necessary configuration files
      6. Document the CI/CD process
      
      Follow best practices for the specific framework and project type.`
    });

    return result;
  }

  async optimizePerformance(target: {
    type: 'frontend' | 'backend' | 'database';
    metrics?: string[];
    constraints?: string[];
  }) {
    const model = getModel(this.config);

    const result = await streamText({
      model,
      tools: webvmTools,
      maxSteps: 8,
      prompt: `Optimize performance for a ${target.type} application:
      
      Target: ${target.type}
      Metrics to improve: ${target.metrics?.join(', ') || 'general performance'}
      Constraints: ${target.constraints?.join(', ') || 'none specified'}
      
      Use the available tools to:
      1. Analyze current performance bottlenecks
      2. Identify optimization opportunities
      3. Implement performance improvements
      4. Add monitoring and profiling
      5. Create performance tests
      6. Document optimization strategies
      
      Focus on measurable improvements and best practices.`
    });

    return result;
  }
}

// Testing agent
export class TestingAgent {
  constructor(private config: AgentConfig) {}

  async generateTests(code: {
    content: string;
    language: string;
    framework?: string;
    testType: 'unit' | 'integration' | 'e2e';
  }) {
    const model = getModel(this.config);

    const result = await streamText({
      model,
      tools: webvmTools,
      maxSteps: 5,
      prompt: `Generate comprehensive ${code.testType} tests for the following ${code.language} code:
      
      ${code.framework ? `Framework: ${code.framework}` : ''}
      
      Code to test:
      \`\`\`${code.language}
      ${code.content}
      \`\`\`
      
      Use the available tools to:
      1. Analyze the code to understand its functionality
      2. Identify test cases and edge cases
      3. Generate test files with appropriate structure
      4. Include setup and teardown if needed
      5. Add test documentation and comments
      
      Follow testing best practices and ensure good coverage.`
    });

    return result;
  }

  async runTestSuite(project: {
    path: string;
    testCommand: string;
    coverage?: boolean;
  }) {
    const model = getModel(this.config);

    const result = await streamText({
      model,
      tools: webvmTools,
      maxSteps: 4,
      prompt: `Run the test suite for the project at ${project.path}:
      
      Test Command: ${project.testCommand}
      Coverage: ${project.coverage ? 'enabled' : 'disabled'}
      
      Use the available tools to:
      1. Navigate to the project directory
      2. Run the test command
      3. Analyze test results and coverage
      4. Report any failures with suggestions for fixes
      
      Provide clear feedback on test status and any issues found.`
    });

    return result;
  }
}

// Export agent factory
export function createAgent(type: 'development' | 'review' | 'devops' | 'testing', config: AgentConfig) {
  switch (type) {
    case 'development':
      return new DevelopmentAgent(config);
    case 'review':
      return new CodeReviewAgent(config);
    case 'devops':
      return new DevOpsAgent(config);
    case 'testing':
      return new TestingAgent(config);
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

export { DevelopmentAgent, CodeReviewAgent, DevOpsAgent, TestingAgent };
