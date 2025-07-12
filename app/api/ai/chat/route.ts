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
    const { messages, model = 'gpt-4', temperature = 0.7, maxTokens = 2048, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages are required', { status: 400 });
    }

    // Convert messages to core format
    const coreMessages = convertToCoreMessages(messages);

    // Determine which provider to use based on model
    let aiModel;

    if (model.startsWith('claude')) {
      if (!process.env.ANTHROPIC_API_KEY) {
        return new Response('Anthropic API key not configured', { status: 500 });
      }
      const modelName = model.includes('3.5') ? 'claude-3-5-sonnet-20241022' : 'claude-3-7-sonnet-20250219';
      aiModel = anthropic(modelName);
    } else if (model.startsWith('gemini')) {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response('Google API key not configured', { status: 500 });
      }
      const modelName = model.includes('pro') ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
      aiModel = google(modelName);
    } else {
      if (!process.env.OPENAI_API_KEY) {
        return new Response('OpenAI API key not configured', { status: 500 });
      }
      const modelName = model.includes('gpt-4') ? 'gpt-4o' : 'gpt-3.5-turbo';
      aiModel = openai(modelName);
    }

    // Use enhanced WebVM tools
    const tools = webvmTools;

    // Add context to system message if provided
    let systemMessage = `You are an AI assistant for a WebVM development environment. You can help with:
    - Executing bash commands
    - Reading and writing files
    - Generating and analyzing code
    - Taking screenshots of the desktop
    - Debugging and troubleshooting
    
    Always be helpful and explain what you're doing. When executing commands or making changes, be clear about the actions you're taking.`;

    if (context) {
      systemMessage += `\n\nCurrent context: ${JSON.stringify(context, null, 2)}`;
    }

    // Ensure we have a system message
    const messagesWithSystem = coreMessages[0]?.role === 'system' 
      ? coreMessages 
      : [{ role: 'system' as const, content: systemMessage }, ...coreMessages];

    const result = streamText({
      model: aiModel,
      messages: messagesWithSystem,
      tools: model.startsWith('claude') ? tools : undefined, // Only use tools with Claude for now
      maxSteps: 5,
      temperature,
      maxTokens,
      onFinish: async ({ toolCalls }) => {
        // Log tool executions for debugging
        if (toolCalls && toolCalls.length > 0) {
          console.log('Tool calls executed:', toolCalls);
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