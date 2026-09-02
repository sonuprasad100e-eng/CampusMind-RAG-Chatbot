# CampusMind â€” RAG-Based College Information Chatbot
## Specification (Spec Driven Development)

---

## Table of Contents
1. Project Overview & Tech Stack
2. Authentication & Core Features
3. Document Processing & RAG Pipeline
4. AI Answer Generation & Real-Time Layer
5. Frontend Pages
6. Backend Architecture & Database Collections
7. API Endpoints
8. Folder Structure & Development Phases
9. UI, Security, and Outcome Requirements
10. Codex / AI Agent Implementation Instructions

---

## 1. Project Overview & Tech Stack

### Project Overview
Build a full-stack AI-powered college information assistant called **CampusMind**. Students must be able to log in, ask questions in plain English about admissions, departments, courses, fees, exams, the academic calendar, hostel, library, clubs, placements, scholarships, policies, and events, and receive answers that are generated strictly from the college's own uploaded documents (PDFs, notices, FAQs, circulars). Every answer must be traceable to the source document it came from. Admins must be able to upload, update, and delete documents that feed the knowledge base. The system must clearly state when it does not have enough information to answer, instead of guessing.

This is a **Retrieval-Augmented Generation (RAG)** project. Connecting a chat UI directly to an LLM without a working retrieval pipeline does not satisfy this specification. A real embedding step, a real vector search step, and a real "retrieved context â†’ LLM" step are mandatory and must be independently verifiable.

### Tech Stack
- **Frontend:** Next.js (Pages Router), React 18, Tailwind CSS, Zustand, Axios, Socket.IO client, react-markdown.
- **Backend:** Node.js, Express, MongoDB, Mongoose, JSON Web Tokens, bcryptjs, multer, express-validator, helmet, morgan, compression, Socket.IO.
- **Document Processing:** `pdf-parse` for PDFs, `mammoth` for `.docx`, a custom recursive character-based chunker (target chunk size 800 characters, 150-character overlap).
- **Embeddings:** OpenAI `text-embedding-3-small` as primary provider, Google Gemini `text-embedding-004` as fallback provider.
- **Vector Database:** MongoDB Atlas Vector Search (`$vectorSearch` aggregation stage) on the `documentchunks` collection. No separate vector-database service is required; this keeps deployment to a single database.
- **LLM (Answer Generation):** OpenRouter as the primary provider, Google Gemini as the fallback provider, and a deterministic "insufficient context" responder when neither provider is configured or when retrieval confidence is too low.
- **Background Jobs:** BullMQ on Redis for document ingestion (extraction â†’ chunking â†’ embedding), with a synchronous in-process fallback when Redis is not configured.
- **Deployment:** Frontend on Vercel, backend on Render/Railway, database on MongoDB Atlas, file storage on Cloudinary or local disk with a signed-URL abstraction.

---

## 2. Authentication & Core Features

### Authentication
The system must support two roles: `student` and `admin`. Authentication must cover registration, login, JWT-based session handling (access token in memory/Zustand, refresh token in an HTTP-only cookie), a `/auth/me` profile endpoint, protected routes on both frontend and backend, password hashing with bcrypt at cost factor 12, and role-gated access to the admin document-management area. A student must never be able to reach `/admin/*` routes or `/api/admin/*` endpoints.

### Core Features (Must-Have)
- **Chat Interface** â€” students ask questions in a conversational UI with streaming responses.
- **Document Upload** â€” admins upload PDF/DOCX/TXT files tagged by category (Admissions, Departments, Courses, Fees, Exams, Academic Calendar, Hostel, Library, Clubs, Placements, Scholarships, Policies, Events).
- **Document Processing** â€” text extraction and chunking runs automatically after upload.
- **Embedding Generation** â€” every chunk is embedded and stored with its vector.
- **Vector Database / Semantic Search** â€” MongoDB Atlas `$vectorSearch` returns the top-k most relevant chunks for a query.
- **RAG Pipeline** â€” retrieved chunks are assembled into a context block and passed to the LLM with the user's question.
- **AI-Generated Answers** â€” answers must be grounded in retrieved context; the system prompt must explicitly forbid answering from the model's own general knowledge on college-specific facts.
- **Source/Reference Display** â€” every answer shows the document title, category, and (where available) page number it was drawn from.
- **Unknown Question Handling** â€” if the top retrieved chunks fall below a similarity threshold (default `0.72`), the assistant must respond that it does not have this information and suggest contacting the relevant department, rather than fabricating an answer.
- **Chat History / Conversation Context** â€” conversations persist per user; the last N turns are used to resolve follow-up questions (e.g., "what about for M.Tech?").
- **Admin Document Management** â€” upload, re-process, replace, and delete documents, with ingestion status visible per document.
- **Database/Storage Integration** â€” MongoDB for metadata, chunks, and vectors; file storage for the original uploaded documents.
- **Working Frontendâ€“Backend Integration** and **Working Deployed Application** â€” the full flow must work end-to-end in production, not only in local development.

