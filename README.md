# CampusMind – RAG-Based College AI Assistant

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-black?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-black?logo=socket.io)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-blue?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📖 Project Description

**CampusMind** is an intelligent, full-stack college assistant web application built with **Retrieval-Augmented Generation (RAG)** and **Agentic RAG** workflows. Academic institutions manage critical policies, fee structures, syllabus regulations, hostel guidelines, and exam schedules across scattered PDFs, notices, and handbooks. Students often struggle to find immediate, accurate answers, while administrative offices face repetitive inquiries.

CampusMind solves this problem by providing students with an intuitive natural language chat interface that answers campus-related questions with high factual accuracy. Every response is generated strictly from verified institutional documents with interactive source citations, similarity match percentages, page references, and honest fallback guidance when information is unavailable.

Beyond document intelligence, CampusMind features an end-to-end **Student Grievance & Issue Resolution Portal** with real-time Socket.IO status synchronization, role-based dashboards (Student, Teacher/Faculty, Admin), document management, and multilingual accessibility (English, Hindi, Marathi).

---

## ⭐ Key Features

- **Grounded AI Answers**: Synthesizes responses strictly from official college documents to eliminate hallucinations.
- **Agentic RAG Querying**: Intelligent agent reasoning determines when college document retrieval tools are required.
- **Hybrid Search Engine**: Combines 768-dimensional dense vector embeddings with BM25 keyword matching for high precision.
- **Interactive Source Citations**: Shows document names, categories, page numbers, match percentages, and modal excerpt viewers.
- **Confidence Scoring & Unknown Detection**: Alerts users and routes unanswered inquiries when confidence falls below the similarity threshold.
- **Multilingual Support**: Real-time language switching between English, Hindi (हिंदी), and Marathi (मराठी).
- **Multi-Provider AI Fallback**: Resilient LLM generation chain supporting Groq, Google Gemini, OpenAI, OpenRouter, and an offline synthesizer.
- **Student Grievance Management**: Allows students to submit issues with file attachments and track progress step-by-step.
- **Real-Time Synchronization**: Live updates for grievance progress and remarks via Socket.IO.
- **Role-Based Access Control**: Tailored workflows and dashboards for Students, Teachers/Faculty, and Administrators.
- **Fully Responsive UI**: Optimized glassmorphic design for mobile (320px+), tablet, and desktop viewports.

---

## 🔄 How It Works

```
User Query (Chat UI)
       │
       ▼
Agent Intent Analysis
       │
       ├─▶ General Conversation ────────────▶ Direct Answer
       │
       ▼ (Needs College Knowledge)
Document Retrieval Tool (searchCollegeDocs)
       │
       ├─▶ Dense Vector Embeddings (Cosine Similarity)
       ├─▶ Sparse Keyword Search (BM25 Algorithm)
       ├─▶ Hybrid Score Fusion & Threshold Filtering (>= 0.72)
       │
       ▼
Context Injection & Augmented Prompt
       │
       ▼
LLM Generation (Groq / Gemini / OpenAI / Fallback)
       │
       ▼
Grounded Answer + Traceable Source Citations + Confidence Rating
```

---

## 🧠 RAG & Agentic RAG

### 1. Retrieval-Augmented Generation (RAG)
Standard LLMs lack knowledge of private college regulations and can hallucinate details. CampusMind implements RAG:
1. **Ingestion**: Admin uploads documents (`PDF`, `DOCX`, `TXT`). Text is extracted and split into semantic chunks (~800 characters with 150-character overlap).
2. **Embeddings**: Chunks are transformed into 768-dimensional numerical vectors and stored in MongoDB.
3. **Retrieval**: When a student asks a question, the query is embedded and compared against stored chunks.
4. **Augmentation & Generation**: The most relevant excerpts are passed as context to the AI model, prompting it to answer factually based only on the provided text.

