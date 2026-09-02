import React from 'react';
import Head from 'next/head';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import ChatWindow from '../../components/ChatWindow/ChatWindow';

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>Chat Assistant | CampusMind</title>
      </Head>
      <ChatWindow />
    </ProtectedRoute>
  );
}
