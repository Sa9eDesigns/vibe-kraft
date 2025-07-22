import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages } from 'ai';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';
import { webvmTools } from '@/lib/ai-sdk/webvm-tools';
import { createAgent } from '@/lib/ai-sdk/webvm-agents';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const {
      messages,
      model = 'claude-3-5-sonnet-20241022',
      temperature = 0.7,
      maxTokens = 4096,
      context,
      agentMode = 'chat',
      conversationId,
      enableTools = true
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages are required', { status: 400 });
    }

    // Convert messages to core format
    const coreMessages = convertToCoreMessages(messages);

    // Enhanced model selection with optimizations
    let aiModel;
    let modelConfig = {
      temperature,
      maxTokens,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0
    };

    if (model.startsWith('claude')) {
      if (!process.env.ANTHROPIC_API_KEY) {
        return new Response('Anthropic API key not configured', { status: 500 });
      }
      const modelName = model.includes('3.5') ? 'claude-3-5-sonnet-20241022' : 'claude-3-7-sonnet-20250219';
      aiModel = anthropic(modelName);

      // Claude-specific optimizations
      modelConfig = {
        ...modelConfig,
        temperature: Math.min(temperature, 1.0), // Claude works better with lower temps
        maxTokens: Math.min(maxTokens, 8192) // Claude 3.5 Sonnet max
      };
    } else if (model.startsWith('gemini')) {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response('Google API key not configured', { status: 500 });
      }
      const modelName = model.includes('pro') ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
      aiModel = google(modelName);

      // Gemini-specific optimizations
      modelConfig = {
        ...modelConfig,
        temperature: Math.max(temperature, 0.1), // Gemini needs some randomness
        maxTokens: Math.min(maxTokens, 32768) // Gemini 1.5 Pro max
      };
    } else {
      if (!process.env.OPENAI_API_KEY) {
        return new Response('OpenAI API key not configured', { status: 500 });
      }
      const modelName = model.includes('gpt-4') ? 'gpt-4o' : 'gpt-3.5-turbo';
      aiModel = openai(modelName);

      // GPT-specific optimizations
      modelConfig = {
        ...modelConfig,
        maxTokens: Math.min(maxTokens, 16384), // GPT-4o max
        frequencyPenalty: agentMode === 'development' ? 0.1 : 0,
        presencePenalty: agentMode === 'development' ? 0.1 : 0
      };
    }

    // Use enhanced WebVM tools (only if enabled)
    const tools = enableTools ? webvmTools : undefined;

    // Enhanced system message based on agent mode and context
    let systemMessage = '';

    switch (agentMode) {
      case 'development':
        systemMessage = `You are an expert development AI assistant for a WebVM environment. You specialize in:
        - Full-stack application development
        - Code generation and refactoring
        - Architecture design and best practices
        - Debugging and performance optimization
        - Testing and quality assurance

        You have access to powerful tools for file operations, terminal commands, and code analysis. Always write production-ready code and follow best practices.`;
        break;

      case 'review':
        systemMessage = `You are a senior code reviewer AI assistant. Your expertise includes:
        - Code quality assessment
        - Security vulnerability detection
        - Performance optimization suggestions
        - Best practices enforcement
        - Documentation and maintainability review

        Provide constructive feedback and actionable suggestions for improvement.`;
        break;

      case 'devops':
        systemMessage = `You are a DevOps and infrastructure AI assistant. You excel at:
        - Deployment automation and CI/CD
        - Container orchestration and Docker
        - Cloud infrastructure management
        - Monitoring and logging setup
        - Security and compliance

        Focus on scalable, reliable, and secure infrastructure solutions.`;
        break;

      case 'testing':
        systemMessage = `You are a testing specialist AI assistant. Your focus areas are:
        - Test strategy and planning
        - Unit, integration, and e2e test creation
        - Test automation and frameworks
        - Performance and load testing
        - Quality assurance processes

        Write comprehensive tests that ensure code reliability and maintainability.`;
        break;

      default: // chat
        systemMessage = `You are an intelligent AI assistant for a WebVM development environment. You can help with:
        - Executing bash commands and terminal operations
        - Reading, writing, and analyzing files
        - Code generation and debugging
        - Project analysis and recommendations
        - Development workflow optimization

        Always be helpful, clear, and explain your actions. Ask for clarification when needed.`;
    }

    // Add workspace context if provided
    if (context?.workspace) {
      systemMessage += `\n\nWorkspace Context:`;
      if (context.workspace.summary) {
        systemMessage += `\n- Summary: ${context.workspace.summary}`;
      }
      if (context.workspace.relevantFiles?.length > 0) {
        systemMessage += `\n- Open files: ${context.workspace.relevantFiles.map((f: any) => f.path).join(', ')}`;
      }
      if (context.workspace.recentActivity?.length > 0) {
        systemMessage += `\n- Recent activity: ${context.workspace.recentActivity.slice(0, 3).join('; ')}`;
      }
    }

    // Add conversation context
    if (conversationId) {
      systemMessage += `\n\nConversation ID: ${conversationId}`;
    }

    // Ensure we have a system message
    const messagesWithSystem = coreMessages[0]?.role === 'system' 
      ? coreMessages 
      : [{ role: 'system' as const, content: systemMessage }, ...coreMessages];

    const result = streamText({
      model: aiModel,
      messages: messagesWithSystem,
      tools: tools, // Use tools based on enableTools flag
      maxSteps: agentMode === 'development' ? 10 : 5, // More steps for development mode
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
      topP: modelConfig.topP,
      frequencyPenalty: modelConfig.frequencyPenalty,
      presencePenalty: modelConfig.presencePenalty,
      onFinish: async ({ toolCalls, usage, finishReason }) => {
        // Enhanced logging for debugging and analytics
        console.log('AI Response completed:', {
          model,
          agentMode,
          conversationId,
          toolCallsCount: toolCalls?.length || 0,
          usage,
          finishReason,
          timestamp: new Date().toISOString()
        });

        if (toolCalls && toolCalls.length > 0) {
          console.log('Tool calls executed:', toolCalls.map(tc => ({
            name: tc.toolName,
            args: tc.args,
            result: tc.result ? 'success' : 'failed'
          })));
        }
      },
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('AI Chat API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function GET() {
  return new Response('Method not allowed', { status: 405 });
}