### Bonus Features (Optional, Prioritized)
Department-wise knowledge base filtering, admin analytics dashboard, confidence/relevance score shown per answer, source highlighting (the exact sentence/paragraph used), answer feedback (ðŸ‘/ðŸ‘Ž), suggested follow-up questions, streaming AI responses, hybrid keyword + semantic search, document re-ranking, OCR for scanned PDFs, conversation export, and role-based access beyond student/admin (e.g., faculty).

---

## 3. Document Processing & RAG Pipeline

### Required Pipeline
```
College Documents â†’ Text Extraction â†’ Chunking â†’ Embeddings â†’ Vector Database
â†’ Similarity Search â†’ Relevant Context â†’ LLM â†’ Final Answer + Source
```

### Document Processing
When an admin uploads a document, the backend must: store the original file, extract raw text (`pdf-parse` / `mammoth`), split the text into overlapping chunks (~800 characters, 150-character overlap, split on paragraph/sentence boundaries where possible), attach metadata to every chunk (`documentId`, `title`, `category`, `pageNumber` when derivable, `chunkIndex`), generate an embedding vector per chunk, and store each chunk with its vector in the `documentchunks` collection. Ingestion status on the parent `Document` must move through `UPLOADED â†’ PROCESSING â†’ READY` or `UPLOADED â†’ PROCESSING â†’ FAILED`, and must be visible on the admin dashboard.

### Retrieval & Generation (RAG Pipeline)
1. The user's question is embedded using the same embedding model used at ingestion time.
2. `$vectorSearch` retrieves the top-k (default `k = 5`) most similar chunks, optionally pre-filtered by category if the student selected one.
3. Retrieved chunks are deduplicated by source document and assembled into a single context block, each chunk tagged with its source document title for citation.
4. The context block, the user's question, and the last few turns of conversation history are sent to the LLM with a system prompt that instructs it to answer only from the provided context and to say so explicitly when the context is insufficient.
5. The LLM's answer is returned to the client along with the list of source documents actually used, and the top similarity score of the retrieved set (used for the unknown-question threshold and, optionally, a displayed confidence score).

### Unknown Question Handling
If no retrieved chunk clears the similarity threshold, or the LLM itself states the context does not answer the question, the response must be flagged `answerable: false` and the frontend must render a clear "I don't have information on this yet â€” please check with the [category] office" message instead of a fabricated answer.

---

## 4. AI Answer Generation & Real-Time Layer

### AI Provider Fallback Chain
- Embeddings: OpenAI `text-embedding-3-small` â†’ Google Gemini `text-embedding-004` if `OPENAI_API_KEY` is absent.
- Generation: OpenRouter (`OPENROUTER_API_KEY`) â†’ Google Gemini (`GEMINI_API_KEY`) â†’ deterministic "insufficient information" responder if neither key is configured. The active provider must be reported in every response's metadata as `provider: 'openrouter' | 'gemini' | 'fallback'`.

### Real-Time Layer
Socket.IO must stream the assistant's answer to the client token-by-token (or chunk-by-chunk) as it is generated, so the chat interface shows a live typing effect rather than waiting for the full response. Ingestion progress events (`document:processing`, `document:ready`, `document:failed`) must also be emitted so the admin dashboard updates without a page refresh.

---

## 5. Frontend Pages

The application uses the Next.js Pages Router.

- **`/`** â€“ Landing page introducing CampusMind, a "how it works" (RAG flow) explainer, and login/register CTAs.
- **`/login`** â€“ Email/password login with JWT handling and Zustand persistence.
- **`/register`** â€“ Student registration (role defaults to `student`; `admin` accounts are seeded/promoted manually, never self-registered).
- **`/chat`** â€“ Main chat interface: message list, streaming assistant responses, source citations under each answer, category filter chips, suggested-question pills, feedback thumbs, and a conversation sidebar (new chat, past chats).
- **`/chat/[conversationId]`** â€“ Reopen a specific past conversation with full history.
- **`/admin`** â€“ Admin dashboard: document count by category, ingestion health, recent uploads, and quick stats (total chats, unanswered-question rate).
- **`/admin/documents`** â€“ Document management table (title, category, status, uploaded date, actions: reprocess, delete) plus an upload form (drag-and-drop, category selector, multi-file support).
- **`/admin/analytics`** *(bonus)* â€“ Most-asked questions, most-cited documents, feedback breakdown, unanswered-question log for identifying knowledge-base gaps.
- **`/settings`** â€“ Profile details, password change, and (for students) chat export.

---

## 6. Backend Architecture & Database Collections

