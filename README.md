# ResumeX AI – Smart Resume Builder & ATS Analyzer

A full-stack web application where students create professional resumes, improve them with AI and analyze ATS (Applicant Tracking System) compatibility against a job description.

| Module | Functionality |
| --- | --- |
| Authentication | Register, login, logout (JWT + bcrypt) |
| Dashboard | Saved resumes, ATS statistics, profile |
| Resume Builder | Personal details, education, skills, experience, projects, certifications, live preview |
| Templates | Modern, Classic and Minimal designs |
| AI Analyzer | Summary generation, bullet-point improvement, grammar suggestions, strengths/weaknesses |
| ATS Checker | Rule-based scoring + job-description keyword matching |
| PDF Export | One-click A4 PDF download |
| Admin | Platform stats, user search, promote/demote, enable/disable, delete |

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, lucide-react, html2pdf.js
- **Backend:** Node.js, Express, Mongoose, JWT, bcryptjs, helmet, express-rate-limit
- **Database:** MongoDB Atlas (or local MongoDB)
- **AI:** OpenAI or Google Gemini (optional) – a built-in rule-based engine is used when no key is set
- **Deployment:** Vercel (frontend) + Render (backend)

## Project structure

```
resumex-ai/
├── frontend/              # Next.js app
│   ├── app/               # login, register, dashboard, builder, analyzer, admin, landing
│   ├── components/        # Navbar, builder/, templates/, Analyzer, ScoreRing...
│   └── lib/               # api client, auth context, resume helpers, pdf export
├── backend/               # Express API
│   ├── config/            # MongoDB connection
│   ├── controllers/       # auth, resume, ai, admin
│   ├── middleware/        # JWT auth, admin guard, validation, errors
│   ├── models/            # User, Resume
│   ├── routes/            # /api/auth, /api/resumes, /api/ai, /api/admin
│   ├── services/          # atsEngine.js, aiService.js, textUtils.js
│   ├── tests/             # node:test unit tests for the ATS engine
│   └── server.js
└── render.yaml            # Render blueprint for the backend
```

## Run locally

Requirements: Node.js 18+ and a MongoDB connection string (Atlas or `docker run -d -p 27017:27017 mongo:7`).

```bash
# Backend
cd backend
cp .env.example .env       # set MONGODB_URI, JWT_SECRET, ADMIN_EMAILS, optional AI key
npm install
npm run dev                # http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000
```

Register with an email listed in `ADMIN_EMAILS` (default `admin@resumex.ai`) to get the admin role.

Run backend tests: `cd backend && npm test`.

## Environment variables

**backend/.env**

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CLIENT_URL` | Comma-separated allowed frontend origins for CORS |
| `ADMIN_EMAILS` | Comma-separated emails that become admin on registration |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Enables OpenAI (default model `gpt-4o-mini`) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Enables Gemini (default `gemini-1.5-flash`) |

**frontend/.env.local**

| Variable | Description |
| --- | --- |
| `BACKEND_URL` | Backend origin; Next.js proxies `/api/*` to it (build time) |
| `NEXT_PUBLIC_API_URL` | Optional: call the backend directly instead of via the proxy |

## How the ATS score works

The score (0–100) is calculated by `backend/services/atsEngine.js`, fully rule-based:

| Component | Points | What is checked |
| --- | --- | --- |
| Keyword match | 40 | Top keywords/phrases extracted from the job description (incl. terms like `node.js`, `ci/cd`, `machine learning`) found in the resume |
| Sections | 20 | Summary, experience, education, 5+ skills, projects |
| Content quality | 20 | Bullets starting with action verbs, quantified results, bullet length, weak phrases (“responsible for”) |
| Contact info | 10 | Name, valid email, phone, location, LinkedIn/GitHub/portfolio |
| Formatting | 10 | Word count, summary length, number of skills, emojis |

Without a job description the other 60 points are scaled to 100. Recommendations are generated from every failed check and sorted by priority. AI (OpenAI/Gemini) is used only for the written insights, summaries, rewrites and grammar.

## REST API

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/profile` | Update name/profile |
| GET | `/api/resumes` | List my resumes |
| GET | `/api/resumes/stats` | Dashboard statistics |
| POST | `/api/resumes` | Create resume |
| GET/PUT/DELETE | `/api/resumes/:id` | Read / update / delete resume |
| POST | `/api/resumes/:id/duplicate` | Duplicate resume |
| GET | `/api/ai/status` | Active AI provider |
| POST | `/api/ai/summary` | Generate professional summary |
| POST | `/api/ai/improve` | Rewrite a description into strong bullets |
| POST | `/api/ai/grammar` | Grammar & writing suggestions |
| POST | `/api/ai/ats` | ATS score only |
| POST | `/api/ai/analyze` | ATS score + AI insights |
| GET | `/api/admin/stats` | Platform statistics (admin) |
| GET | `/api/admin/users?q=` | List/search users (admin) |
| PATCH | `/api/admin/users/:id` | Change role / active status (admin) |
| DELETE | `/api/admin/users/:id` | Delete user and their resumes (admin) |

All routes except register/login require `Authorization: Bearer <token>`.

## Deployment

1. **MongoDB Atlas:** create a free cluster, a database user, allow network access (`0.0.0.0/0` for Render) and copy the connection string.
2. **Backend on Render:** New → Blueprint → select this repo (uses `render.yaml`), or create a Web Service with root `backend`, build `npm install`, start `npm start`. Set `MONGODB_URI`, `CLIENT_URL` (your Vercel URL), `ADMIN_EMAILS` and optionally an AI key.
3. **Frontend on Vercel:** import the repo, set **Root Directory** to `frontend`, and add `BACKEND_URL=https://<your-render-service>.onrender.com`. Deploy.
