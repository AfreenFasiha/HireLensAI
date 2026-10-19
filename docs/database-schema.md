# HireLens AI — Database Schema & Entity Relationship Diagram

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "has"
    ORGANIZATIONS ||--o{ JOBS : "publishes"
    ORGANIZATIONS ||--o{ CANDIDATES : "tracks"
    ORGANIZATIONS ||--o{ APPLICATIONS : "scopes"
    ORGANIZATIONS ||--o{ AUDIT_LOGS : "logs"

    USERS ||--o{ REFRESH_SESSIONS : "holds"
    USERS ||--o{ JOBS : "creates"
    USERS ||--o{ INTERVIEWS : "conducts"
    USERS ||--o{ INTERVIEW_FEEDBACK : "submits"
    USERS ||--o{ RECRUITER_NOTES : "authors"
    USERS ||--o{ APPLICATION_STAGE_HISTORY : "advances"

    JOBS ||--o{ APPLICATIONS : "receives"
    
    CANDIDATES ||--o{ RESUMES : "owns"
    CANDIDATES ||--o{ CANDIDATE_SKILLS : "possesses"
    CANDIDATES ||--o{ APPLICATIONS : "submits"
    CANDIDATES ||--o{ RECRUITER_NOTES : "annotated_with"

    APPLICATIONS ||--|| MATCH_SCORES : "evaluated_by"
    APPLICATIONS ||--o{ APPLICATION_STAGE_HISTORY : "progresses_through"
    APPLICATIONS ||--o{ INTERVIEWS : "scheduled_for"

    INTERVIEWS ||--o{ INTERVIEW_FEEDBACK : "evaluated_via"

    ORGANIZATIONS {
        uuid id PK
        string name
        string slug UK
        string domain
        datetime created_at
        datetime updated_at
    }

    USERS {
        uuid id PK
        uuid organization_id FK
        string email UK
        string hashed_password
        string full_name
        enum role "ADMIN, RECRUITER, HIRING_MANAGER"
        bool is_active
        string avatar_url
        datetime created_at
        datetime updated_at
    }

    REFRESH_SESSIONS {
        uuid id PK
        uuid user_id FK
        string refresh_token_hash UK
        datetime expires_at
        bool is_revoked
        datetime created_at
    }

    JOBS {
        uuid id PK
        uuid organization_id FK
        uuid created_by_id FK
        string title
        string department
        text description
        json required_skills
        json preferred_skills
        float min_experience_years
        string location
        enum employment_type
        enum status
        json matching_weights
        datetime created_at
        datetime updated_at
    }

    CANDIDATES {
        uuid id PK
        uuid organization_id FK
        string full_name
        string email
        string phone
        string location
        string current_title
        float experience_years
        string education_level
        string linkedin_url
        string github_url
        text summary
        text raw_text
        bool is_verified_by_recruiter
        datetime created_at
        datetime updated_at
    }

    RESUMES {
        uuid id PK
        uuid candidate_id FK
        string file_name
        string file_path
        integer file_size
        string mime_type
        json parsed_data
        enum extraction_status
        datetime created_at
    }

    CANDIDATE_SKILLS {
        uuid id PK
        uuid candidate_id FK
        string skill_name
        string category
        float years_of_experience
        bool is_verified
    }

    APPLICATIONS {
        uuid id PK
        uuid organization_id FK
        uuid job_id FK
        uuid candidate_id FK
        enum stage
        datetime applied_at
        datetime updated_at
    }

    APPLICATION_STAGE_HISTORY {
        uuid id PK
        uuid application_id FK
        uuid changed_by_id FK
        string from_stage
        string to_stage
        text reason
        datetime created_at
    }

    MATCH_SCORES {
        uuid id PK
        uuid application_id FK,UK
        float overall_score
        float required_skills_score
        float preferred_skills_score
        float semantic_similarity_score
        float experience_alignment_score
        json matched_required_skills
        json missing_required_skills
        json matched_preferred_skills
        text score_explanation
        json weights_used
        datetime calculated_at
    }

    INTERVIEWS {
        uuid id PK
        uuid application_id FK
        uuid interviewer_id FK
        string title
        enum interview_type
        datetime scheduled_start
        datetime scheduled_end
        string timezone
        string meeting_link
        string location
        enum status
        text cancellation_reason
        datetime created_at
        datetime updated_at
    }

    INTERVIEW_FEEDBACK {
        uuid id PK
        uuid interview_id FK
        uuid reviewer_id FK
        integer rating
        enum recommendation
        text technical_skills_feedback
        text communication_feedback
        text general_notes
        datetime created_at
    }

    RECRUITER_NOTES {
        uuid id PK
        uuid candidate_id FK
        uuid author_id FK
        text content
        bool is_private
        datetime created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string action
        string resource_type
        string resource_id
        json details
        string ip_address
        datetime created_at
    }
```

---

## 2. Table Specifications & Indexes

| Table | Primary Key | Foreign Keys | Key Indexes & Constraints |
| :--- | :--- | :--- | :--- |
| `organizations` | `id (UUID)` | None | `slug (UNIQUE)` |
| `users` | `id (UUID)` | `organization_id -> organizations.id` | `email (UNIQUE)`, `role` |
| `refresh_sessions` | `id (UUID)` | `user_id -> users.id` | `refresh_token_hash (UNIQUE, INDEX)` |
| `jobs` | `id (UUID)` | `organization_id`, `created_by_id` | `status`, `department`, `created_at` |
| `candidates` | `id (UUID)` | `organization_id` | `email (INDEX)`, `full_name (INDEX)` |
| `resumes` | `id (UUID)` | `candidate_id -> candidates.id` | `candidate_id`, `extraction_status` |
| `candidate_skills` | `id (UUID)` | `candidate_id -> candidates.id` | `skill_name (INDEX)`, `candidate_id` |
| `applications` | `id (UUID)` | `organization_id`, `job_id`, `candidate_id` | `UNIQUE(job_id, candidate_id)`, `stage` |
| `application_stage_history` | `id (UUID)` | `application_id`, `changed_by_id` | `application_id`, `created_at` |
| `match_scores` | `id (UUID)` | `application_id -> applications.id` | `application_id (UNIQUE)`, `overall_score` |
| `interviews` | `id (UUID)` | `application_id`, `interviewer_id` | `interviewer_id`, `scheduled_start`, `status` |
| `interview_feedback` | `id (UUID)` | `interview_id`, `reviewer_id` | `interview_id` |
| `recruiter_notes` | `id (UUID)` | `candidate_id`, `author_id` | `candidate_id` |
| `audit_logs` | `id (UUID)` | `organization_id`, `user_id` | `organization_id`, `action`, `created_at` |