### Backend Architecture
- **Routes** â€” HTTP routing, request validation via `express-validator`, middleware composition (`auth`, `requireAdmin`, `validate`, `errorHandler`).
- **Controllers** â€” request parsing and response shaping only; never talk to Mongoose models directly.
- **Services** â€” own all business logic: `authService`, `documentService` (ingestion pipeline), `embeddingService`, `retrievalService` (vector search), `chatService` (RAG orchestration + history), `feedbackService`.
- **Queues Layer** â€” wraps BullMQ/Redis for the ingestion pipeline, with an in-process synchronous fallback.
- **Config Layer** â€” centralizes environment variables, MongoDB connection, Socket.IO setup.

### Database Collections
- **Users** â€” `name`, `email`, `password` (`select: false`), `role: 'student' | 'admin'`, `lastLogin`.
- **Documents** â€” `title`, `category`, `originalFileUrl`, `fileType`, `uploadedBy`, `status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED'`, `chunkCount`, `version`.
- **DocumentChunks** â€” `documentId`, `content`, `embedding` (vector array), `pageNumber`, `chunkIndex`, `category`.
- **Conversations** â€” `userId`, `title`, `createdAt`, `lastMessageAt`.
- **Messages** â€” `conversationId`, `role: 'user' | 'assistant'`, `content`, `sources` (array of `{documentId, title, category, pageNumber, score}`), `answerable`, `confidenceScore`, `provider`.
- **Feedback** â€” `messageId`, `userId`, `rating: 'up' | 'down'`, `comment`.
- **AnalyticsEvents** *(bonus)* â€” `type: 'question_asked' | 'unanswered' | 'document_cited'`, `payload`, `createdAt`.

---

## 7. API Endpoints

### Health & Auth
- `GET /api/health` â€“ System heartbeat.
- `POST /api/auth/register` â€“ Register a new student account.
- `POST /api/auth/login` â€“ Authenticate and issue JWT.
- `GET /api/auth/me` â€“ Fetch current user profile.

### Chat / RAG
- `POST /api/chat/message` â€“ Submit a question; runs the full RAG pipeline; streams the answer via Socket.IO and returns the final message with sources over HTTP once complete.
- `GET /api/chat/conversations` â€“ List the current user's conversations.
- `GET /api/chat/conversations/:id` â€“ Fetch full message history for a conversation.
- `DELETE /api/chat/conversations/:id` â€“ Delete a conversation.
- `POST /api/chat/messages/:id/feedback` â€“ Submit ðŸ‘/ðŸ‘Ž feedback on an answer.

### Documents (Admin Only)
- `GET /api/admin/documents` â€“ List all documents with status and category filters.
- `POST /api/admin/documents` â€“ Upload one or more documents (multipart/form-data), enqueues ingestion.
- `POST /api/admin/documents/:id/reprocess` â€“ Re-run extraction/chunking/embedding for a document.
- `DELETE /api/admin/documents/:id` â€“ Delete a document and its chunks.
- `GET /api/admin/documents/:id/status` â€“ Poll ingestion status (used before Socket.IO events arrive).

### Analytics (Admin Only, Bonus)
- `GET /api/admin/analytics/overview` â€“ Question volume, unanswered-question rate, top-cited documents.
- `GET /api/admin/analytics/unanswered` â€“ Log of questions that returned `answerable: false`, for knowledge-base gap-filling.

---

## 8. Folder Structure & Development Phases

### Frontend Structure
```
client/
â””â”€â”€ src/
    â”œâ”€â”€ components/
    â”‚   â”œâ”€â”€ ChatWindow/
    â”‚   â”œâ”€â”€ MessageBubble/
    â”‚   â”œâ”€â”€ SourceCitation/
    â”‚   â”œâ”€â”€ DocumentUploadForm/
    â”‚   â”œâ”€â”€ DocumentTable/
    â”‚   â””â”€â”€ ProtectedRoute/
    â”œâ”€â”€ pages/
    â”‚   â”œâ”€â”€ _app.js
    â”‚   â”œâ”€â”€ index.js
    â”‚   â”œâ”€â”€ login.js
    â”‚   â”œâ”€â”€ register.js
    â”‚   â”œâ”€â”€ chat/
    â”‚   â”‚   â”œâ”€â”€ index.js
    â”‚   â”‚   â””â”€â”€ [conversationId].js
    â”‚   â”œâ”€â”€ admin/
    â”‚   â”‚   â”œâ”€â”€ index.js
    â”‚   â”‚   â”œâ”€â”€ documents.js
    â”‚   â”‚   â””â”€â”€ analytics.js
    â”‚   â””â”€â”€ settings.js
    â”œâ”€â”€ store/
    â”‚   â”œâ”€â”€ authStore.js
    â”‚   â””â”€â”€ chatStore.js
    â””â”€â”€ services/
        â”œâ”€â”€ api.js
        â””â”€â”€ socket.js
```

