import { EventEmitter } from 'events';

/**
 * Conversation Management System
 * Handles conversation history, persistence, branching, and export/import
 */

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
  toolInvocations?: Array<{
    toolName: string;
    args: Record<string, any>;
    result?: any;
  }>;
  metadata?: {
    executionTime?: number;
    temperature?: number;
    maxTokens?: number;
    finishReason?: string;
  };
}

export interface ConversationBranch {
  id: string;
  parentMessageId?: string;
  messages: ConversationMessage[];
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  description?: string;
  branches: ConversationBranch[];
  activeBranchId: string;
  model: string;
  agentMode: string;
  workspaceContext?: any;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isStarred: boolean;
  isArchived: boolean;
}

export interface ConversationExport {
  version: string;
  conversation: Conversation;
  exportedAt: Date;
  exportedBy?: string;
}

export class ConversationManager extends EventEmitter {
  private conversations: Map<string, Conversation> = new Map();
  private storageKey = 'ai-conversations';
  private maxConversations = 100;
  private maxMessagesPerBranch = 1000;

  constructor() {
    super();
    this.loadFromStorage();
  }

  // Create new conversation
  createConversation(options: {
    title?: string;
    model?: string;
    agentMode?: string;
    workspaceContext?: any;
  } = {}): Conversation {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const branchId = `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation: Conversation = {
      id,
      title: options.title || 'New Conversation',
      branches: [{
        id: branchId,
        messages: [],
        title: 'Main',
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      activeBranchId: branchId,
      model: options.model || 'claude-3-5-sonnet-20241022',
      agentMode: options.agentMode || 'chat',
      workspaceContext: options.workspaceContext,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      isStarred: false,
      isArchived: false
    };

    this.conversations.set(id, conversation);
    this.saveToStorage();
    this.emit('conversationCreated', conversation);
    
    return conversation;
  }

  // Get conversation by ID
  getConversation(id: string): Conversation | null {
    return this.conversations.get(id) || null;
  }

  // Get all conversations
  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Get conversations with filters
  getConversations(filters: {
    model?: string;
    agentMode?: string;
    tags?: string[];
    isStarred?: boolean;
    isArchived?: boolean;
    search?: string;
  } = {}): Conversation[] {
    let conversations = this.getAllConversations();

    if (filters.model) {
      conversations = conversations.filter(c => c.model === filters.model);
    }

    if (filters.agentMode) {
      conversations = conversations.filter(c => c.agentMode === filters.agentMode);
    }

    if (filters.tags && filters.tags.length > 0) {
      conversations = conversations.filter(c => 
        filters.tags!.some(tag => c.tags.includes(tag))
      );
    }

    if (filters.isStarred !== undefined) {
      conversations = conversations.filter(c => c.isStarred === filters.isStarred);
    }

    if (filters.isArchived !== undefined) {
      conversations = conversations.filter(c => c.isArchived === filters.isArchived);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      conversations = conversations.filter(c => 
        c.title.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower) ||
        c.branches.some(b => 
          b.messages.some(m => 
            m.content.toLowerCase().includes(searchLower)
          )
        )
      );
    }

    return conversations;
  }

  // Add message to conversation
  addMessage(conversationId: string, message: Omit<ConversationMessage, 'id' | 'timestamp'>): ConversationMessage | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    const branch = conversation.branches.find(b => b.id === conversation.activeBranchId);
    if (!branch) return null;

    const fullMessage: ConversationMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    branch.messages.push(fullMessage);
    
    // Limit messages per branch
    if (branch.messages.length > this.maxMessagesPerBranch) {
      branch.messages = branch.messages.slice(-this.maxMessagesPerBranch);
    }

    // Update timestamps
    branch.updatedAt = new Date();
    conversation.updatedAt = new Date();

    // Auto-generate title from first user message
    if (conversation.title === 'New Conversation' && message.role === 'user') {
      conversation.title = this.generateTitle(message.content);
    }

    this.saveToStorage();
    this.emit('messageAdded', { conversation, message: fullMessage });
    
    return fullMessage;
  }

  // Create branch from message
  createBranch(conversationId: string, fromMessageId: string, title?: string): ConversationBranch | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    const currentBranch = conversation.branches.find(b => b.id === conversation.activeBranchId);
    if (!currentBranch) return null;

    const messageIndex = currentBranch.messages.findIndex(m => m.id === fromMessageId);
    if (messageIndex === -1) return null;

    const branchId = `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newBranch: ConversationBranch = {
      id: branchId,
      parentMessageId: fromMessageId,
      messages: currentBranch.messages.slice(0, messageIndex + 1),
      title: title || `Branch ${conversation.branches.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    conversation.branches.push(newBranch);
    conversation.activeBranchId = branchId;
    conversation.updatedAt = new Date();

    this.saveToStorage();
    this.emit('branchCreated', { conversation, branch: newBranch });
    
    return newBranch;
  }

  // Switch active branch
  switchBranch(conversationId: string, branchId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    const branch = conversation.branches.find(b => b.id === branchId);
    if (!branch) return false;

    conversation.activeBranchId = branchId;
    conversation.updatedAt = new Date();

    this.saveToStorage();
    this.emit('branchSwitched', { conversation, branchId });
    
    return true;
  }

  // Update conversation metadata
  updateConversation(conversationId: string, updates: Partial<Pick<Conversation, 'title' | 'description' | 'tags' | 'isStarred' | 'isArchived'>>): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    Object.assign(conversation, updates);
    conversation.updatedAt = new Date();

    this.saveToStorage();
    this.emit('conversationUpdated', conversation);
    
    return true;
  }

  // Delete conversation
  deleteConversation(conversationId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    this.conversations.delete(conversationId);
    this.saveToStorage();
    this.emit('conversationDeleted', { id: conversationId, conversation });
    
    return true;
  }

  // Export conversation
  exportConversation(conversationId: string): ConversationExport | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    return {
      version: '1.0',
      conversation: { ...conversation },
      exportedAt: new Date()
    };
  }

  // Import conversation
  importConversation(exportData: ConversationExport): Conversation | null {
    if (exportData.version !== '1.0') {
      throw new Error('Unsupported export version');
    }

    const conversation = exportData.conversation;
    
    // Generate new ID to avoid conflicts
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    conversation.id = newId;
    conversation.title = `${conversation.title} (Imported)`;
    conversation.createdAt = new Date();
    conversation.updatedAt = new Date();

    this.conversations.set(newId, conversation);
    this.saveToStorage();
    this.emit('conversationImported', conversation);
    
    return conversation;
  }

  // Get conversation statistics
  getStatistics(): {
    totalConversations: number;
    totalMessages: number;
    totalBranches: number;
    modelUsage: Record<string, number>;
    agentModeUsage: Record<string, number>;
    averageMessagesPerConversation: number;
  } {
    const conversations = this.getAllConversations();
    const modelUsage: Record<string, number> = {};
    const agentModeUsage: Record<string, number> = {};
    let totalMessages = 0;
    let totalBranches = 0;

    conversations.forEach(conv => {
      modelUsage[conv.model] = (modelUsage[conv.model] || 0) + 1;
      agentModeUsage[conv.agentMode] = (agentModeUsage[conv.agentMode] || 0) + 1;
      totalBranches += conv.branches.length;
      conv.branches.forEach(branch => {
        totalMessages += branch.messages.length;
      });
    });

    return {
      totalConversations: conversations.length,
      totalMessages,
      totalBranches,
      modelUsage,
      agentModeUsage,
      averageMessagesPerConversation: conversations.length > 0 ? totalMessages / conversations.length : 0
    };
  }

  // Private methods
  private generateTitle(content: string): string {
    // Extract first meaningful sentence or phrase
    const cleaned = content.trim().replace(/\n+/g, ' ').substring(0, 100);
    const sentences = cleaned.split(/[.!?]+/);
    return sentences[0].trim() || 'Untitled Conversation';
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.conversations.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save conversations to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const entries = JSON.parse(data);
        this.conversations = new Map(entries.map(([id, conv]: [string, any]) => [
          id,
          {
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            branches: conv.branches.map((branch: any) => ({
              ...branch,
              createdAt: new Date(branch.createdAt),
              updatedAt: new Date(branch.updatedAt),
              messages: branch.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            }))
          }
        ]));
      }
    } catch (error) {
      console.error('Failed to load conversations from storage:', error);
    }
  }

  // Cleanup old conversations
  cleanup(): void {
    const conversations = this.getAllConversations();
    if (conversations.length > this.maxConversations) {
      const toDelete = conversations
        .filter(c => !c.isStarred && !c.isArchived)
        .slice(this.maxConversations);
      
      toDelete.forEach(conv => {
        this.conversations.delete(conv.id);
      });
      
      this.saveToStorage();
      this.emit('conversationsCleanedUp', { deleted: toDelete.length });
    }
  }
}

// Global instance
let globalConversationManager: ConversationManager | null = null;

export function getConversationManager(): ConversationManager {
  if (!globalConversationManager) {
    globalConversationManager = new ConversationManager();
  }
  return globalConversationManager;
}
