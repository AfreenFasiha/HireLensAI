# HireLens AI — REST API Documentation (v1)

Base URL: `http://localhost:8000/api/v1`  
Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`  
ReDoc Reference: `http://localhost:8000/redoc`

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates an organization workspace and initial administrator account.
- **Request Body**:
  ```json
  {
    "organization_name": "TechNova Solutions",
    "full_name": "Alex Vance",
    "email": "alex@technova.io",
    "password": "Password123!",
    "role": "ADMIN"
  }
  ```
- **Response `201 Created`**: Returns access token, rotating refresh token, and user profile.

### `POST /auth/login`
Authenticates credentials and returns JWT session tokens.
- **Request Body**:
  ```json
  {
    "email": "admin@technova.io",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "1eBJmo3z8...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "f08e5e7a...",
      "email": "admin@technova.io",
      "full_name": "Alex Vance",
      "role": "ADMIN"
    }
  }
  ```

### `POST /auth/refresh`
Refreshes expired access tokens using a rotating refresh token (body or cookie).

### `POST /auth/logout`
Revokes active refresh session and clears HTTP-only cookies.

### `GET /auth/me`
Retrieves currently authenticated user profile and organization info.

---

## 2. Job Requisition Endpoints

### `GET /jobs`
Lists organization jobs with multi-criteria filtering and application counts.
- **Query Parameters**: `status`, `department`, `search`, `page`, `page_size`.

### `POST /jobs` *(Roles: ADMIN, RECRUITER)*
Creates a new job opening with requirements and custom AI weights.
- **Request Body**:
  ```json
  {
    "title": "Senior Full-Stack Engineer",
    "department": "Engineering",
    "description": "Architect backend microservices and modern React applications.",
    "required_skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL"],
    "preferred_skills": ["Docker", "AWS", "Redis"],
    "min_experience_years": 5.0,
    "location": "San Francisco, CA (Hybrid)",
    "employment_type": "FULL_TIME",
    "status": "ACTIVE",
    "matching_weights": {
      "required_skills": 0.40,
      "semantic_similarity": 0.30,
      "preferred_skills": 0.15,
      "experience_alignment": 0.15
    }
  }
  ```

### `GET /jobs/{id}`
Retrieves job requisitions with requirement criteria and total candidates count.

### `PATCH /jobs/{id}` *(Roles: ADMIN, RECRUITER)*
Updates job fields or archived status.

### `DELETE /jobs/{id}` *(Roles: ADMIN, RECRUITER)*
Deletes or archives a job opening.

---

## 3. Candidate Management Endpoints

### `GET /candidates`
Lists candidates with keyword search and skill taxonomy filtering.
- **Query Parameters**: `search`, `skill`, `page`, `page_size`.

### `POST /candidates` *(Roles: ADMIN, RECRUITER)*
Creates a candidate profile manually.

### `GET /candidates/{id}`
Retrieves complete candidate profile, skills, and recruiter notes.

### `PATCH /candidates/{id}` *(Roles: ADMIN, RECRUITER)*
Updates candidate contact details, skills, or verified status.

### `POST /candidates/{id}/resume` *(Roles: ADMIN, RECRUITER)*
Uploads PDF or DOCX resume, executes NLP text extraction and skill normalization, and saves resume record.
- **Content-Type**: `multipart/form-data`
- **Field**: `file`

### `GET /candidates/{id}/resume/{resume_id}/download`
Secure authorized download of candidate's stored resume document.

### `POST /candidates/{id}/notes`
Adds internal recruiter/interviewer evaluation notes.

---

## 4. Applications & Pipeline Endpoints

### `GET /applications`
Lists applications with optional filtering by `job_id`, `candidate_id`, or `stage`.

### `POST /applications` *(Roles: ADMIN, RECRUITER)*
Applies candidate to a job and automatically computes explainable AI match score.

### `PATCH /applications/{id}/stage` *(Roles: ADMIN, RECRUITER, HIRING_MANAGER)*
Transitions candidate stage in the hiring pipeline and records immutable history entry.
- **Request Body**:
  ```json
  {
    "stage": "SHORTLISTED",
    "reason": "Exemplary skills match in Python and React"
  }
  ```

---

## 5. AI Resume Parsing & Candidate Matching

### `POST /ai/parse-resume`
Extracts and normalizes text, contact details, and skills on the fly from an uploaded PDF/DOCX file without creating database records.

### `POST /ai/match-candidate`
Calculates or recalculates explainable match scores with custom weights.

### `GET /ai/job-rankings/{job_id}`
Returns candidates for a given job ordered descending by match score (0-100%) with required skills coverage, semantic similarity, preferred skills bonus, experience alignment, and human-in-the-loop decision support notice.

---

## 6. Interview Scheduling & Feedback

### `GET /interviews`
Lists upcoming or historical interviews.

### `POST /interviews` *(Roles: ADMIN, RECRUITER)*
Schedules an interview with start/end timestamps, timezone, meeting link, and conflict prevention.

### `PATCH /interviews/{id}`
Reschedules, updates location, or cancels interview.

### `POST /interviews/{id}/feedback` *(Roles: ADMIN, RECRUITER, HIRING_MANAGER)*
Submits structured reviewer feedback (rating 1-5, recommendation, technical comments, communication notes).

---

## 7. Analytics & Export

### `GET /analytics/dashboard`
Calculates dashboard metrics, timeline trends, stage distribution, and score histograms from real database records.

### `GET /analytics/export-csv`
Exports full candidate application and match score dataset in CSV format.

---

## 8. Administration Endpoints

### `GET /admin/users` *(Role: ADMIN)*
Lists organization team members and assigned roles.

### `PATCH /admin/users/{id}/role` *(Role: ADMIN)*
Updates user permission role (`ADMIN`, `RECRUITER`, `HIRING_MANAGER`).

### `PATCH /admin/users/{id}/status` *(Role: ADMIN)*
Activates or deactivates team member accounts.

### `GET /admin/audit-logs` *(Role: ADMIN)*
Retrieves immutable historical audit trail entries.
