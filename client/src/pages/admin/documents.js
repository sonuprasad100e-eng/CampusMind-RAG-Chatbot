import React, { useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import DocumentUploadForm from '../../components/DocumentUploadForm/DocumentUploadForm';
import DocumentTable from '../../components/DocumentTable/DocumentTable';

export default function AdminDocumentsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <ProtectedRoute roleRequired="admin">
      <Head>
        <title>Document Management | CampusMind Admin</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Knowledge Base Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload, chunk, embed, and manage college documents that feed the CampusMind RAG vector pipeline.
          </p>
        </div>

        {/* Upload Form Section */}
        <DocumentUploadForm onUploadSuccess={handleUploadSuccess} />

        {/* Document Table Section */}
        <DocumentTable refreshTrigger={refreshKey} />
      </div>
    </ProtectedRoute>
  );
}
