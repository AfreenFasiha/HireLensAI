import sys
import time
import requests

BASE_URL = "http://localhost:8000/api/v1"

def main():
    print("=== Running HireLens AI End-to-End Workflow Verification ===")
    
    # 1. Health Check
    health = requests.get("http://localhost:8000/health").json()
    assert health["status"] == "healthy"
    print("[PASS] 1. Server Health Check verified: Healthy")

    # 2. Login as Demo Administrator
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@technova.io",
        "password": "Password123!"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 2. User Authentication: Logged in as admin@technova.io")

    # 3. Create a New Job Opening
    ts = int(time.time())
    job_payload = {
        "title": f"Principal AI Architect ({ts})",
        "department": "AI Research",
        "description": "Architect high-performance distributed training and inference clusters using PyTorch, Kubernetes, and Python.",
        "required_skills": ["Python", "Kubernetes", "PyTorch", "Docker"],
        "preferred_skills": ["AWS", "Terraform", "CI/CD"],
        "min_experience_years": 6.0,
        "location": "San Francisco, CA (Hybrid)",
        "employment_type": "FULL_TIME",
        "status": "ACTIVE"
    }
    job_resp = requests.post(f"{BASE_URL}/jobs", json=job_payload, headers=headers)
    assert job_resp.status_code == 201, f"Create job failed: {job_resp.text}"
    job_id = job_resp.json()["id"]
    print(f"[PASS] 3. Job Management: Created job opening '{job_payload['title']}' (ID: {job_id})")

    # 4. Create a Candidate with realistic skills
    cand_payload = {
        "full_name": f"Dr. Sarah Lin ({ts})",
        "email": f"sarah.lin.{ts}@example.com",
        "phone": "+1-555-0199",
        "location": "San Francisco, CA",
        "current_title": "Senior AI Systems Specialist",
        "experience_years": 7.5,
        "education_level": "Ph.D",
        "skills": ["Python", "Kubernetes", "PyTorch", "Docker", "AWS", "Terraform"],
        "summary": "Distributed AI systems engineer with deep expertise in PyTorch training clusters, Kubernetes operators, and high-performance computing on AWS."
    }
    cand_resp = requests.post(f"{BASE_URL}/candidates", json=cand_payload, headers=headers)
    assert cand_resp.status_code == 201, f"Create candidate failed: {cand_resp.text}"
    cand_id = cand_resp.json()["id"]
    print(f"[PASS] 4. Candidate Management: Created candidate profile '{cand_payload['full_name']}'")

    # 5. Apply Candidate to Job and Evaluate AI Match
    app_payload = {"job_id": job_id, "candidate_id": cand_id}
    app_resp = requests.post(f"{BASE_URL}/applications", json=app_payload, headers=headers)
    assert app_resp.status_code == 201, f"Create application failed: {app_resp.text}"
    app_data = app_resp.json()
    app_id = app_data["id"]
    match = app_data.get("match_score")
    print("Match object:", match)
    assert match is not None
    assert match["overall_score"] >= 50.0
    print(f"[PASS] 5. AI Candidate Matching: Evaluated match score {match['overall_score']}%")
    print(f"       Rationale: {match['score_explanation']}")

    # 6. Fetch Job Rankings
    rank_resp = requests.get(f"{BASE_URL}/ai/job-rankings/{job_id}", headers=headers)
    assert rank_resp.status_code == 200
    ranking = rank_resp.json()
    assert ranking["total_candidates"] >= 1
    top_cand = ranking["ranked_candidates"][0]
    assert top_cand["candidate_id"] == cand_id
    assert "Advisory" in ranking["advisory_notice"] or "decision support" in ranking["advisory_notice"]
    print(f"[PASS] 6. Candidate Ranking: Top candidate is {top_cand['candidate_name']} with {top_cand['overall_score']}%")

    # 7. Advance Candidate in Kanban Pipeline (APPLIED -> SHORTLISTED -> INTERVIEW)
    stage_resp = requests.patch(f"{BASE_URL}/applications/{app_id}/stage", json={
        "stage": "SHORTLISTED",
        "reason": "Exemplary skills in Kubernetes and PyTorch"
    }, headers=headers)
    assert stage_resp.status_code == 200
    assert stage_resp.json()["stage"] == "SHORTLISTED"

    stage_resp2 = requests.patch(f"{BASE_URL}/applications/{app_id}/stage", json={
        "stage": "INTERVIEW",
        "reason": "Proceeding to system architecture interview"
    }, headers=headers)
    assert stage_resp2.status_code == 200
    assert stage_resp2.json()["stage"] == "INTERVIEW"
    print("[PASS] 7. Kanban Pipeline Progression: Successfully transitioned to SHORTLISTED then INTERVIEW")

    # 8. Schedule Interview
    iv_payload = {
        "application_id": app_id,
        "title": "System Architecture Deep Dive",
        "interview_type": "ONLINE",
        "scheduled_start": "2026-10-25T14:00:00Z",
        "scheduled_end": "2026-10-25T15:00:00Z",
        "meeting_link": "https://meet.google.com/test-e2e-link"
    }
    iv_resp = requests.post(f"{BASE_URL}/interviews", json=iv_payload, headers=headers)
    assert iv_resp.status_code == 201, f"Schedule interview failed: {iv_resp.text}"
    iv_id = iv_resp.json()["id"]
    print(f"[PASS] 8. Interview Scheduling: Scheduled session '{iv_payload['title']}'")

    # 9. Submit Interviewer Feedback Scorecard
    fb_payload = {
        "rating": 5,
        "recommendation": "STRONG_YES",
        "technical_skills_feedback": "Stellar mastery of Kubernetes scheduler internals and GPU memory management.",
        "communication_feedback": "Articulate, structured, and insightful.",
        "general_notes": "Definite strong hire."
    }
    fb_resp = requests.post(f"{BASE_URL}/interviews/{iv_id}/feedback", json=fb_payload, headers=headers)
    assert fb_resp.status_code == 201
    print("[PASS] 9. Interview Feedback: Submitted 5-star rating with STRONG_YES recommendation")

    # 10. Verify Analytics Dashboard
    analytics_resp = requests.get(f"{BASE_URL}/analytics/dashboard", headers=headers)
    assert analytics_resp.status_code == 200
    analytics_data = analytics_resp.json()
    assert analytics_data["overview"]["total_candidates"] >= 23
    assert analytics_data["overview"]["active_job_openings"] >= 7
    print(f"[PASS] 10. Analytics Dashboard: Live metrics verified (Total Candidates: {analytics_data['overview']['total_candidates']}, Active Jobs: {analytics_data['overview']['active_job_openings']})")

    print("\n>>> ALL 10 END-TO-END WORKFLOW VERIFICATIONS PASSED WITH 100% SUCCESS! <<<")

if __name__ == "__main__":
    main()
