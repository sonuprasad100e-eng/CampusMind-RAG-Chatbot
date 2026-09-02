import { create } from 'zustand';
import api from '../services/api';
import { getSocket } from '../services/socket';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isStreaming: false,
  streamingContent: '',
  selectedCategory: 'All',
  selectedDepartment: 'All',
  selectedLanguage: 'en',

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedDepartment: (department) => set({ selectedDepartment: department }),
  setSelectedLanguage: (language) => set({ selectedLanguage: language }),

  loadConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const res = await api.get('/chat/conversations');
      const conversations = res.data?.data?.conversations || [];
      set({ conversations, isLoadingConversations: false });
      return conversations;
    } catch (err) {
      console.error('Failed to load conversations:', err);
      set({ isLoadingConversations: false });
      return [];
    }
  },

  loadConversation: async (conversationId) => {
    if (!conversationId) return;
    set({ isLoadingMessages: true, activeConversationId: conversationId });
    try {
      const res = await api.get(`/chat/conversations/${conversationId}`);
      const { messages } = res.data?.data || {};
      set({ messages: messages || [], isLoadingMessages: false });

      // Join socket room
      const socket = getSocket();
      if (socket) {
        socket.emit('join:conversation', conversationId);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
      set({ isLoadingMessages: false });
    }
  },

  createNewConversation: () => {
    const socket = getSocket();
    const currentId = get().activeConversationId;
    if (socket && currentId) {
      socket.emit('leave:conversation', currentId);
    }
    set({
      activeConversationId: null,
      messages: [],
      streamingContent: '',
      isStreaming: false,
    });
  },

  sendMessage: async (text) => {
    const { activeConversationId, selectedCategory, selectedDepartment, selectedLanguage, messages } = get();
    if (!text.trim()) return;

    // Optimistically add user message
    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      answerable: true,
    };

    set({
      messages: [...messages, tempUserMsg],
      isStreaming: true,
      streamingContent: '',
    });

    const socket = getSocket();

    // Setup streaming listener
    const onToken = (data) => {
      set((state) => ({
        streamingContent: state.streamingContent + (data.token || ''),
      }));
    };

    const onDone = (data) => {
      set((state) => {
        const assistantMsg = {
          _id: data.messageId || `msg-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          sources: data.sources || [],
          answerable: data.answerable,
          confidenceScore: data.confidenceScore,
          provider: data.provider,
          createdAt: new Date().toISOString(),
        };

        return {
          messages: [...state.messages, assistantMsg],
          isStreaming: false,
          streamingContent: '',
        };
      });

      if (socket) {
        socket.off('chat:token', onToken);
        socket.off('chat:done', onDone);
      }

      // Reload conversations list to refresh title
      get().loadConversations();
    };

    if (socket) {
      socket.on('chat:token', onToken);
      socket.on('chat:done', onDone);
    }

    try {
      const res = await api.post('/chat/message', {
        conversationId: activeConversationId || undefined,
        message: text,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        department: selectedDepartment !== 'All' ? selectedDepartment : undefined,
        language: selectedLanguage || 'en',
      });

      const { conversationId, assistantMessage } = res.data.data;

      if (!activeConversationId && conversationId) {
        set({ activeConversationId: conversationId });
        if (socket) {
          socket.emit('join:conversation', conversationId);
        }
      }

      // If socket wasn't connected or done event missed, ensure assistant message is present
      setTimeout(() => {
        set((state) => {
          if (state.isStreaming) {
            return {
              messages: [...state.messages, assistantMessage],
              isStreaming: false,
              streamingContent: '',
            };
          }
          return state;
        });
      }, 500);

      get().loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
      if (socket) {
        socket.off('chat:token', onToken);
        socket.off('chat:done', onDone);
      }
      set({
        isStreaming: false,
        streamingContent: '',
        messages: [
          ...get().messages,
          {
            _id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'Sorry, I encountered an error connecting to the server. Please try again.',
            answerable: false,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }
  },

  deleteConversation: async (conversationId) => {
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      set((state) => ({
        conversations: state.conversations.filter((c) => c._id !== conversationId),
        activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
        messages: state.activeConversationId === conversationId ? [] : state.messages,
      }));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  },

  submitFeedback: async (messageId, rating, comment = '') => {
    try {
      await api.post(`/chat/messages/${messageId}/feedback`, { rating, comment });
      return { success: true };
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      return { success: false };
    }
  },
}));
