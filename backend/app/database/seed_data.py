import os
import random
from datetime import datetime, timedelta
from app.database.session import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.job import Job, JobStatus, EmploymentType
from app.models.candidate import Candidate
from app.models.candidate_skill import CandidateSkill
from app.models.application import Application, ApplicationStage
from app.models.application_stage_history import ApplicationStageHistory
from app.models.match_score import MatchScore
from app.models.interview import Interview, InterviewType, InterviewStatus
from app.models.interview_feedback import InterviewFeedback, RecommendationType
from app.models.recruiter_note import RecruiterNote
from app.models.audit_log import AuditLog
from app.ai.matching_engine import evaluate_candidate_match
from app.ai.skill_taxonomy import get_skill_category

def seed_database():
    """Seeds the database with comprehensive, fictional demonstration data."""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_org = db.query(Organization).filter(Organization.slug == "technova-solutions").first()
        if existing_org:
            print("[INFO] Database already seeded. Skipping initial seeding.")
            return

        print("[SEED] Creating demo organization...")
        org = Organization(
            name="TechNova Solutions",
            slug="technova-solutions",
            domain="technova.io"
        )
        db.add(org)
        db.flush()

        print("[SEED] Creating demo users...")
        pwd_hash = hash_password("Password123!")
        
        admin = User(
            organization_id=org.id,
            email="admin@technova.io",
            hashed_password=pwd_hash,
            full_name="Alex Vance (Admin)",
            role=UserRole.ADMIN,
            is_active=True
        )
        recruiter1 = User(
            organization_id=org.id,
            email="sarah.recruiter@technova.io",
            hashed_password=pwd_hash,
            full_name="Sarah Jenkins (Senior Recruiter)",
            role=UserRole.RECRUITER,
            is_active=True
        )
        recruiter2 = User(
            organization_id=org.id,
            email="marcus.talent@technova.io",
            hashed_password=pwd_hash,
            full_name="Marcus Chen (Tech Recruiter)",
            role=UserRole.RECRUITER,
            is_active=True
        )
        hiring_mgr = User(
            organization_id=org.id,
            email="elena.engineering@technova.io",
            hashed_password=pwd_hash,
            full_name="Elena Rostova (VP of Engineering)",
            role=UserRole.HIRING_MANAGER,
            is_active=True
        )
        db.add_all([admin, recruiter1, recruiter2, hiring_mgr])
        db.flush()

        print("[SEED] Creating 6 job openings...")
        jobs_data = [
            {
                "title": "Senior Full-Stack Engineer",
                "department": "Engineering",
                "description": (
                    "TechNova Solutions is seeking an experienced Senior Full-Stack Engineer to architect "
                    "and deliver scalable cloud services. You will design backend services using FastAPI and Python, "
                    "craft rich client interfaces with React and TypeScript, and maintain robust PostgreSQL databases. "
                    "Ideal candidates exhibit strong systems intuition, clean API design principles, and collaborative leadership."
                ),
                "required_skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL"],
                "preferred_skills": ["Docker", "AWS", "Redis", "Tailwind CSS"],
                "min_experience_years": 5.0,
                "location": "San Francisco, CA (Hybrid)",
                "employment_type": EmploymentType.FULL_TIME,
                "status": JobStatus.ACTIVE
            },
            {
                "title": "Machine Learning Engineer",
                "department": "AI Research",
                "description": (
                    "Join our core AI research group building state-of-the-art NLP recommendation models. "
                    "You will train, fine-tune, and deploy transformer architectures, develop scalable feature pipelines "
                    "with Scikit-Learn and PyTorch, and optimize inference endpoints for sub-50ms latency."
                ),
                "required_skills": ["Python", "PyTorch", "Scikit-Learn", "Natural Language Processing", "Machine Learning"],
                "preferred_skills": ["Sentence Transformers", "Docker", "HuggingFace", "FastAPI"],
                "min_experience_years": 4.0,
                "location": "Remote (US/Canada)",
                "employment_type": EmploymentType.FULL_TIME,
                "status": JobStatus.ACTIVE
            },
            {
                "title": "Frontend Architect",
                "department": "Engineering",
                "description": (
                    "Lead frontend technical standards across our enterprise web applications. "
                    "You will drive design system adoption, architect scalable React/TypeScript codebases, "
                    "optimize bundle performance, and mentor senior frontend engineers."
                ),
                "required_skills": ["React", "TypeScript", "Tailwind CSS", "Vite", "Next.js"],
                "preferred_skills": ["GraphQL", "Vitest", "Playwright", "System Architecture"],
                "min_experience_years": 6.0,
                "location": "New York, NY (Hybrid)",
                "employment_type": EmploymentType.FULL_TIME,
                "status": JobStatus.ACTIVE
            },
            {
                "title": "DevOps & Cloud Infrastructure Engineer",
                "department": "Infrastructure",
                "description": (
                    "Ensure high availability, resilience, and security across our distributed cloud deployments. "
                    "Manage multi-cluster Kubernetes on AWS, author infrastructure-as-code with Terraform, "
                    "and construct automated CI/CD pipelines using GitHub Actions."
                ),
                "required_skills": ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD"],
                "preferred_skills": ["Linux", "GitHub Actions", "Nginx", "Python"],
                "min_experience_years": 4.0,
                "location": "Austin, TX (Remote)",
                "employment_type": EmploymentType.FULL_TIME,
                "status": JobStatus.ACTIVE
            },
            {
                "title": "Product Manager - AI Platform",
                "department": "Product",
                "description": (
                    "Define product roadmap and customer discovery for our AI recruitment workflow tools. "
                    "Collaborate closely with engineering, UX designers, and recruitment partners to translate complex "
                    "ML capabilities into intuitive, impactful user experiences."
                ),
                "required_skills": ["Agile", "Scrum", "Jira", "Leadership", "System Architecture"],
                "preferred_skills": ["Machine Learning", "Data Analysis", "Code Review"],
                "min_experience_years": 4.0,
                "location": "San Francisco, CA (Hybrid)",
                "employment_type": EmploymentType.FULL_TIME,
                "status": JobStatus.ACTIVE
            },
            {
                "title": "QA Automation Engineer",
                "department": "Engineering",
                "description": (
                    "Develop automated end-to-end and regression test suites for our mission-critical SaaS applications. "
                    "Create test fixtures with Pytest and Playwright, integrate tests into continuous deployment pipelines, "
                    "and champion quality engineering across squads."
                ),
                "required_skills": ["Pytest", "Playwright", "TypeScript", "Python", "CI/CD"],
                "preferred_skills": ["Docker", "Jest", "Git"],
                "min_experience_years": 3.0,
                "location": "Remote (US)",
                "employment_type": EmploymentType.FULL_TIME,
                "status": JobStatus.ACTIVE
            }
        ]

        created_jobs = []
        for jd in jobs_data:
            job = Job(
                organization_id=org.id,
                created_by_id=recruiter1.id,
                **jd
            )
            db.add(job)
            created_jobs.append(job)
        db.flush()

        print("[SEED] Creating 22 fictional candidates...")
        candidates_raw = [
            {
                "full_name": "Maya Lin",
                "email": "maya.lin.fictional@example.com",
                "phone": "+1 (415) 555-0101",
                "location": "San Francisco, CA",
                "current_title": "Lead Full-Stack Developer",
                "experience_years": 6.5,
                "education_level": "Bachelor's Degree",
                "linkedin_url": "https://linkedin.com/in/fictional-maya-lin",
                "github_url": "https://github.com/fictional-mayalin",
                "skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "AWS", "Tailwind CSS", "Redis"],
                "summary": "Full-stack engineer with 6+ years designing reactive web platforms and resilient Python APIs.",
                "target_job_index": 0,
                "stage": ApplicationStage.OFFER
            },
            {
                "full_name": "Devon Miller",
                "email": "devon.miller.fictional@example.com",
                "phone": "+1 (206) 555-0102",
                "location": "Seattle, WA",
                "current_title": "Senior Backend Engineer",
                "experience_years": 5.0,
                "education_level": "Master's Degree",
                "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Redis"],
                "summary": "Backend specialist focused on high-throughput microservices, data serialization, and database indexing.",
                "target_job_index": 0,
                "stage": ApplicationStage.INTERVIEW
            },
            {
                "full_name": "Aria Thorne",
                "email": "aria.thorne.fictional@example.com",
                "phone": "+1 (512) 555-0103",
                "location": "Austin, TX",
                "current_title": "Full-Stack Software Engineer",
                "experience_years": 4.0,
                "education_level": "Bachelor's Degree",
                "skills": ["Python", "React", "TypeScript", "FastAPI", "MySQL", "Tailwind CSS"],
                "summary": "Product-oriented engineer passionate about clean components, DX, and responsive user interfaces.",
                "target_job_index": 0,
                "stage": ApplicationStage.SHORTLISTED
            },
            {
                "full_name": "Lucas Sterling",
                "email": "lucas.sterling.fictional@example.com",
                "phone": "+1 (617) 555-0104",
                "location": "Boston, MA",
                "current_title": "Junior Python Developer",
                "experience_years": 2.0,
                "education_level": "Bachelor's Degree",
                "skills": ["Python", "Django", "JavaScript", "HTML", "CSS"],
                "summary": "Early-career developer enthusiastic about backend web services and clean coding standards.",
                "target_job_index": 0,
                "stage": ApplicationStage.SCREENING
            },
            {
                "full_name": "Dr. Aris Thorne",
                "email": "aris.thorne.fictional@example.com",
                "phone": "+1 (415) 555-0105",
                "location": "Palo Alto, CA",
                "current_title": "Staff AI Researcher",
                "experience_years": 7.0,
                "education_level": "Ph.D",
                "skills": ["Python", "PyTorch", "Scikit-Learn", "Natural Language Processing", "Machine Learning", "Sentence Transformers", "HuggingFace", "FastAPI", "Docker"],
                "summary": "Ph.D in Computer Science specializing in transformer token embeddings and dense vector retrieval.",
                "target_job_index": 1,
                "stage": ApplicationStage.HIRED
            },
            {
                "full_name": "Sophia Zhang",
                "email": "sophia.zhang.fictional@example.com",
                "phone": "+1 (650) 555-0106",
                "location": "Mountain View, CA",
                "current_title": "Senior ML Engineer",
                "experience_years": 4.5,
                "education_level": "Master's Degree",
                "skills": ["Python", "PyTorch", "Scikit-Learn", "Machine Learning", "Natural Language Processing", "Docker", "HuggingFace"],
                "summary": "Applied ML engineer with deep background in conversational agents and semantic embedding search.",
                "target_job_index": 1,
                "stage": ApplicationStage.INTERVIEW
            },
            {
                "full_name": "Ethan Caldwell",
                "email": "ethan.caldwell.fictional@example.com",
                "phone": "+1 (303) 555-0107",
                "location": "Denver, CO",
                "current_title": "Data Scientist",
                "experience_years": 3.0,
                "education_level": "Master's Degree",
                "skills": ["Python", "Scikit-Learn", "Machine Learning", "Pandas", "NumPy", "SQL"],
                "summary": "Data scientist experienced in predictive modeling, statistical validation, and feature engineering.",
                "target_job_index": 1,
                "stage": ApplicationStage.SCREENING
            },
            {
                "full_name": "Zoe Kravitz-Finch",
                "email": "zoe.finch.fictional@example.com",
                "phone": "+1 (212) 555-0108",
                "location": "New York, NY",
                "current_title": "Principal UI Architect",
                "experience_years": 8.0,
                "education_level": "Bachelor's Degree",
                "skills": ["React", "TypeScript", "Tailwind CSS", "Vite", "Next.js", "GraphQL", "Vitest", "System Architecture"],
                "summary": "Frontend architect behind high-scale web platforms, component libraries, and design token architectures.",
                "target_job_index": 2,
                "stage": ApplicationStage.INTERVIEW
            },
            {
                "full_name": "Liam Gallagher-Cole",
                "email": "liam.cole.fictional@example.com",
                "phone": "+1 (312) 555-0109",
                "location": "Chicago, IL",
                "current_title": "Senior React Developer",
                "experience_years": 6.0,
                "education_level": "Bachelor's Degree",
                "skills": ["React", "TypeScript", "Tailwind CSS", "Next.js", "Vite", "Playwright"],
                "summary": "Senior engineer focused on accessible web applications, server components, and test automation.",
                "target_job_index": 2,
                "stage": ApplicationStage.SHORTLISTED
            },
            {
                "full_name": "Chloe Dupont",
                "email": "chloe.dupont.fictional@example.com",
                "phone": "+1 (416) 555-0110",
                "location": "Toronto, ON",
                "current_title": "Frontend Engineer",
                "experience_years": 3.5,
                "education_level": "Bachelor's Degree",
                "skills": ["React", "TypeScript", "Tailwind CSS", "HTML", "CSS"],
                "summary": "Creative frontend developer building engaging digital interfaces and animations.",
                "target_job_index": 2,
                "stage": ApplicationStage.APPLIED
            },
            {
                "full_name": "Marcus Aurelius Webb",
                "email": "marcus.webb.fictional@example.com",
                "phone": "+1 (512) 555-0111",
                "location": "Austin, TX",
                "current_title": "Principal Cloud Architect",
                "experience_years": 9.0,
                "education_level": "Bachelor's Degree",
                "skills": ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "Linux", "GitHub Actions", "Python"],
                "summary": "Infrastructure leader specializing in Kubernetes zero-downtime clusters, VPC networking, and Terraform modules.",
                "target_job_index": 3,
                "stage": ApplicationStage.OFFER
            },
            {
                "full_name": "Nadia Al-Mansoor",
                "email": "nadia.mansoor.fictional@example.com",
                "phone": "+1 (408) 555-0112",
                "location": "San Jose, CA",
                "current_title": "Senior DevOps Engineer",
                "experience_years": 5.0,
                "education_level": "Master's Degree",
                "skills": ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "GitHub Actions"],
                "summary": "Cloud engineer automating multi-region infrastructure pipelines and observability monitoring.",
                "target_job_index": 3,
                "stage": ApplicationStage.SHORTLISTED
            },
            {
                "full_name": "Carlos Santoro",
                "email": "carlos.santoro.fictional@example.com",
                "phone": "+1 (305) 555-0113",
                "location": "Miami, FL",
                "current_title": "Systems Administrator",
                "experience_years": 3.0,
                "education_level": "Associate Degree",
                "skills": ["Linux", "Docker", "Bash", "Shell", "AWS"],
                "summary": "Linux system administrator transitioning into automated container orchestration and cloud operations.",
                "target_job_index": 3,
                "stage": ApplicationStage.SCREENING
            },
            {
                "full_name": "Priya Sharma",
                "email": "priya.sharma.fictional@example.com",
                "phone": "+1 (415) 555-0114",
                "location": "San Francisco, CA",
                "current_title": "Senior Product Manager",
                "experience_years": 6.0,
                "education_level": "Master's Degree",
                "skills": ["Agile", "Scrum", "Jira", "Leadership", "System Architecture", "Machine Learning", "Data Analysis"],
                "summary": "Technical PM with extensive track record taking machine learning products from zero to one.",
                "target_job_index": 4,
                "stage": ApplicationStage.INTERVIEW
            },
            {
                "full_name": "David Ben-Ari",
                "email": "david.benari.fictional@example.com",
                "phone": "+1 (212) 555-0115",
                "location": "New York, NY",
                "current_title": "Technical Product Manager",
                "experience_years": 4.5,
                "education_level": "Bachelor's Degree",
                "skills": ["Agile", "Scrum", "Jira", "Leadership", "System Architecture"],
                "summary": "Agile practitioner skilled at roadmap prioritization, sprint execution, and stakeholder alignment.",
                "target_job_index": 4,
                "stage": ApplicationStage.SHORTLISTED
            },
            {
                "full_name": "Hannah Abbott",
                "email": "hannah.abbott.fictional@example.com",
                "phone": "+1 (415) 555-0116",
                "location": "Oakland, CA",
                "current_title": "Associate Product Manager",
                "experience_years": 2.0,
                "education_level": "Bachelor's Degree",
                "skills": ["Agile", "Jira", "Leadership"],
                "summary": "Energetic product manager with user research experience and data analytics mindset.",
                "target_job_index": 4,
                "stage": ApplicationStage.APPLIED
            },
            {
                "full_name": "Felix Baumgartner",
                "email": "felix.baumgartner.fictional@example.com",
                "phone": "+1 (503) 555-0117",
                "location": "Portland, OR",
                "current_title": "Lead SDET",
                "experience_years": 5.5,
                "education_level": "Bachelor's Degree",
                "skills": ["Pytest", "Playwright", "TypeScript", "Python", "CI/CD", "Docker", "Git"],
                "summary": "Test automation engineer passionate about flakiness reduction, parallel execution, and CI test pipelines.",
                "target_job_index": 5,
                "stage": ApplicationStage.INTERVIEW
            },
            {
                "full_name": "Rachel Zane-Ross",
                "email": "rachel.zane.fictional@example.com",
                "phone": "+1 (415) 555-0118",
                "location": "San Francisco, CA",
                "current_title": "QA Automation Engineer",
                "experience_years": 3.5,
                "education_level": "Bachelor's Degree",
                "skills": ["Pytest", "Playwright", "TypeScript", "Python", "CI/CD"],
                "summary": "Quality engineer with comprehensive API testing and browser automation experience.",
                "target_job_index": 5,
                "stage": ApplicationStage.SHORTLISTED
            },
            {
                "full_name": "Julian Thorne",
                "email": "julian.thorne.fictional@example.com",
                "phone": "+1 (617) 555-0119",
                "location": "Boston, MA",
                "current_title": "Manual QA Tester",
                "experience_years": 2.5,
                "education_level": "Associate Degree",
                "skills": ["Jira", "Agile", "Unit Testing"],
                "summary": "QA tester skilled in test cases creation, bug triage, and exploratory verification.",
                "target_job_index": 5,
                "stage": ApplicationStage.REJECTED
            },
            {
                "full_name": "Kavita Rao",
                "email": "kavita.rao.fictional@example.com",
                "phone": "+1 (408) 555-0120",
                "location": "Fremont, CA",
                "current_title": "Staff ML Systems Architect",
                "experience_years": 8.0,
                "education_level": "Ph.D",
                "skills": ["Python", "PyTorch", "Scikit-Learn", "Natural Language Processing", "Machine Learning", "Sentence Transformers", "Docker", "AWS"],
                "summary": "Distinguished ML scientist with 8+ years leading deep learning and language model architectures.",
                "target_job_index": 1,
                "stage": ApplicationStage.OFFER
            },
            {
                "full_name": "Owen MacLeod",
                "email": "owen.macleod.fictional@example.com",
                "phone": "+1 (604) 555-0121",
                "location": "Vancouver, BC",
                "current_title": "Full-Stack Web Engineer",
                "experience_years": 4.5,
                "education_level": "Bachelor's Degree",
                "skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker"],
                "summary": "Versatile full stack developer with experience in microservices, relational modeling, and React hooks.",
                "target_job_index": 0,
                "stage": ApplicationStage.SHORTLISTED
            },
            {
                "full_name": "Seraphina Vance",
                "email": "seraphina.vance.fictional@example.com",
                "phone": "+1 (212) 555-0122",
                "location": "New York, NY",
                "current_title": "Site Reliability Engineer",
                "experience_years": 5.0,
                "education_level": "Master's Degree",
                "skills": ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "Linux"],
                "summary": "SRE engineer driving SLA adherence, automated recovery, and infrastructure reliability.",
                "target_job_index": 3,
                "stage": ApplicationStage.INTERVIEW
            }
        ]

        now = datetime.utcnow()
        for idx, cdata in enumerate(candidates_raw):
            applied_days_ago = random.randint(1, 28)
            applied_date = now - timedelta(days=applied_days_ago, hours=random.randint(1, 10))

            cand = Candidate(
                organization_id=org.id,
                full_name=cdata["full_name"],
                email=cdata["email"],
                phone=cdata.get("phone"),
                location=cdata.get("location"),
                current_title=cdata.get("current_title"),
                experience_years=cdata.get("experience_years", 3.0),
                education_level=cdata.get("education_level"),
                linkedin_url=cdata.get("linkedin_url"),
                github_url=cdata.get("github_url"),
                summary=cdata.get("summary"),
                raw_text=f"{cdata['full_name']}\n{cdata.get('current_title', '')}\n{cdata.get('summary', '')}\nSkills: {', '.join(cdata['skills'])}",
                is_verified_by_recruiter=True,
                created_at=applied_date,
                updated_at=applied_date
            )
            db.add(cand)
            db.flush()

            # Add skills
            for s in cdata["skills"]:
                sk = CandidateSkill(
                    candidate_id=cand.id,
                    skill_name=s,
                    category=get_skill_category(s),
                    is_verified=True
                )
                db.add(sk)

            # Associate application
            target_job = created_jobs[cdata["target_job_index"]]
            app = Application(
                organization_id=org.id,
                job_id=target_job.id,
                candidate_id=cand.id,
                stage=cdata["stage"],
                applied_at=applied_date,
                updated_at=applied_date + timedelta(days=random.randint(0, 3))
            )
            db.add(app)
            db.flush()

            # Stage history
            hist1 = ApplicationStageHistory(
                application_id=app.id,
                changed_by_id=recruiter1.id,
                from_stage="NEW",
                to_stage=ApplicationStage.APPLIED.value,
                reason="Application submitted",
                created_at=applied_date
            )
            db.add(hist1)

            if app.stage != ApplicationStage.APPLIED:
                hist2 = ApplicationStageHistory(
                    application_id=app.id,
                    changed_by_id=recruiter1.id,
                    from_stage=ApplicationStage.APPLIED.value,
                    to_stage=app.stage.value,
                    reason=f"Candidate advanced to {app.stage.value}",
                    created_at=app.updated_at
                )
                db.add(hist2)

            # Evaluate AI match
            eval_res = evaluate_candidate_match(
                candidate_skills=cdata["skills"],
                candidate_experience=cdata["experience_years"],
                candidate_text=cand.raw_text,
                job_required_skills=target_job.required_skills,
                job_preferred_skills=target_job.preferred_skills,
                job_min_experience=target_job.min_experience_years,
                job_description=target_job.description
            )

            ms = MatchScore(
                application_id=app.id,
                overall_score=eval_res["overall_score"],
                required_skills_score=eval_res["required_skills_score"],
                preferred_skills_score=eval_res["preferred_skills_score"],
                semantic_similarity_score=eval_res["semantic_similarity_score"],
                experience_alignment_score=eval_res["experience_alignment_score"],
                matched_required_skills=eval_res["matched_required_skills"],
                missing_required_skills=eval_res["missing_required_skills"],
                matched_preferred_skills=eval_res["matched_preferred_skills"],
                score_explanation=eval_res["score_explanation"],
                weights_used=eval_res["weights_used"],
                calculated_at=applied_date
            )
            db.add(ms)

            # Notes
            note = RecruiterNote(
                candidate_id=cand.id,
                author_id=recruiter1.id,
                content=f"Initial profile review completed. Candidate displays strong alignment in {', '.join(cdata['skills'][:3])}.",
                created_at=applied_date + timedelta(hours=2)
            )
            db.add(note)

            # Add interview for candidates in interview or offer stage
            if cdata["stage"] in [ApplicationStage.INTERVIEW, ApplicationStage.OFFER, ApplicationStage.HIRED]:
                scheduled_start = now + timedelta(days=random.randint(1, 5), hours=random.randint(9, 16))
                interview = Interview(
                    application_id=app.id,
                    interviewer_id=hiring_mgr.id,
                    title=f"Technical Deep Dive: {cand.full_name}",
                    interview_type=InterviewType.ONLINE,
                    scheduled_start=scheduled_start,
                    scheduled_end=scheduled_start + timedelta(minutes=45),
                    timezone="UTC",
                    meeting_link=f"https://meet.technova.io/interview-{cand.id[:8]}",
                    location="Virtual Room 3",
                    status=InterviewStatus.SCHEDULED if cdata["stage"] == ApplicationStage.INTERVIEW else InterviewStatus.COMPLETED
                )
                db.add(interview)
                db.flush()

                if cdata["stage"] in [ApplicationStage.OFFER, ApplicationStage.HIRED]:
                    fb = InterviewFeedback(
                        interview_id=interview.id,
                        reviewer_id=hiring_mgr.id,
                        rating=5,
                        recommendation=RecommendationType.STRONG_YES,
                        technical_skills_feedback="Exceptional architectural intuition and crisp communication of trade-offs.",
                        communication_feedback="Articulate, humble, and engaged.",
                        general_notes="Top tier recommendation for offer.",
                        created_at=now - timedelta(days=1)
                    )
                    db.add(fb)

        # Audit logs
        audit1 = AuditLog(
            organization_id=org.id,
            user_id=admin.id,
            action="SYSTEM_INIT",
            resource_type="SYSTEM",
            resource_id="INITIAL_SETUP",
            details={"version": "1.0.0", "organization": org.name}
        )
        db.add(audit1)

        db.commit()
        print("[SUCCESS] Successfully seeded TechNova Solutions with 4 users, 6 jobs, and 22 candidates!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
