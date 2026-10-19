from datetime import datetime, timedelta
import pytest
from app.ai.matching_engine import evaluate_candidate_match, calculate_skills_overlap
from app.ai.resume_parser import parse_skills, parse_experience_years

def test_auth_workflow(client):
    """Tests registration, duplicate check, and login flow."""
    # Register new user
    reg_payload = {
        "organization_name": "Acme Innovations",
        "full_name": "Jane Doe",
        "email": "jane.doe@acme.io",
        "password": "SecurePassword123!"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "jane.doe@acme.io"
    assert data["user"]["role"] == "ADMIN"

    # Duplicate registration should fail
    dup_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # Successful login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "jane.doe@acme.io",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Invalid login password
    bad_res = client.post("/api/v1/auth/login", json={
        "email": "jane.doe@acme.io",
        "password": "WrongPassword!"
    })
    assert bad_res.status_code == 401

def test_job_crud_and_permissions(client, auth_headers):
    """Tests job creation, retrieval, updates, and list filtering."""
    job_payload = {
        "title": "Software Engineer II",
        "department": "Platform",
        "description": "Building distributed core services with Python, FastAPI, and PostgreSQL.",
        "required_skills": ["Python", "FastAPI", "PostgreSQL"],
        "preferred_skills": ["Docker", "Kubernetes"],
        "min_experience_years": 3.0,
        "location": "Remote",
        "employment_type": "FULL_TIME",
        "status": "ACTIVE"
    }

    # Create job
    create_res = client.post("/api/v1/jobs", json=job_payload, headers=auth_headers)
    assert create_res.status_code == 201
    job_id = create_res.json()["id"]

    # Get job
    get_res = client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Software Engineer II"

    # List jobs
    list_res = client.get("/api/v1/jobs?department=Platform", headers=auth_headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # Update job
    patch_res = client.patch(f"/api/v1/jobs/{job_id}", json={"min_experience_years": 4.0}, headers=auth_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["min_experience_years"] == 4.0

def test_candidate_creation_and_search(client, auth_headers):
    """Tests candidate creation, skills associations, and search filtering."""
    cand_payload = {
        "full_name": "Robert Chen",
        "email": "robert.chen@test.com",
        "phone": "+1-555-0199",
        "location": "Seattle, WA",
        "current_title": "Senior Python Developer",
        "experience_years": 5.0,
        "education_level": "Bachelor's Degree",
        "skills": ["Python", "PostgreSQL", "FastAPI", "Docker"]
    }
    res = client.post("/api/v1/candidates", json=cand_payload, headers=auth_headers)
    assert res.status_code == 201
    cand_id = res.json()["id"]

    # Search candidate by skill
    search_res = client.get("/api/v1/candidates?skill=FastAPI", headers=auth_headers)
    assert search_res.status_code == 200
    assert any(c["id"] == cand_id for c in search_res.json()["items"])

def test_ai_matching_engine_accuracy():
    """Unit test for multi-factor explainable matching engine."""
    candidate_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "Git"]
    job_required = ["Python", "FastAPI", "PostgreSQL", "AWS"]
    job_preferred = ["Docker", "Kubernetes"]

    eval_result = evaluate_candidate_match(
        candidate_skills=candidate_skills,
        candidate_experience=4.0,
        candidate_text="Experienced engineer working with Python, FastAPI, and Docker containers.",
        job_required_skills=job_required,
        job_preferred_skills=job_preferred,
        job_min_experience=3.0,
        job_description="We are building modern Python microservices with FastAPI and AWS cloud infrastructure."
    )

    assert 0.0 <= eval_result["overall_score"] <= 100.0
    assert "Python" in eval_result["matched_required_skills"]
    assert "FastAPI" in eval_result["matched_required_skills"]
    assert "AWS" in eval_result["missing_required_skills"]
    assert "Docker" in eval_result["matched_preferred_skills"]
    assert len(eval_result["score_explanation"]) > 20
    assert "Possesses 3 of 4 mandatory skills" in eval_result["score_explanation"]

def test_application_pipeline_and_interview_conflict(client, auth_headers):
    """Tests candidate pipeline progression and interview conflict validation."""
    # Create job
    job_res = client.post("/api/v1/jobs", json={
        "title": "Backend Lead",
        "department": "Engineering",
        "description": "Lead backend development with Python.",
        "required_skills": ["Python"],
        "location": "Remote"
    }, headers=auth_headers)
    job_id = job_res.json()["id"]

    # Create candidate
    cand_res = client.post("/api/v1/candidates", json={
        "full_name": "Samantha Wu",
        "email": "samantha.wu@test.com",
        "experience_years": 4.0,
        "skills": ["Python", "PostgreSQL"]
    }, headers=auth_headers)
    cand_id = cand_res.json()["id"]

    # Create application
    app_res = client.post("/api/v1/applications", json={
        "job_id": job_id,
        "candidate_id": cand_id
    }, headers=auth_headers)
    assert app_res.status_code == 201
    app_id = app_res.json()["id"]
    assert app_res.json()["stage"] == "APPLIED"

    # Transition stage to SCREENING then SHORTLISTED
    stage_res = client.patch(f"/api/v1/applications/{app_id}/stage", json={
        "stage": "SHORTLISTED",
        "reason": "Strong skill match"
    }, headers=auth_headers)
    assert stage_res.status_code == 200
    assert stage_res.json()["stage"] == "SHORTLISTED"

    # Schedule interview
    start_time = (datetime.utcnow() + timedelta(days=2)).isoformat()
    end_time = (datetime.utcnow() + timedelta(days=2, hours=1)).isoformat()
    iv_res = client.post("/api/v1/interviews", json={
        "application_id": app_id,
        "title": "Technical Interview",
        "interview_type": "ONLINE",
        "scheduled_start": start_time,
        "scheduled_end": end_time
    }, headers=auth_headers)
    assert iv_res.status_code == 201
    iv_id = iv_res.json()["id"]

    # Attempting to schedule another interview at the EXACT SAME TIME for the same interviewer should raise 409 Conflict
    conflict_res = client.post("/api/v1/interviews", json={
        "application_id": app_id,
        "title": "Conflicting Second Interview",
        "interview_type": "ONLINE",
        "scheduled_start": start_time,
        "scheduled_end": end_time
    }, headers=auth_headers)
    assert conflict_res.status_code == 409
