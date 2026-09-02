# 🎓 CampusMind — RAG-Based College Information Chatbot

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black?logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Vector_Search-emerald?logo=mongodb)](https://www.mongodb.com/)
[![RAG Pipeline](https://img.shields.io/badge/RAG-Verified_Retrieval-blue)]()
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time_Streaming-white?logo=socket.io)](https://socket.io/)

**CampusMind** is a full-stack, enterprise-grade **Retrieval-Augmented Generation (RAG)** assistant for colleges and universities. It allows students to ask questions about admissions, fees, hostel rules, academic regulations, scholarships, placements, and clubs, receiving answers that are **grounded strictly in the university's official documents** with clickable source citations and zero hallucinations.

---

## 🌟 Key Features

- 🔍 **Real RAG Pipeline**: Document Text Extraction (`pdf-parse`, `mammoth`, `txt`) ➔ Recursive Character Chunking (~800 chars, 150 overlap) ➔ Dense Vector Embeddings ➔ MongoDB Atlas Vector Search (`$vectorSearch`) ➔ Grounded LLM Generation.
- ⚡ **Real-Time Token Streaming**: Low-latency typing effect powered by Socket.IO (`chat:token`, `chat:done`).
- 📚 **Traceable Citations**: Every answer displays the document title, category, similarity score percentage, and page number with modal preview.
- 🛡️ **Honest Unknown Detection**: Questions falling below the similarity threshold (`0.72`) return an honest "insufficient information" response with department guidance rather than guessing.
- 🔄 **Multi-Provider AI Fallback Chain**:
  - **Generation**: OpenRouter (`OPENROUTER_API_KEY`) ➔ Google Gemini (`GEMINI_API_KEY`) ➔ Deterministic Offline RAG Synthesizer.
  - **Embeddings**: OpenAI `text-embedding-3-small` ➔ Google Gemini `text-embedding-004` ➔ Deterministic Dense Semantic Vector Engine.
- 🔐 **Role-Based Access Control**: Student and Administrator roles protected by JWT, HTTP-only cookies, and bcrypt (cost factor 12).
- 📊 **Admin Knowledge Base & Analytics**:
  - Drag-and-drop document uploader with category tagging and live Socket.IO ingestion feedback (`UPLOADED` ➔ `PROCESSING` ➔ `READY` / `FAILED`).
  - Knowledge Base Gap Analysis logging unanswered questions for continuous improvement.
  - Response satisfaction feedback (👍 / 👎) and citation frequency metrics.

---

## 🏗️ Architecture & Pipeline Flow

```
+-----------------------------------------------------------------------------------+
|                            ADMIN DOCUMENT INGESTION                               |
|  PDF / DOCX / TXT  ──▶ Text Extraction ──▶ Recursive Chunker ──▶ Embedding Vector |
|                                                                         │         |
|                                                                         ▼         |
|                                                          [ MongoDB DocumentChunks]|
+-------------------------------------------------------------------------┼---------+
                                                                          │
+-------------------------------------------------------------------------▼---------+
|                              STUDENT RAG CHAT QUERY                               |
|  Student Query ──▶ Query Embedding ──▶ Vector Search ($vectorSearch / Cosine)     |
|                                                   │                               |
|                     ┌─────────────────────────────┴────────────────────────────┐  |
|                     ▼                                                          ▼  |
|            Score >= 0.72 (Relevant)                               Score < 0.72    |
|                     │                                                          │  |
|                     ▼                                                          ▼  |
|     Context Block + Multi-Turn History ──▶ LLM Provider              "I don't know|
|                     │                                                 check with  |
|                     ▼                                                 Dept Office"|
|     Socket.IO Streaming Answer + Citations                                        |
+-----------------------------------------------------------------------------------+
```

---

## 📋 Prerequisites

Make sure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (Tested on Node `v24.x`)
- **npm**: `v9.x` or higher
- **MongoDB**: Either a local MongoDB instance (`mongodb://127.0.0.1:27017/campusmind`), a free [MongoDB Atlas Cluster](https://www.mongodb.com/atlas), or **zero configuration** (the system automatically uses an in-memory MongoDB fallback if no database is running).

---

## 🚀 Quick Start (Local Setup in 4 Steps)

### Step 1: Install Dependencies
Open a terminal in the project root directory and run:

```bash
# Install root, server, and client dependencies
npm run install:all
```

*(Alternatively: `cd server && npm install && cd ../client && npm install`)*

---

### Step 2: Configure Environment Variables

1. **Server Environment** (`server/.env`):
   ```ini
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   
   # JWT Configuration
   JWT_SECRET=campusmind_super_secret_jwt_key_2026_rag_system
   JWT_EXPIRES_IN=7d

   # Database (Leave default for local or in-memory MongoDB fallback)
   MONGODB_URI=mongodb://127.0.0.1:27017/campusmind

   # RAG Thresholds
   RAG_SIMILARITY_THRESHOLD=0.72
   RAG_TOP_K=5

   # AI Provider API Keys (Optional - Deterministic offline fallback runs if empty)
   OPENROUTER_API_KEY=
   OPENAI_API_KEY=
   GEMINI_API_KEY=
   ```

2. **Client Environment** (`client/.env.local`):
   ```ini
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

---

### Step 3: Seed Default Accounts & College Knowledge Base

Run the automated seeder scripts to create default administrator/student accounts and ingest sample college documents:

```bash
# 1. Seed Default Admin & Student Accounts
npm run seed:admin

# 2. Ingest Sample College Documents (Admissions, Hostel, Exams, Placements, Scholarships, Clubs)
npm run seed:docs
```

---

### Step 4: Start the Application

Start both the backend server and frontend client concurrently with a single command:

```bash
npm run dev
```

- 🌐 **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- 🔌 **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- 💓 **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campusmind.edu` | `Student@123456` | Chat Assistant, History, Citations, Export |
| **Admin** | `admin@campusmind.edu` | `Admin@123456` | Full Admin Dashboard, Document Uploads, Analytics, Gap Logs |

> 💡 *On the `/login` page, you can click the **"Demo Student"** or **"Demo Admin"** buttons for 1-click credential filling!*

---

## 🧪 Automated RAG Verification Suite

To verify the semantic vector search and RAG retrieval pipeline against known ground-truth queries, run:

```bash
npm run test:rag
```

**Verification Test Cases Executed:**
1. ✅ `"What is the hostel curfew time?"` ➔ Cites *Residence Hall & Mess Guidelines Handbook* (Hostel, Page 1).
2. ✅ `"What is the eligibility for B.Tech CS?"` ➔ Cites *Admissions & Fee Guide 2026-2027* (Admissions, Page 1).
3. ✅ `"What is the fee refund policy?"` ➔ Cites *Admissions & Fee Guide 2026-2027* (Admissions, Page 1).
4. ✅ `"What is the secret recipe for interstellar dark matter fuel?"` ➔ Correctly rejected (`answerable: false`, score < 0.72) with honest fallback.

---

## 📂 Project Structure

```
RAG-Based_clg_chatbot/
├── package.json                   # Root orchestrator script
├── README.md                      # Comprehensive local setup and guide
├── specs.md                       # Specification document (Single Source of Truth)
│
├── server/                        # Express Backend & RAG Engine
│   ├── sample_docs/               # Sample college brochures, policies, and rules
│   │   ├── admissions_guide_2026.txt
│   │   ├── hostel_and_mess_handbook.txt
│   │   ├── examination_and_academic_policies.txt
│   │   ├── placements_and_internships_2026.txt
│   │   ├── scholarships_and_financial_aid.txt
│   │   └── student_clubs_and_events.txt
│   ├── src/
│   │   ├── config/                # env.js, db.js (with in-memory fallback), socket.js
│   │   ├── controllers/           # authController, chatController, documentController, analyticsController
│   │   ├── middlewares/           # auth.js, requireAdmin.js, validate.js, errorHandler.js, rateLimiter.js
│   │   ├── models/                # User, Document, DocumentChunk, Conversation, Message, Feedback, AnalyticsEvent
│   │   ├── queues/                # ingestionQueue.js (BullMQ + sync fallback)
│   │   ├── routes/                # authRoutes, chatRoutes, documentRoutes, analyticsRoutes
│   │   ├── scripts/               # seedAdmin.js, seedSampleDocs.js, testRAG.js
│   │   ├── services/              # authService, documentService, embeddingService, retrievalService, chatService, feedbackService, analyticsService
│   │   ├── utils/                 # chunker.js, documentExtractor.js, vectorMath.js
│   │   └── server.js              # Server entry point
│   ├── .env.example
│   └── package.json
│
└── client/                        # Next.js Pages Router Frontend
    ├── src/
    │   ├── components/
    │   │   ├── ChatWindow/        # Chat window with category filter chips and suggestions
    │   │   ├── DocumentTable/     # Admin table with live Socket.IO ingestion indicators
    │   │   ├── DocumentUploadForm/# Drag-and-drop document uploader with category picker
    │   │   ├── MessageBubble/     # Markdown renderer, streaming cursor, citations & feedback
    │   │   ├── Navbar/            # Responsive glassmorphic navigation with role badges
    │   │   ├── ProtectedRoute/    # Student vs. Admin route access guard
    │   │   └── SourceCitation/    # Verified source reference cards with modal preview
    │   ├── pages/
    │   │   ├── _app.js            # App layout and auth bootstrap
    │   │   ├── index.js           # Interactive landing page and RAG pipeline visualizer
    │   │   ├── login.js           # Sign in page with 1-click demo accounts
    │   │   ├── register.js        # Student registration
    │   │   ├── settings.js        # Profile management and JSON/MD chat export
    │   │   ├── admin/
    │   │   │   ├── index.js       # Admin overview metrics dashboard
    │   │   │   ├── documents.js   # Knowledge base document management
    │   │   │   └── analytics.js   # Gap analysis & unanswered questions log
    │   │   └── chat/
    │   │       ├── index.js       # Main conversational assistant
    │   │       └── [conversationId].js # Past conversation viewer
    │   ├── services/              # api.js (Axios), socket.js (Socket.IO client)
    │   ├── store/                 # authStore.js, chatStore.js (Zustand)
    │   └── styles/                # globals.css (Tailwind & custom design tokens)
    ├── .env.local.example
    ├── tailwind.config.js
    └── package.json
```

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new student account | No |
| `POST` | `/api/auth/login` | Login and receive JWT access token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `PUT` | `/api/auth/password` | Update account password | Yes |
| `POST` | `/api/auth/logout` | Logout and clear cookie | No |

### 💬 Chat & RAG (`/api/chat`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/message` | Submit inquiry, execute RAG pipeline, stream answer | Yes |
| `GET` | `/api/chat/conversations` | List user conversation history | Yes |
| `GET` | `/api/chat/conversations/:id` | Fetch full message transcript | Yes |
| `DELETE` | `/api/chat/conversations/:id` | Delete conversation and messages | Yes |
| `POST` | `/api/chat/messages/:id/feedback` | Submit 👍 / 👎 rating on an answer | Yes |

### 📄 Admin Document Management (`/api/admin/documents`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/documents` | List all documents with filters | Admin Only |
| `POST` | `/api/admin/documents` | Upload PDF/DOCX/TXT files (multipart/form-data) | Admin Only |
| `POST` | `/api/admin/documents/:id/reprocess` | Re-run extraction, chunking, and embedding | Admin Only |
| `DELETE` | `/api/admin/documents/:id` | Delete document and vector chunks | Admin Only |
| `GET` | `/api/admin/documents/:id/status` | Poll ingestion progress | Admin Only |

### 📊 Admin Analytics & Gaps (`/api/admin/analytics`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/analytics/overview` | Summary stats, citations, category distribution | Admin Only |
| `GET` | `/api/admin/analytics/unanswered` | Knowledge base gap logs (score < 0.72) | Admin Only |

---

## 💡 MongoDB Atlas Vector Search Index Setup (Optional for Production)

If deploying with MongoDB Atlas, create a Vector Search index on the `documentchunks` collection using the following JSON definition in the Atlas Search tab:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    }
  ]
}
```

*Name the index `vector_index`. The backend will automatically utilize `$vectorSearch` with zero code modifications.*

---

## 📄 License

This project is licensed under the ISC License. Built with ❤️ for universities and students.
