import re
import os
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import fitz  # PyMuPDF
from docx import Document
from app.ai.skill_taxonomy import normalize_skill, ALL_CANONICAL_SKILLS, SKILL_ALIASES

EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
PHONE_REGEX = re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
LINKEDIN_REGEX = re.compile(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+', re.IGNORECASE)
GITHUB_REGEX = re.compile(r'(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9_-]+', re.IGNORECASE)

EDUCATION_KEYWORDS = [
    ("Ph.D", ["ph.d", "phd", "doctor of philosophy"]),
    ("Master's Degree", ["master of science", "master of arts", "m.s.", "m.tech", "mba", "m.sc", "master's"]),
    ("Bachelor's Degree", ["bachelor of science", "bachelor of arts", "b.s.", "b.tech", "b.e.", "b.sc", "bachelor's", "undergraduate"]),
    ("Associate Degree", ["associate degree", "a.s.", "a.a."]),
]

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts raw text from a PDF document using PyMuPDF."""
    text_chunks = []
    with fitz.open(file_path) as doc:
        for page in doc:
            text_chunks.append(page.get_text())
    return "\n".join(text_chunks)

def extract_text_from_docx(file_path: str) -> str:
    """Extracts raw text from a DOCX document."""
    doc = Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text]
    # Also extract text from any tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text.strip():
                    paragraphs.append(cell.text.strip())
    return "\n".join(paragraphs)

def extract_document_text(file_path: str) -> str:
    """Validates extension and extracts raw text."""
    path = Path(file_path)
    ext = path.suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Only PDF and DOCX are supported.")

def parse_candidate_contact_info(text: str) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    """Extracts email, phone, linkedin, and github URLs."""
    email_match = EMAIL_REGEX.search(text)
    email = email_match.group(0).lower() if email_match else None

    phone_match = PHONE_REGEX.search(text)
    phone = phone_match.group(0).strip() if phone_match else None

    linkedin_match = LINKEDIN_REGEX.search(text)
    linkedin = linkedin_match.group(0) if linkedin_match else None

    github_match = GITHUB_REGEX.search(text)
    github = github_match.group(0) if github_match else None

    return email, phone, linkedin, github

def parse_candidate_name(text: str) -> Optional[str]:
    """Infers candidate full name from header lines."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for line in lines[:5]:
        # Exclude lines that look like emails, URLs, addresses, or resume titles
        if "@" in line or "http" in line or "resume" in line.lower() or "curriculum" in line.lower():
            continue
        # Names are usually 2 to 4 words, letters only
        words = line.split()
        if 2 <= len(words) <= 4 and all(re.match(r'^[A-Za-z.\'-]+$', w) for w in words):
            return line.title()
    return None

def parse_skills(text: str) -> List[str]:
    """Identifies technical skills in text against the skill taxonomy."""
    found_skills = set()
    text_lower = f" {text.lower()} "

    # Check canonical skills
    for canonical in ALL_CANONICAL_SKILLS:
        skill_lower = canonical.lower()
        # Word boundary search
        pattern = r'(?<![a-zA-Z0-9])' + re.escape(skill_lower) + r'(?![a-zA-Z0-9])'
        if re.search(pattern, text_lower):
            found_skills.add(canonical)

    # Check aliases
    for alias, canonical in SKILL_ALIASES.items():
        pattern = r'(?<![a-zA-Z0-9])' + re.escape(alias) + r'(?![a-zA-Z0-9])'
        if re.search(pattern, text_lower):
            found_skills.add(canonical)

    return sorted(list(found_skills))

def parse_experience_years(text: str) -> float:
    """Estimates years of professional experience from date ranges or explicit statements."""
    # Pattern: "X+ years of experience"
    exp_pattern = re.search(r'(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s*(?:of\s*)?experience', text, re.IGNORECASE)
    if exp_pattern:
        try:
            return float(exp_pattern.group(1))
        except ValueError:
            pass

    # Date ranges: e.g. 2018 - 2024 or 2020 - Present
    ranges = re.findall(r'\b(20\d\d|19\d\d)\s*[-–to]+\s*(Present|current|20\d\d)\b', text, re.IGNORECASE)
    total_months = 0
    current_year = 2026
    for start_yr, end_yr in ranges:
        try:
            start = int(start_yr)
            end = current_year if end_yr.lower() in ["present", "current"] else int(end_yr)
            diff = max(0, end - start)
            total_months += diff * 12
        except Exception:
            continue

    if total_months > 0:
        years = round(min(total_months / 12, 35.0), 1)
        return years

    return 1.0  # Default fallback if unspecified

def parse_education_level(text: str) -> Optional[str]:
    """Detects highest level of formal education mentioned."""
    text_lower = text.lower()
    for level_name, keywords in EDUCATION_KEYWORDS:
        for kw in keywords:
            pattern = r'(?<![a-zA-Z0-9])' + re.escape(kw) + r'(?![a-zA-Z0-9])'
            if re.search(pattern, text_lower):
                return level_name
    return None

def parse_resume(file_path: str) -> Dict[str, Any]:
    """Runs the full extraction pipeline on a resume file."""
    raw_text = extract_document_text(file_path)
    clean_text = " ".join(raw_text.split())

    email, phone, linkedin, github = parse_candidate_contact_info(raw_text)
    name = parse_candidate_name(raw_text)
    skills = parse_skills(raw_text)
    exp_years = parse_experience_years(raw_text)
    education = parse_education_level(raw_text)

    uncertain_fields = []
    if not name:
        uncertain_fields.append("full_name")
    if not email:
        uncertain_fields.append("email")
    if not phone:
        uncertain_fields.append("phone")
    if not skills:
        uncertain_fields.append("skills")
    if exp_years == 1.0:
        uncertain_fields.append("experience_years")

    # Extract sample projects and certifications if keywords exist
    certifications = []
    projects = []
    if "certif" in raw_text.lower():
        cert_matches = re.findall(r'(?:certified|certification|certificate)[:\s]+([^\n.,]+)', raw_text, re.IGNORECASE)
        certifications = [c.strip() for c in cert_matches[:3] if len(c.strip()) > 3]

    return {
        "full_name": name,
        "email": email,
        "phone": phone,
        "location": None,
        "current_title": None,
        "experience_years": exp_years,
        "education_level": education,
        "linkedin_url": linkedin,
        "github_url": github,
        "skills": skills,
        "education": [{"degree": education}] if education else [],
        "experience": [],
        "certifications": certifications,
        "projects": projects,
        "uncertain_fields": uncertain_fields,
        "raw_text_snippet": raw_text[:500] if raw_text else "",
        "full_raw_text": raw_text
    }
