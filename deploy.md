# 🚀 CampusMind — Step-by-Step Deployment Guide (`deploy.md`)

This guide walks you through deploying **CampusMind** to production using **MongoDB Atlas**, **Render (Backend)**, and **Vercel (Frontend)**.

---

## 📋 Overview of Deployment Architecture

```text
[ Vercel: Frontend (Next.js) ]  ──(HTTPS / WSS)──▶  [ Render: Backend (Express + Socket.IO) ]
                                                              │
                                                              ▼
                                                   [ MongoDB Atlas: Database ]
```

---

## 🟢 STEP 1: Push Code to GitHub

### 1.1 Open PowerShell in the project root:
```powershell
cd c:\Users\Admin\OneDrive\Desktop\RAG-Based_clg_chatbot
```

### 1.2 Initialize Git (if not already done) and Commit:
```powershell
git init
git branch -M main
git add .
git commit -m "feat: complete CampusMind production release"
```

### 1.3 Create a New Repository on GitHub:
1. Go to [GitHub](https://github.com/new).
2. Set repository name: `CampusMind` (public or private).
3. Do **NOT** initialize with README or `.gitignore` (we already have them).
4. Click **Create repository**.

### 1.4 Push to GitHub:
```powershell
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/CampusMind.git
git push -u origin main
```

---

## 🟢 STEP 2: Setup MongoDB Atlas (Cloud Database)

### 2.1 Create Atlas Cluster:
1. Log into [MongoDB Atlas](https://cloud.mongodb.com).
2. Click **Create** ➔ Choose the **FREE M0** tier ➔ Click **Create Deployment**.

### 2.2 Create Database User:
1. Go to **Security** ➔ **Database Access** ➔ **Add New Database User**.
2. Select **Password Authentication**.
3. Set Username: `campusmind_admin`
4. Set Password: `<Create-A-Strong-Password>` (Remember this password).
5. Role: **Read and write to any database**.

### 2.3 Configure Network Access (Allow Render Connection):
1. Go to **Security** ➔ **Network Access** ➔ **Add IP Address**.
2. Click **Allow Access from Anywhere** (`0.0.0.0/0`).
3. Click **Confirm**.

### 2.4 Get Your Connection String:
1. Go to **Deployment** ➔ **Database** ➔ Click **Connect**.
2. Select **Drivers** (Node.js).
3. Copy the connection URI:
   ```text
   mongodb+srv://campusmind_admin:<password>@cluster0.xxxxx.mongodb.net/campusmind?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual password).*

### 2.5 (Optional) Create Vector Search Index:
1. Go to **Browse Collections** ➔ Click `documentchunks` collection.
2. Click **Atlas Search** tab ➔ **Create Search Index**.
3. Choose **JSON Editor** under **Vector Search**.
4. Set Index Name: `vector_index`
5. Paste this configuration:
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
6. Click **Create Vector Search Index**.

---

## 🟢 STEP 3: Deploy Backend on Render

### 3.1 Create Web Service:
1. Log into [Render.com](https://render.com) with your GitHub account.
2. Click **New +** ➔ Select **Web Service**.
3. Connect your **CampusMind** GitHub repository.

### 3.2 Configure Service Settings:
- **Name**: `campusmind-server`
- **Region**: Closest to you (e.g., *Singapore*, *Frankfurt*, or *Oregon*)
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js`
- **Instance Type**: `Free`

### 3.3 Add Environment Variables on Render:
Under **Environment Variables**, add these:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `http://localhost:3000` *(You will update this to your Vercel URL in Step 5)* |
| `MONGODB_URI` | `mongodb+srv://campusmind_admin:<password>@cluster0.xxxxx.mongodb.net/campusmind?retryWrites=true&w=majority` |
| `JWT_SECRET` | `campusmind_super_secret_jwt_key_2026_production` *(Or any random 32+ char string)* |
| `JWT_EXPIRES_IN` | `7d` |
| `GEMINI_API_KEY` | *(Your Google Gemini API Key from Google AI Studio)* |
| `GROQ_API_KEY` | *(Your Groq API Key from Groq Cloud)* |
| `OPENAI_API_KEY` | *(Your OpenAI API Key, if available)* |
| `RAG_SIMILARITY_THRESHOLD` | `0.72` |
| `RAG_TOP_K` | `5` |

4. Click **Create Web Service**.
5. Wait for the deploy to show **Live**.
6. Copy your Render backend URL (e.g., `https://campusmind-server.onrender.com`).

---

## 🟢 STEP 4: Deploy Frontend on Vercel

### 4.1 Import Project to Vercel:
1. Log into [Vercel.com](https://vercel.com) with GitHub.
2. Click **Add New...** ➔ Select **Project**.
3. Import your **CampusMind** repository.

### 4.2 Configure Vercel Project:
- **Framework Preset**: `Next.js`
- **Root Directory**: Click **Edit** ➔ Select `client` ➔ Click **Continue**.
- **Build Command**: `next build` (Default)
- **Output Directory**: `.next` (Default)

### 4.3 Add Environment Variables on Vercel:
Add these two variables (replace with your actual Render URL):

| Name | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://campusmind-server.onrender.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://campusmind-server.onrender.com` |

4. Click **Deploy**.
5. Wait for the build to finish. Copy your live Vercel frontend URL (e.g., `https://campusmind.vercel.app`).

---

## 🟢 STEP 5: Link Frontend and Backend (Final Connection)

1. Return to [Render.com](https://render.com) ➔ Open your `campusmind-server` service.
2. Go to **Environment** tab.
3. Update `CLIENT_URL` to your actual Vercel domain:
   ```text
   CLIENT_URL = https://campusmind.vercel.app
   ```
   *(Note: No trailing slash at the end).*
4. Click **Save Changes** (Render will automatically redeploy).

---

## 🟢 STEP 6: Seed Default Data to Production

To seed the initial admin account and default college knowledge documents to your MongoDB Atlas database:

1. In your local `server/.env` file, temporarily set `MONGODB_URI` to your MongoDB Atlas connection string.
2. Open PowerShell and run:
   ```powershell
   cd server
   npm run seed:admin
   npm run seed:docs
   ```
3. Your cloud database is now populated with:
   - **Student Account**: `student@campusmind.edu` / `Student@123456`
   - **Admin Account**: `admin@campusmind.edu` / `Admin@123456`
   - **6 Official College Handbooks** (Admissions, Fees, Hostel, Exams, Placements, Scholarships, Clubs).

---

## 🟢 STEP 7: Test Your Live Deployment

Open your live Vercel URL in your browser and test:

1. **Sign In**: Login with `student@campusmind.edu` and `Student@123456` (or use the 1-Click Demo buttons).
2. **Remember Me**: Check "Remember me" and confirm persistent session after refresh.
3. **Chat Assistant**: Ask: *"What is the attendance requirement for exams?"* ➔ Verify streaming response and clickable citations.
4. **Multilingual Support**: Switch language to Hindi or Marathi and ask a question.
5. **Answer Feedback**: Rate a message with 👍 or 👎.
6. **Admin Portal**: Sign in as `admin@campusmind.edu` and check `/admin` and `/admin/documents`.

---

## 🎯 Production Checklist Summary

- [x] Clean repository committed to GitHub (no `.env` files).
- [x] MongoDB Atlas database active with `0.0.0.0/0` IP access.
- [x] Render backend deployed with all required environment variables.
- [x] Vercel frontend deployed with `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`.
- [x] Render `CLIENT_URL` linked to Vercel domain for CORS and Socket.IO.
- [x] Live application verified and working end-to-end.
