export type UserRole = 'ADMIN' | 'RECRUITER' | 'HIRING_MANAGER';

export interface User {
  id: string;
  organization_id: string;
  organization_name?: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string | null;
  created_at: string;
}

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE';
export type JobStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';

export interface MatchingWeights {
  required_skills?: number;
  semantic_similarity?: number;
  preferred_skills?: number;
  experience_alignment?: number;
}

export interface Job {
  id: string;
  organization_id: string;
  created_by_id?: string;
  title: string;
  department: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  min_experience_years: number;
  location: string;
  employment_type: EmploymentType;
  status: JobStatus;
  matching_weights?: MatchingWeights;
  created_at: string;
  updated_at: string;
  candidates_count?: number;
}

export interface CandidateSkill {
  id?: string;
  skill_name: string;
  category?: string;
  years_of_experience?: number;
  is_verified: boolean;
}

export interface RecruiterNote {
  id: string;
  author_id?: string;
  author_name?: string;
  content: string;
  is_private: boolean;
  created_at: string;
}

export interface Candidate {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  current_title?: string | null;
  experience_years: number;
  education_level?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  summary?: string | null;
  raw_text?: string | null;
  is_verified_by_recruiter: boolean;
  skills: CandidateSkill[];
  notes?: RecruiterNote[];
  latest_resume_id?: string | null;
  latest_resume_file_name?: string | null;
  active_applications_count?: number;
  created_at: string;
  updated_at: string;
}

export type ApplicationStage = 
  | 'APPLIED'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface MatchScore {
  id?: string;
  application_id?: string;
  overall_score: number;
  required_skills_score: number;
  preferred_skills_score: number;
  semantic_similarity_score: number;
  experience_alignment_score: number;
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  score_explanation: string;
  weights_used: Record<string, number>;
  calculated_at?: string;
}

export interface Application {
  id: string;
  organization_id: string;
  job_id: string;
  candidate_id: string;
  candidate_name?: string;
  candidate_email?: string;
  candidate_title?: string;
  job_title?: string;
  job_department?: string;
  stage: ApplicationStage;
  applied_at: string;
  updated_at: string;
  match_score?: MatchScore | null;
}

export interface StageHistory {
  id: string;
  from_stage: string;
  to_stage: string;
  reason?: string;
  changed_by_name?: string;
  created_at: string;
}

export type InterviewType = 'ONLINE' | 'PHONE' | 'IN_PERSON';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';
export type RecommendationType = 'STRONG_YES' | 'YES' | 'NEUTRAL' | 'NO' | 'STRONG_NO';

export interface InterviewFeedback {
  id: string;
  interview_id: string;
  reviewer_id?: string;
  reviewer_name?: string;
  rating: number;
  recommendation: RecommendationType;
  technical_skills_feedback?: string;
  communication_feedback?: string;
  general_notes?: string;
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  interviewer_id?: string;
  interviewer_name?: string;
  candidate_id?: string;
  candidate_name?: string;
  candidate_email?: string;
  job_id?: string;
  job_title?: string;
  title: string;
  interview_type: InterviewType;
  scheduled_start: string;
  scheduled_end: string;
  timezone: string;
  meeting_link?: string | null;
  location?: string | null;
  status: InterviewStatus;
  cancellation_reason?: string | null;
  created_at: string;
  feedbacks: InterviewFeedback[];
}

export interface ParsedResumeData {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  current_title?: string | null;
  experience_years?: number;
  education_level?: string | null;
  skills: string[];
  education: Array<{ degree?: string; institution?: string; year?: string }>;
  experience: Array<{ title?: string; company?: string; duration?: string; description?: string }>;
  certifications: string[];
  projects: string[];
  uncertain_fields: string[];
  raw_text_snippet?: string | null;
}

export interface CandidateRankItem {
  application_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_title?: string;
  candidate_email: string;
  candidate_experience: number;
  stage: string;
  overall_score: number;
  required_skills_score: number;
  preferred_skills_score: number;
  semantic_similarity_score: number;
  experience_alignment_score: number;
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  score_explanation: string;
  applied_at: string;
}

export interface JobRankingResponse {
  job_id: string;
  job_title: string;
  total_candidates: number;
  ranked_candidates: CandidateRankItem[];
  advisory_notice: string;
}

export interface AnalyticsDashboard {
  overview: {
    total_candidates: number;
    active_job_openings: number;
    interviews_scheduled: number;
    candidates_shortlisted: number;
    applications_this_month: number;
    average_match_score: number;
  };
  stage_distribution: Array<{
    stage: string;
    count: number;
    color?: string;
  }>;
  applications_trend: Array<{
    date: string;
    applications: number;
  }>;
  jobs_metrics: Array<{
    job_id: string;
    job_title: string;
    department: string;
    applications_count: number;
    avg_match_score: number;
  }>;
  score_distribution: Array<{
    range: string;
    count: number;
  }>;
  conversion_metrics: {
    shortlist_rate: number;
    interview_conversion_rate: number;
    hire_conversion_rate: number;
    average_time_to_hire_days: number;
  };
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}
