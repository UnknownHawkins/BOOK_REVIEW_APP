# 📚 BookHub – Monorepo Digital Library & Reading Platform

BookHub is a modern, feature-rich **Digital Library & Social Reading Platform** structured as a high-performance **Turborepo Monorepo**. It features a Next.js frontend, an Express API backend, serverless PostgreSQL with Prisma, and DeepSeek AI-driven full-length E-book generation.

---

## 🏗️ Architecture & Tech Stack

This project is organized as a monorepo workspace:

* **`/apps/web` (Next.js Frontend)**
  * Next.js 15 (App Router, Server & Client Components)
  * User Authentication via **Clerk**
  * State Management via **Zustand** & **React Query (TanStack)**
  * UI/Styling via **Tailwind CSS**, **Framer Motion**, and **Lucide React**
* **`/apps/api` (Express Backend)**
  * Express.js server with TypeScript (`tsx` runner)
  * Database access via **Prisma ORM** connecting to **Neon PostgreSQL**
  * Caching & Rate Limiting via **Upstash Redis**
  * Logging via **Winston** & HTTP logger **Morgan**
  * Interactive API Docs at `/api/docs` via **Swagger UI**
* **`/packages/shared` (Shared Utilities)**
  * Shared Zod validation schemas (Register, Login, Books, Reviews) to ensure complete frontend/backend type-safety.

---

## ✨ Key Capabilities

* 📖 **Smart Book Search** – Query both your local library catalog and the **Google Books API** simultaneously.
* 💾 **Auto-Upsert Cataloging** – Clicking to read or review any Google Books search result automatically stores/upserts it in your Neon database, letting users immediately write reviews and ratings.
* 🤖 **DeepSeek AI E-Books** – Instantly generate a full-length digital book from any title. Generates 5 chapters of comprehensive, paragraph-by-paragraph complete reading text (at least 1500–2000 words per chapter).
* 📝 **Community Reviews & Vibes** – Share ratings (1-5 stars), text headlines, vibes (Positive, Neutral, Mixed, Critical), and award sticker badges (Masterpiece, Insightful, etc.) to customize books.

---

## 🚀 Local Development Guide

### 1. Prerequisites
* Node.js >= 18
* npm >= 9

### 2. Installation
Clone the repository and install all workspace dependencies from the root directory:
```bash
git clone https://github.com/UnknownHawkins/BOOK_REVIEW_APP.git
cd BOOK_REVIEW_APP
npm install
```

### 3. Environment Setup

#### Backend Environment (`/apps/api/.env`)
Create a `.env` file inside `apps/api/`:
```env
DATABASE_URL="postgresql://neondb_owner:...&pgbouncer=true"
DIRECT_URL="postgresql://neondb_owner:..."
PORT=5000
NODE_ENV=development
JWT_SECRET="your_jwt_secret"
DEEPSEEK_API_KEY="your_deepseek_key"
GEMINI_API_KEY="your_gemini_key"
GOOGLE_BOOKS_API_KEY="your_google_books_key"
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

#### Frontend Environment (`/apps/web/.env.local`)
Create a `.env.local` file inside `apps/web/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Clerk Auth
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/register
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 4. Running the Dev Servers
Run the full workspace in development mode:
```bash
npm run dev
```
* Frontend will run at [http://localhost:3000](http://localhost:3000)
* Backend API will run at [http://localhost:5000](http://localhost:5000)

---

## 🌐 Production Deployment

### Frontend (Vercel)
* **Root Directory:** `apps/web` (with outer file access enabled for monorepos).
* **Build Command:** `cd ../.. && npx turbo run build --filter=bookhub-web`
* **Output Directory:** Default (`.next`)
* **Environment Variables:** Provide `NEXT_PUBLIC_API_URL` pointing to your Render server (with `/api` suffix) and your Clerk credentials.

### Backend (Render)
* **Web Service:** Deploy the node application.
* **Root Directory:** `apps/api`
* **Build Command:** `npm install && npx prisma generate`
* **Start Command:** `npx tsx src/index.ts`
* **CORS Settings:** Set the `CLIENT_URL` environment variable on Render to your Vercel URL (e.g. `https://your-app.vercel.app`, no trailing slash) to permit API requests.
