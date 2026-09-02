import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import { useChatStore } from '../../store/chatStore';

export default function ConversationDetailPage() {
  const router = useRouter();
  const { conversationId } = router.query;
  const { loadConversation, activeConversationId } = useChatStore();

  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, activeConversationId, loadConversation]);

  return (
    <ProtectedRoute>
      <Head>
        <title>Conversation | CampusMind</title>
      </Head>
      <ChatWindow />
    </ProtectedRoute>
  );
}
