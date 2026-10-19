# HireLens AI — System Architecture & Design Documentation

## 1. Architectural Overview

HireLens AI is designed as a modular, decoupled full-stack Applicant Tracking System (ATS) optimized for explainability, data security, high maintainability, and enterprise multi-tenancy.

The platform follows a layered clean architecture pattern:

```
+-------------------------------------------------------------------------+
|                              CLIENT LAYER                               |
|        React 19 + TypeScript + Vite + Tailwind CSS + Recharts           |
+-------------------------------------------------------------------------+
                                     |
                                     | HTTPS / JSON / JWT
                                     v
+-------------------------------------------------------------------------+
|                               API GATEWAY                               |
|          FastAPI v0.128 + Uvicorn + CORS Middleware + Audit Log         |
+-------------------------------------------------------------------------+
       |                             |                           |
       v                             v                           v
+---------------+            +---------------+           +---------------+
| CORE SERVICES |            | AI / NLP CORE |           | SECURITY CORE |
| Jobs          |            | PyMuPDF / docx|           | Argon2 Hasher |
| Candidates    |            | Skill Taxonomy|           | JWT Bearer    |
| Pipeline      |            | TF-IDF Sim.   |           | RBAC Enforcer |
| Interviews    |            | Match Scorer  |           | Refresh Sess. |
| Analytics     |            | Rule Engine   |           | Org Scoping   |
+---------------+            +---------------+           +---------------+
       \                             |                          /
        \                            |                         /
         v                           v                        v
+-------------------------------------------------------------------------+
|                            PERSISTENCE LAYER                            |
|             SQLAlchemy 2.0 ORM + Alembic Migration Manager              |
|        PostgreSQL (Production) / SQLite WAL Mode (Local Fast Dev)       |
+-------------------------------------------------------------------------+
```

---

## 2. Layer Responsibilities

### 2.1 Frontend Presentation Layer
- **Framework**: React 19 with Vite bundler and TypeScript.
- **Styling**: Tailwind CSS configured with CSS variables supporting instantaneous dark and light theme switching.
- **State & Data Fetching**: TanStack React Query for efficient query caching, deduplication, and optimistic updates.
- **Routing**: React Router DOM with protected route wrappers enforcing role-based permissions (`ADMIN`, `RECRUITER`, `HIRING_MANAGER`).
- **Data Visualization**: Recharts for responsive hiring pipeline distribution, time-to-hire trends, and score histograms.

### 2.2 API & Backend Application Layer
- **Framework**: FastAPI (Python 3.11+ / 3.9+ compatible).
- **Architecture**: Versioned REST API under `/api/v1` organized by business domains (`auth`, `jobs`, `candidates`, `applications`, `ai`, `interviews`, `analytics`, `admin`).
- **Data Validation**: Strict Pydantic v2 schemas validating request payloads and enforcing response formats.
- **Dependency Injection**: Declarative database session lifecycles and role verification dependencies.

### 2.3 AI & NLP Matching Subsystem
- **Document Text Ingestion**: PyMuPDF (`fitz`) handles multi-page PDF documents; `python-docx` handles DOCX paragraphs and tables.
- **Extraction & Normalization**: Regex-driven contact extractors (email, phone, LinkedIn/GitHub links) combined with an extensive technical taxonomy supporting alias mapping (e.g. `k8s` -> `Kubernetes`, `postgres` -> `PostgreSQL`).
- **Candidate-to-Job Matching**:
  - **Required Skills Coverage (40%)**: Ratio of matched mandatory skills to total mandatory skills.
  - **Semantic Similarity (30%)**: Scikit-Learn TF-IDF vectorization and cosine similarity evaluating textual overlap.
  - **Preferred Skills Coverage (15%)**: Bonus points for preferred technical tools.
  - **Experience Alignment (15%)**: Smooth logarithmic curve comparing candidate years of experience against role requirements.
- **Human-in-the-Loop Review**: Extracted resume fields can be reviewed and edited by recruiters before being committed as authoritative records.

### 2.4 Persistence & Multi-Tenancy Layer
- **ORM**: SQLAlchemy 2.0 with strict foreign key constraints, cascading deletion, and table indexes.
- **Database**: PostgreSQL (Dockerized or Managed AWS RDS/Supabase/Neon), with dual zero-config SQLite fallback for local testing.
- **Multi-Tenant Isolation**: Every database query is scoped to `organization_id` derived directly from the authenticated user's JWT payload.

---

## 3. Security & Governance

1. **Password Hashing**: State-of-the-art Argon2 hashing algorithm with memory cost (`65536`), time cost (`2`), and parallelism (`1`).
2. **Token Security**: Short-lived JWT access tokens (60 minutes) paired with rotating refresh tokens stored hashed in `refresh_sessions`.
3. **Role-Based Access Control**:
   - `ADMIN`: User management, audit logs, and organization settings.
   - `RECRUITER`: Job requisitions, candidate management, resume parsing, and interview scheduling.
   - `HIRING_MANAGER`: Candidate scorecard evaluations and interview feedback.
4. **Ethical AI Guardrails**:
   - Demographic characteristics (gender, age, ethnicity, nationality, religion, disability) are strictly excluded from ranking signals.
   - Transparent natural language explanations accompany all numerical scores.
   - System prompts and notices explicitly declare that scores are advisory decision support and cannot make automated hiring or rejection determinations.
