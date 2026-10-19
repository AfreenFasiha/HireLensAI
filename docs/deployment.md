# HireLens AI — Production Deployment Guide

This guide describes how to deploy HireLens AI to cloud environments using free and open-source compatible tiers (Vercel for Frontend, Render/Railway for Backend, Managed PostgreSQL for Database).

---

## 1. Managed PostgreSQL Setup

### Recommended Providers
- **Neon / Supabase / Render Postgres / AWS RDS**

1. Create a PostgreSQL instance (v15 or v16).
2. Retrieve the connection string:
   ```
   postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE_NAME>?sslmode=require
   ```

---

## 2. Backend Deployment (Render / Railway / Container)

### A. Render Configuration
1. Create a **New Web Service** connected to your repository.
2. Set Root Directory to `backend`.
3. Set Environment to **Python 3**.
4. Configure Build and Start commands:
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && alembic upgrade head && python -m app.database.seed_data
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port 10000
     ```

### B. Environment Variables
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production PostgreSQL connection string | `postgresql://user:pass@ep-cool-db.neon.tech/hirelens_ai?sslmode=require` |
| `JWT_SECRET_KEY` | Cryptographically secure secret key | `openssl rand -hex 32` |
| `ENVIRONMENT` | Runtime environment mode | `production` |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `https://hirelens-ai.vercel.app` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan in minutes | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifespan in days | `7` |

### C. Persistent Storage Recommendation
By default, uploaded candidate resumes are stored in the local file path defined by `UPLOAD_DIR`. For multi-instance production deployments:
- Mount a persistent cloud volume (e.g. Render Persistent Disk at `/app/uploads`).
- Or configure private object storage (AWS S3, Cloudflare R2, Google Cloud Storage) with signed download URLs.

---

## 3. Frontend Deployment (Vercel)

1. Import your GitHub repository into **Vercel**.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Configure Build and Output settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install --legacy-peer-deps`
5. Configure Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api/v1`
6. Deploy!

### SPA Routing in Vercel (`vercel.json`)
Create `frontend/vercel.json` if needed:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 4. Health Checks & Verification

After deployment, verify the production endpoints:
1. **Backend Health Check**:
   ```bash
   curl -s https://your-backend-service.onrender.com/health
   # Returns: {"status":"healthy","database":"connected","environment":"production"}
   ```
2. **Interactive OpenAPI Documentation**:
   `https://your-backend-service.onrender.com/docs`
3. **Frontend Application**:
   Navigate to `https://hirelens-ai.vercel.app` and sign in.
