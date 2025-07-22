'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ConversationManager, 
  Conversation, 
  ConversationMessage, 
  ConversationBranch,
  getConversationManager 
} from '@/lib/ai/conversation-manager';

/**
 * React hook for conversation management
 * Provides reactive access to conversation state and operations
 */

export interface UseConversationManagerOptions {
  autoSave?: boolean;
  maxRecentConversations?: number;
}

export interface UseConversationManagerReturn {
  // Current conversation state
  currentConversation: Conversation | null;
  currentBranch: ConversationBranch | null;
  messages: ConversationMessage[];
  
  // All conversations
  conversations: Conversation[];
  recentConversations: Conversation[];
  starredConversations: Conversation[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Conversation operations
  createConversation: (options?: {
    title?: string;
    model?: string;
    agentMode?: string;
    workspaceContext?: any;
  }) => Conversation;
  loadConversation: (id: string) => boolean;
  deleteConversation: (id: string) => boolean;
  updateConversation: (id: string, updates: Partial<Pick<Conversation, 'title' | 'description' | 'tags' | 'isStarred' | 'isArchived'>>) => boolean;
  
  // Message operations
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => ConversationMessage | null;
  
  // Branch operations
  createBranch: (fromMessageId: string, title?: string) => ConversationBranch | null;
  switchBranch: (branchId: string) => boolean;
  
  // Search and filter
  searchConversations: (query: string) => Conversation[];
  filterConversations: (filters: {
    model?: string;
    agentMode?: string;
    tags?: string[];
    isStarred?: boolean;
    isArchived?: boolean;
  }) => Conversation[];
  
  // Import/Export
  exportConversation: (id?: string) => string | null;
  importConversation: (data: string) => boolean;
  
  // Statistics
  getStatistics: () => ReturnType<ConversationManager['getStatistics']>;
}

export function useConversationManager(options: UseConversationManagerOptions = {}): UseConversationManagerReturn {
  const {
    autoSave = true,
    maxRecentConversations = 10
  } = options;

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const managerRef = useRef<ConversationManager | null>(null);

  // Initialize conversation manager
  useEffect(() => {
    try {
      managerRef.current = getConversationManager();
      
      // Load initial conversations
      const allConversations = managerRef.current.getAllConversations();
      setConversations(allConversations);
      
      // Load most recent conversation if available
      if (allConversations.length > 0 && !currentConversation) {
        setCurrentConversation(allConversations[0]);
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize conversation manager');
      setIsLoading(false);
    }
  }, [currentConversation]);

  // Set up event listeners
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    const handleConversationCreated = (conversation: Conversation) => {
      setConversations(prev => [conversation, ...prev]);
      setCurrentConversation(conversation);
    };

    const handleConversationUpdated = (conversation: Conversation) => {
      setConversations(prev => prev.map(c => c.id === conversation.id ? conversation : c));
      if (currentConversation?.id === conversation.id) {
        setCurrentConversation(conversation);
      }
    };

    const handleConversationDeleted = ({ id }: { id: string }) => {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        const remaining = conversations.filter(c => c.id !== id);
        setCurrentConversation(remaining.length > 0 ? remaining[0] : null);
      }
    };

    const handleMessageAdded = ({ conversation }: { conversation: Conversation }) => {
      setConversations(prev => prev.map(c => c.id === conversation.id ? conversation : c));
      if (currentConversation?.id === conversation.id) {
        setCurrentConversation(conversation);
      }
    };

    const handleBranchCreated = ({ conversation }: { conversation: Conversation }) => {
      setConversations(prev => prev.map(c => c.id === conversation.id ? conversation : c));
      if (currentConversation?.id === conversation.id) {
        setCurrentConversation(conversation);
      }
    };

    const handleBranchSwitched = ({ conversation }: { conversation: Conversation }) => {
      setConversations(prev => prev.map(c => c.id === conversation.id ? conversation : c));
      if (currentConversation?.id === conversation.id) {
        setCurrentConversation(conversation);
      }
    };

    // Subscribe to events
    manager.on('conversationCreated', handleConversationCreated);
    manager.on('conversationUpdated', handleConversationUpdated);
    manager.on('conversationDeleted', handleConversationDeleted);
    manager.on('messageAdded', handleMessageAdded);
    manager.on('branchCreated', handleBranchCreated);
    manager.on('branchSwitched', handleBranchSwitched);

    return () => {
      manager.removeListener('conversationCreated', handleConversationCreated);
      manager.removeListener('conversationUpdated', handleConversationUpdated);
      manager.removeListener('conversationDeleted', handleConversationDeleted);
      manager.removeListener('messageAdded', handleMessageAdded);
      manager.removeListener('branchCreated', handleBranchCreated);
      manager.removeListener('branchSwitched', handleBranchSwitched);
    };
  }, [currentConversation, conversations]);

  // Derived state
  const currentBranch = currentConversation?.branches.find(b => b.id === currentConversation.activeBranchId) || null;
  const messages = currentBranch?.messages || [];
  const recentConversations = conversations.slice(0, maxRecentConversations);
  const starredConversations = conversations.filter(c => c.isStarred);

  // Operations
  const createConversation = useCallback((options: {
    title?: string;
    model?: string;
    agentMode?: string;
    workspaceContext?: any;
  } = {}) => {
    if (!managerRef.current) throw new Error('Conversation manager not initialized');
    
    setIsSaving(true);
    try {
      const conversation = managerRef.current.createConversation(options);
      setIsSaving(false);
      return conversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      setIsSaving(false);
      throw err;
    }
  }, []);

  const loadConversation = useCallback((id: string) => {
    if (!managerRef.current) return false;
    
    const conversation = managerRef.current.getConversation(id);
    if (conversation) {
      setCurrentConversation(conversation);
      return true;
    }
    return false;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    if (!managerRef.current) return false;
    
    setIsSaving(true);
    try {
      const result = managerRef.current.deleteConversation(id);
      setIsSaving(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
      setIsSaving(false);
      return false;
    }
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<Pick<Conversation, 'title' | 'description' | 'tags' | 'isStarred' | 'isArchived'>>) => {
    if (!managerRef.current) return false;
    
    setIsSaving(true);
    try {
      const result = managerRef.current.updateConversation(id, updates);
      setIsSaving(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update conversation');
      setIsSaving(false);
      return false;
    }
  }, []);

  const addMessage = useCallback((message: Omit<ConversationMessage, 'id' | 'timestamp'>) => {
    if (!managerRef.current || !currentConversation) return null;
    
    if (autoSave) setIsSaving(true);
    try {
      const result = managerRef.current.addMessage(currentConversation.id, message);
      if (autoSave) setIsSaving(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message');
      if (autoSave) setIsSaving(false);
      return null;
    }
  }, [currentConversation, autoSave]);

  const createBranch = useCallback((fromMessageId: string, title?: string) => {
    if (!managerRef.current || !currentConversation) return null;
    
    setIsSaving(true);
    try {
      const result = managerRef.current.createBranch(currentConversation.id, fromMessageId, title);
      setIsSaving(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
      setIsSaving(false);
      return null;
    }
  }, [currentConversation]);

  const switchBranch = useCallback((branchId: string) => {
    if (!managerRef.current || !currentConversation) return false;
    
    try {
      return managerRef.current.switchBranch(currentConversation.id, branchId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch branch');
      return false;
    }
  }, [currentConversation]);

  const searchConversations = useCallback((query: string) => {
    if (!managerRef.current) return [];
    return managerRef.current.getConversations({ search: query });
  }, []);

  const filterConversations = useCallback((filters: {
    model?: string;
    agentMode?: string;
    tags?: string[];
    isStarred?: boolean;
    isArchived?: boolean;
  }) => {
    if (!managerRef.current) return [];
    return managerRef.current.getConversations(filters);
  }, []);

  const exportConversation = useCallback((id?: string) => {
    if (!managerRef.current) return null;
    
    const conversationId = id || currentConversation?.id;
    if (!conversationId) return null;
    
    try {
      const exportData = managerRef.current.exportConversation(conversationId);
      return exportData ? JSON.stringify(exportData, null, 2) : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export conversation');
      return null;
    }
  }, [currentConversation]);

  const importConversation = useCallback((data: string) => {
    if (!managerRef.current) return false;
    
    setIsSaving(true);
    try {
      const exportData = JSON.parse(data);
      const conversation = managerRef.current.importConversation(exportData);
      setIsSaving(false);
      return !!conversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import conversation');
      setIsSaving(false);
      return false;
    }
  }, []);

  const getStatistics = useCallback(() => {
    if (!managerRef.current) {
      return {
        totalConversations: 0,
        totalMessages: 0,
        totalBranches: 0,
        modelUsage: {},
        agentModeUsage: {},
        averageMessagesPerConversation: 0
      };
    }
    return managerRef.current.getStatistics();
  }, []);

  return {
    // Current conversation state
    currentConversation,
    currentBranch,
    messages,
    
    // All conversations
    conversations,
    recentConversations,
    starredConversations,
    
    // Loading states
    isLoading,
    isSaving,
    error,
    
    // Conversation operations
    createConversation,
    loadConversation,
    deleteConversation,
    updateConversation,
    
    // Message operations
    addMessage,
    
    // Branch operations
    createBranch,
    switchBranch,
    
    // Search and filter
    searchConversations,
    filterConversations,
    
    // Import/Export
    exportConversation,
    importConversation,
    
    // Statistics
    getStatistics
  };
}
