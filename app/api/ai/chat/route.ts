import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages } from 'ai';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

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
    let aiProvider;
    let modelName = model;

    if (model.startsWith('claude')) {
      if (!process.env.ANTHROPIC_API_KEY) {
        return new Response('Anthropic API key not configured', { status: 500 });
      }
      aiProvider = anthropic(process.env.ANTHROPIC_API_KEY);
      modelName = model.includes('3.5') ? 'claude-3-5-sonnet-20241022' : 'claude-3-7-sonnet-20250219';
    } else {
      if (!process.env.OPENAI_API_KEY) {
        return new Response('OpenAI API key not configured', { status: 500 });
      }
      aiProvider = openai(process.env.OPENAI_API_KEY);
      modelName = model.includes('gpt-4') ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo';
    }

    // Define tools for WebVM integration
    const tools = {
      // Bash command execution
      bash: {
        description: 'Execute bash commands in the WebVM environment',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The bash command to execute'
            }
          },
          required: ['command']
        },
        execute: async ({ command }: { command: string }) => {
          // This would be handled by the client-side sandbox
          return {
            type: 'bash',
            command,
            note: 'Command will be executed in the client-side WebVM'
          };
        }
      },

      // File operations
      readFile: {
        description: 'Read the contents of a file in the WebVM filesystem',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path to the file to read'
            }
          },
          required: ['path']
        },
        execute: async ({ path }: { path: string }) => {
          return {
            type: 'readFile',
            path,
            note: 'File will be read from the client-side WebVM'
          };
        }
      },

      writeFile: {
        description: 'Write content to a file in the WebVM filesystem',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path to the file to write'
            },
            content: {
              type: 'string',
              description: 'The content to write to the file'
            }
          },
          required: ['path', 'content']
        },
        execute: async ({ path, content }: { path: string; content: string }) => {
          return {
            type: 'writeFile',
            path,
            content,
            note: 'File will be written to the client-side WebVM'
          };
        }
      },

      listFiles: {
        description: 'List files and directories in a path within the WebVM filesystem',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The directory path to list'
            }
          },
          required: ['path']
        },
        execute: async ({ path }: { path: string }) => {
          return {
            type: 'listFiles',
            path,
            note: 'Files will be listed from the client-side WebVM'
          };
        }
      },

      // Computer use tool for Claude
      computer: {
        description: 'Take a screenshot of the WebVM desktop environment',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['screenshot'],
              description: 'The action to perform'
            }
          },
          required: ['action']
        },
        execute: async ({ action }: { action: string }) => {
          return {
            type: 'computer',
            action,
            note: 'Screenshot will be taken from the client-side WebVM'
          };
        }
      },

      // Code generation
      generateCode: {
        description: 'Generate code based on a prompt and programming language',
        parameters: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The code generation prompt'
            },
            language: {
              type: 'string',
              description: 'The programming language for the generated code'
            }
          },
          required: ['prompt', 'language']
        },
        execute: async ({ prompt, language }: { prompt: string; language: string }) => {
          return {
            type: 'generateCode',
            prompt,
            language,
            note: 'Code generation request processed'
          };
        }
      }
    };

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
      model: aiProvider(modelName),
      messages: messagesWithSystem,
      tools: model.startsWith('claude') ? tools : undefined, // Only use tools with Claude for now
      maxSteps: 5,
      temperature,
      maxTokens,
      async onStepFinish({ stepType, stepResult, response }) {
        // Log tool executions for debugging
        if (stepType === 'tool-call') {
          console.log('Tool call executed:', stepResult);
        }
      },
    });

    return result.toDataStreamResponse({
      data: {
        context,
        model: modelName,
        timestamp: new Date().toISOString()
      }
    });

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