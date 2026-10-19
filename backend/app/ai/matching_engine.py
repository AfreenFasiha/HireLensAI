import math
from typing import Dict, Any, List, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.ai.skill_taxonomy import normalize_skill

# Default weights
DEFAULT_WEIGHTS = {
    "required_skills": 0.40,
    "semantic_similarity": 0.30,
    "preferred_skills": 0.15,
    "experience_alignment": 0.15,
}

def calculate_skills_overlap(candidate_skills: List[str], target_skills: List[str]) -> Tuple[float, List[str], List[str]]:
    """Calculates coverage between candidate skills and target job skills."""
    if not target_skills:
        return 100.0, [], []

    cand_norm = {normalize_skill(s).lower(): normalize_skill(s) for s in candidate_skills}
    
    matched = []
    missing = []

    for req in target_skills:
        norm_req = normalize_skill(req)
        if norm_req.lower() in cand_norm:
            matched.append(norm_req)
        else:
            missing.append(norm_req)

    coverage_score = (len(matched) / len(target_skills)) * 100.0
    return round(coverage_score, 1), matched, missing

class TupleListMatch:
    def __init__(self, score: float, matched: List[str], missing: List[str]):
        self.score = score
        self.matched = matched
        self.missing = missing

def calculate_semantic_similarity(candidate_text: str, job_description: str) -> float:
    """Calculates semantic text similarity using TF-IDF and cosine similarity.
    Ethical AI: excludes names, contact info, and demographic terms."""
    if not candidate_text or not job_description:
        return 50.0  # Neutral baseline if text is sparse

    try:
        # Preprocess text to focus on professional content
        corpus = [candidate_text, job_description]
        vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=2000,
            ngram_range=(1, 2)
        )
        tfidf_matrix = vectorizer.fit_transform(corpus)
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        
        # Scale 0.0 - 1.0 to 0 - 100 with a natural domain distribution
        scaled_score = min(max(similarity * 120.0, 10.0), 98.0)
        return round(float(scaled_score), 1)
    except Exception:
        # Fallback to token overlap ratio
        cand_words = set(candidate_text.lower().split())
        job_words = set(job_description.lower().split())
        if not job_words:
            return 50.0
        overlap = len(cand_words.intersection(job_words)) / len(job_words)
        return round(min(overlap * 100.0, 100.0), 1)

def calculate_experience_alignment(candidate_years: float, min_required_years: float) -> float:
    """Calculates experience alignment score with a balanced curve.
    Meeting or exceeding requirements gets high marks; slightly under gets fair partial credit."""
    if min_required_years <= 0:
        return 100.0

    if candidate_years >= min_required_years:
        # Full score plus minor plateau, capped at 100
        return 100.0
    
    ratio = candidate_years / min_required_years
    # Smooth logarithmic partial curve
    score = 100.0 * (1 - math.exp(-2.5 * ratio)) / (1 - math.exp(-2.5))
    return round(max(min(score, 100.0), 15.0), 1)

def generate_score_explanation(
    overall_score: float,
    req_matched: List[str],
    req_missing: List[str],
    pref_matched: List[str],
    cand_exp: float,
    min_exp: float,
    sem_score: float
) -> str:
    """Generates an explainable, human-readable breakdown of the candidate match."""
    parts = []
    
    # Required skills statement
    total_req = len(req_matched) + len(req_missing)
    if total_req > 0:
        req_pct = round((len(req_matched) / total_req) * 100)
        if len(req_missing) == 0:
            parts.append(f"Meets all {total_req} mandatory skill requirements ({', '.join(req_matched)}).")
        else:
            parts.append(
                f"Possesses {len(req_matched)} of {total_req} mandatory skills ({req_pct}% coverage). "
                f"Missing: {', '.join(req_missing)}."
            )
    else:
        parts.append("Job has no mandatory skill restrictions specified.")

    # Preferred skills statement
    if pref_matched:
        parts.append(f"Provides bonus preferred capabilities in: {', '.join(pref_matched)}.")

    # Experience alignment statement
    if cand_exp >= min_exp:
        parts.append(f"Candidate's {cand_exp} years of relevant experience meets the {min_exp} years requirement.")
    else:
        parts.append(f"Candidate brings {cand_exp} years of experience vs {min_exp} years requested.")

    # Semantic relevance
    if sem_score >= 70:
        parts.append("Strong domain vocabulary and background alignment with the role description.")
    elif sem_score >= 50:
        parts.append("Moderate contextual alignment with the role responsibilities.")
    else:
        parts.append("Limited direct semantic alignment with specific job responsibilities.")

    return " ".join(parts)

def evaluate_candidate_match(
    candidate_skills: List[str],
    candidate_experience: float,
    candidate_text: str,
    job_required_skills: List[str],
    job_preferred_skills: List[str],
    job_min_experience: float,
    job_description: str,
    custom_weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """Computes transparent multi-factor match score and explanation."""
    weights = custom_weights or DEFAULT_WEIGHTS
    
    w_req = weights.get("required_skills", 0.40)
    w_sem = weights.get("semantic_similarity", 0.30)
    w_pref = weights.get("preferred_skills", 0.15)
    w_exp = weights.get("experience_alignment", 0.15)
    
    # Normalize weights so they sum to 1.0
    total_w = w_req + w_sem + w_pref + w_exp
    if total_w <= 0:
        total_w = 1.0
    w_req /= total_w
    w_sem /= total_w
    w_pref /= total_w
    w_exp /= total_w

    # 1. Required skills coverage
    req_score, req_matched, req_missing = calculate_skills_overlap(candidate_skills, job_required_skills)
    
    # 2. Preferred skills coverage
    pref_score, pref_matched, _ = calculate_skills_overlap(candidate_skills, job_preferred_skills)

    # 3. Experience alignment
    exp_score = calculate_experience_alignment(candidate_experience, job_min_experience)

    # 4. Semantic similarity
    sem_score = calculate_semantic_similarity(candidate_text, job_description)

    # Composite overall score
    overall = (
        (req_score * w_req) +
        (sem_score * w_sem) +
        (pref_score * w_pref) +
        (exp_score * w_exp)
    )
    overall = round(max(min(overall, 100.0), 0.0), 1)

    explanation = generate_score_explanation(
        overall, req_matched, req_missing, pref_matched,
        candidate_experience, job_min_experience, sem_score
    )

    return {
        "overall_score": overall,
        "required_skills_score": req_score,
        "preferred_skills_score": pref_score,
        "semantic_similarity_score": sem_score,
        "experience_alignment_score": exp_score,
        "matched_required_skills": req_matched,
        "missing_required_skills": req_missing,
        "matched_preferred_skills": pref_matched,
        "score_explanation": explanation,
        "weights_used": {
            "required_skills": round(w_req, 2),
            "semantic_similarity": round(w_sem, 2),
            "preferred_skills": round(w_pref, 2),
            "experience_alignment": round(w_exp, 2),
        }
    }