### 2. Agentic RAG
Rather than blindly retrieving documents for every input, CampusMind uses an agentic tool-calling approach:
- The AI agent inspects user input and decides whether to invoke the `searchCollegeDocs` retrieval tool.
- For institutional inquiries, the agent calls the tool with targeted query parameters and category filters.
- If the retrieved context is sufficient, the agent synthesizes a grounded answer; if the question cannot be answered from college records, it gracefully notifies the student.

### 3. Embeddings, Semantic Similarity & BM25 Hybrid Retrieval
- **Dense Vector Search**: Measures semantic meaning via **Cosine Similarity**, understanding intent even if wording differs (*"mess leave rules"* matches *"hostel dining rebate policy"*).
- **BM25 Keyword Search**: Evaluates term frequencies and exact phrase matches for specific codes, course numbers, or formal terminology.
- **Hybrid Scoring**: Combines dense semantic similarity and sparse BM25 scores to achieve robust retrieval across conceptual and keyword-specific questions.

---

## 📦 Main Modules

| Module | Description |
| :--- | :--- |
| **AI Chat Assistant** | Interactive chat interface with multi-turn context, category filters, and export options (Markdown/JSON). |
| **Authentication & RBAC** | Secure JWT authentication, bcrypt password hashing, and role guards for Students, Teachers, and Admins. |
| **Student Dashboard** | Central hub for tracking submitted grievances, viewing recent activity, and accessing the assistant. |
| **Teacher / Admin Portal** | Administrative dashboard to review grievances, assign departments, add progress notes, and view analytics. |
| **Grievance Management** | 6-stage lifecycle tracking (`Submitted` ➔ `Under Review` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved` ➔ `Closed`) with file uploads and comments. |
| **Document Management** | Administrative tool to upload, re-chunk, re-embed, and delete college knowledge base files. |
| **Feedback & Analytics** | Student response ratings (👍/👎), confidence badges, and gap analysis logs for unanswerable queries. |
| **Real-Time Updates** | Socket.IO event broadcasting for instant ticket status changes, discussion replies, and live feedback. |

---

## 💻 Technology Stack

- **Frontend**: Next.js 14 (Pages Router), React 18, Tailwind CSS, Zustand, Lucide React, React-Markdown, Remark-GFM
- **Backend**: Node.js, Express.js, Socket.IO, Multer, PDF-Parse, Mammoth
- **Database**: MongoDB & Mongoose (MongoDB Atlas / Local)
- **AI & RAG**: Google Gemini API, Groq SDK, OpenAI SDK, OpenRouter, Cosine Similarity, BM25 Keyword Matching
- **Real-Time Communication**: Socket.IO (WebSockets with polling fallback)
- **Deployment**: Vercel (Frontend), Render (Backend), MongoDB Atlas (Database)
- **Version Control**: Git & GitHub

---

## 📂 Project Structure

```
CampusMind-RAG-Chatbot/
├── client/                     # Next.js frontend application
│   ├── src/
│   │   ├── components/         # Navbar, ChatWindow, MessageBubble, SourceCitation, etc.
│   │   ├── pages/              # Landing, Chat, Dashboard, Grievances, Admin, FAQs, Auth
│   │   ├── services/           # Axios API client, Socket.IO client
│   │   ├── store/              # Zustand stores (auth, chat, grievance)
│   │   └── styles/             # Tailwind CSS & global styling tokens
│   ├── package.json
│   └── tailwind.config.js
├── server/                     # Express.js backend & RAG engine
│   ├── sample_docs/            # Sample college regulations, policies & rules
│   ├── src/
│   │   ├── config/             # Environment, Database, Socket.IO configuration
│   │   ├── controllers/        # Auth, Chat, Document, Complaint, Analytics controllers
│   │   ├── middlewares/        # JWT auth, error handling, rate limiting
│   │   ├── models/             # User, Document, DocumentChunk, Complaint
│   │   ├── routes/             # REST API endpoint routes
│   │   ├── scripts/            # Database seed and test scripts
│   │   ├── services/           # agentService, retrievalService, embeddingService, etc.
│   │   ├── utils/              # Chunker, document text extractors, vector math
│   │   └── server.js           # Server entry point
│   └── package.json
├── deploy.md                   # Deployment configuration guide
├── specs.md                    # Project functional specifications
└── README.md                   # Project documentation
```

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.x or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/sonuprasad100e-eng/CampusMind-RAG-Chatbot.git
cd CampusMind-RAG-Chatbot

# Install root, backend, and frontend dependencies
npm run install:all
```

### 2. Configure Environment Variables
Create `.env` inside `server/` and `.env.local` inside `client/` (refer to the [Environment Variables](#-environment-variables) section below).

### 3. Seed Sample Data & Documents (Optional)
```bash
# Seed default admin user
npm run seed:admin

# Ingest sample college documents into MongoDB vector store
npm run seed:docs
```

### 4. Run Development Servers
```bash
# Start both server and client concurrently
npm run dev
```

- **Frontend Client**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api`

---

## 🔐 Environment Variables

### Backend (`server/.env`)
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Database
MONGODB_URI=your_mongodb_connection_string

# AI Providers (Optional - local synthesizer runs if empty)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# RAG Configuration
RAG_SIMILARITY_THRESHOLD=0.72
RAG_TOP_K=5
```

### Frontend (`client/.env.local`)
```ini
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🌐 Deployment

| Service | Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Application** | Vercel | [https://campus-mind-rag-chatbot-weld.vercel.app](https://campus-mind-rag-chatbot-weld.vercel.app) |
| **Backend REST API** | Render | [https://campusmind-backend-g4np.onrender.com](https://campusmind-backend-g4np.onrender.com) |
| **Database** | MongoDB Atlas | Cloud-hosted Cluster |
| **Source Code Repository** | GitHub | [https://github.com/sonuprasad100e-eng/CampusMind-RAG-Chatbot.git](https://github.com/sonuprasad100e-eng/CampusMind-RAG-Chatbot.git) |

---

## 🔒 Security & Best Practices

- **Environment Secrets**: All sensitive tokens, API keys, and database URIs are loaded via environment variables and never committed to version control.
- **Password Security**: Passwords are encrypted and salted using **bcrypt** (cost factor 12) before persistence.
- **Stateless Authorization**: Protected endpoints require valid JWT bearer tokens verified by role-based middleware.
- **Input Validation & Sanitization**: Uploaded files undergo MIME-type validation and file size restrictions (10MB limit).

---

## 🎓 Learning Outcomes

Developing CampusMind provided comprehensive experience across modern full-stack and AI technologies:
- **Full-Stack Architecture**: Designing structured RESTful APIs and connecting them with reactive Next.js frontends.
- **RAG & Agentic Systems**: Implementing text extraction, recursive chunking, dense vector embeddings, and tool-calling agent workflows.
- **Hybrid Information Retrieval**: Combining semantic vector search with BM25 keyword matching for contextual precision.
- **Real-Time Communication**: Managing bidirectional WebSocket event lifecycles using Socket.IO.
- **Security & RBAC**: Implementing JWT session management, bcrypt password hashing, and role-based permissions.
- **Responsive UI Engineering**: Building adaptive, accessible interfaces supporting viewports from 320px mobile to wide desktop displays.
- **Cloud Deployment**: Configuring production deployments across Vercel, Render, and MongoDB Atlas.

---

## 🔮 Future Improvements

1. **Voice-to-Voice Streaming**: Adding low-latency bidirectional speech input and audio synthesis.
2. **OCR for Scanned Notices**: Ingesting scanned physical bulletin boards and handwritten official circulars via Optical Character Recognition.
3. **Automated Notification Triggers**: Email and SMS updates for grievance status transitions and administrative notices.
4. **Multi-Institution Tenancy**: Supporting segregated data partitions and custom knowledge bases across multiple university campuses.

---

## 📄 License

This project is licensed under the **ISC License**.