### Backend Structure
```
server/
â””â”€â”€ src/
    â”œâ”€â”€ config/
    â”‚   â”œâ”€â”€ env.js
    â”‚   â”œâ”€â”€ db.js
    â”‚   â””â”€â”€ socket.js
    â”œâ”€â”€ routes/
    â”‚   â”œâ”€â”€ authRoutes.js
    â”‚   â”œâ”€â”€ chatRoutes.js
    â”‚   â”œâ”€â”€ documentRoutes.js
    â”‚   â””â”€â”€ analyticsRoutes.js
    â”œâ”€â”€ controllers/
    â”‚   â”œâ”€â”€ authController.js
    â”‚   â”œâ”€â”€ chatController.js
    â”‚   â””â”€â”€ documentController.js
    â”œâ”€â”€ services/
    â”‚   â”œâ”€â”€ authService.js
    â”‚   â”œâ”€â”€ documentService.js
    â”‚   â”œâ”€â”€ embeddingService.js
    â”‚   â”œâ”€â”€ retrievalService.js
    â”‚   â”œâ”€â”€ chatService.js
    â”‚   â””â”€â”€ feedbackService.js
    â”œâ”€â”€ models/
    â”‚   â”œâ”€â”€ User.js
    â”‚   â”œâ”€â”€ Document.js
    â”‚   â”œâ”€â”€ DocumentChunk.js
    â”‚   â”œâ”€â”€ Conversation.js
    â”‚   â”œâ”€â”€ Message.js
    â”‚   â””â”€â”€ Feedback.js
    â””â”€â”€ queues/
        â””â”€â”€ ingestionQueue.js
```

### Development Phases
- **Phase 1:** Project setup â€” Next.js, Express, MongoDB, JWT authentication, Zustand auth store, protected routes.
- **Phase 2:** Document upload + processing pipeline (extraction, chunking) with admin document-management UI and ingestion status tracking.
- **Phase 3:** Embedding generation and MongoDB Atlas Vector Search integration; verify semantic search returns correct chunks for known test queries before moving on.
- **Phase 4:** Full RAG pipeline â€” retrieval â†’ context assembly â†’ LLM call â†’ answer + source citation + unknown-question handling.
- **Phase 5:** Chat interface with conversation history/context, streaming responses via Socket.IO.
- **Phase 6:** Bonus layer â€” feedback (ðŸ‘/ðŸ‘Ž), suggested questions, admin analytics dashboard, category filtering, confidence score display.

---

## 9. UI, Security, and Outcome Requirements

### UI and UX Requirements
The chat UI must use Tailwind with a clean, calm student-facing aesthetic, show a streaming/typing indicator while the assistant responds, render every answer with a visibly separate "Sources" section (document title + category, clickable to view the original file), show category filter chips above the chat input, disable the send button while a response is streaming, and clearly visually distinguish an "I don't know" response from a normal answer (e.g., a muted/warning style). The admin document table must show per-row ingestion status with a spinner for `PROCESSING` and an error state with a retry action for `FAILED`.

### Security Requirements
The application must hash passwords with bcrypt at cost 12, sign and verify JWTs with `JWT_SECRET`, set HTTP security headers via helmet, restrict CORS to `CLIENT_URL`, rate-limit both auth endpoints and `/api/chat/message` via `express-rate-limit`, validate every request body with `express-validator`, enforce `requireAdmin` middleware on all `/api/admin/*` routes, validate uploaded file types/size (PDF, DOCX, TXT only, max 20MB) before processing, and never expose raw embedding vectors or internal chunk IDs to the frontend.

### Final Expected Outcome
The completed platform must let a student ask a college-related question in plain English and receive an answer that is grounded in the college's actual documents, with visible sources, streamed in real time, and with an honest "I don't know" fallback when the knowledge base has no relevant information. Admins must be able to keep that knowledge base current by uploading, reprocessing, and deleting documents, and must be able to see what students are asking and where the knowledge base has gaps. The retrieval pipeline (embedding â†’ vector search â†’ context â†’ LLM) must be independently demonstrable, since a chatbot without a working retrieval step does not satisfy this specification.

---

## 10. Codex / AI Agent Implementation Instructions

The AI coding agent must build the application phase by phase as listed in Section 8, follow the folder structure strictly, keep controllers thin and push all logic into services, never call Mongoose models directly from a controller, never call an embedding/LLM provider directly from a controller (always through a service), treat every secret as `process.env`, implement the embedding/generation fallback chains exactly as specified in Sections 3â€“4, emit a Socket.IO event for every ingestion status change and every streamed answer token, verify semantic search quality with at least three known test queries before starting Phase 4, and report the list of files created or changed at the end of every phase.
