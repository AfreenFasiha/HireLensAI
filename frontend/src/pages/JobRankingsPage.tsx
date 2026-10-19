import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Sliders,
  ChevronRight,
  Filter,
  Check,
  Calendar
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { ScoreBadge } from '../components/ScoreBadge';
import { StageBadge } from '../components/StageBadge';
import { api } from '../services/api';
import type { JobRankingResponse, Job, ApplicationStage } from '../types';

export const JobRankingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [rankings, setRankings] = useState<JobRankingResponse | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRankings = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [jobData, rankingsData] = await Promise.all([
        api.jobs.get(id),
        api.ai.getJobRankings(id, stageFilter || undefined)
      ]);
      setJob(jobData);
      setRankings(rankingsData);
    } catch (err) {
      console.error('Failed to load job rankings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [id, stageFilter]);

  const handleAdvanceStage = async (appId: string, targetStage: ApplicationStage) => {
    try {
      await api.applications.updateStage(appId, {
        stage: targetStage,
        reason: `Advanced via Candidate Rankings table`
      });
      fetchRankings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update stage');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar
        title={job ? `${job.title} — Candidate Rankings` : 'Candidate Rankings'}
        subtitle="Ranked applicant assessment powered by explainable multi-factor AI matching."
        actions={
          <Link
            to="/jobs"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-secondary flex items-center gap-1.5 text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Jobs</span>
          </Link>
        }
      />

      <div className="p-8 space-y-6 flex-1 max-w-6xl w-full mx-auto">
        {/* Ethical AI Notice Banner */}
        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-start gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Human-in-the-Loop Decision Support Notice</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {rankings?.advisory_notice ||
                'AI match scores evaluate technical skill coverage, resume semantic similarity, and experience alignment. Recommendations serve as advisory decision support and must never automatically reject candidates or make autonomous hiring determinations.'}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Filter by Pipeline Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            >
              <option value="">All Stages</option>
              <option value="APPLIED">Applied</option>
              <option value="SCREENING">Screening</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            Total Ranked Applicants: <strong>{rankings?.total_candidates || 0}</strong>
          </span>
        </div>

        {/* Ranked Candidates List */}
        <div className="space-y-4">
          {rankings?.ranked_candidates.map((cand, index) => {
            const isExpanded = expandedId === cand.application_id;

            return (
              <div
                key={cand.application_id}
                className={`rounded-2xl border bg-card p-6 shadow-sm transition-all ${
                  isExpanded ? 'border-primary/50 shadow-md ring-1 ring-primary/20' : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Rank & Candidate Details */}
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary font-mono font-bold text-sm text-muted-foreground border border-border">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/candidates`}
                          className="font-bold text-base text-foreground hover:text-primary transition-colors"
                        >
                          {cand.candidate_name}
                        </Link>
                        <StageBadge stage={cand.stage} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cand.candidate_title || 'Software Professional'} • {cand.candidate_experience} yrs experience • {cand.candidate_email}
                      </p>
                    </div>
                  </div>

                  {/* Right: Match Score & Actions */}
                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="flex flex-col items-end">
                      <ScoreBadge score={cand.overall_score} size="md" />
                      <span className="text-[10px] text-muted-foreground mt-1">Composite Match</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {cand.stage !== 'SHORTLISTED' && cand.stage !== 'OFFER' && cand.stage !== 'HIRED' && (
                        <button
                          onClick={() => handleAdvanceStage(cand.application_id, 'SHORTLISTED' as ApplicationStage)}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Shortlist</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : cand.application_id)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-foreground hover:bg-secondary font-medium text-xs transition-colors"
                      >
                        {isExpanded ? 'Hide Details' : 'View Breakdown'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Required Skills (40%)</span>
                      <span className="font-mono font-semibold text-foreground">{cand.required_skills_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(cand.required_skills_score, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Semantic Text (30%)</span>
                      <span className="font-mono font-semibold text-foreground">{cand.semantic_similarity_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(cand.semantic_similarity_score, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Preferred Skills (15%)</span>
                      <span className="font-mono font-semibold text-foreground">{cand.preferred_skills_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${Math.min(cand.preferred_skills_score, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Experience (15%)</span>
                      <span className="font-mono font-semibold text-foreground">{cand.experience_alignment_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${Math.min(cand.experience_alignment_score, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in duration-200">
                    {/* Natural Language Explanation */}
                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border text-xs space-y-1">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        AI Score Justification
                      </span>
                      <p className="text-muted-foreground leading-relaxed">{cand.score_explanation}</p>
                    </div>

                    {/* Matched vs Missing Skills Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Matched Required Skills ({cand.matched_required_skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {cand.matched_required_skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            >
                              {s}
                            </span>
                          ))}
                          {cand.matched_required_skills.length === 0 && (
                            <span className="text-xs text-muted-foreground italic">None identified</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          Missing Required Skills ({cand.missing_required_skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {cand.missing_required_skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            >
                              {s}
                            </span>
                          ))}
                          {cand.missing_required_skills.length === 0 && (
                            <span className="text-xs text-emerald-600 font-medium">All mandatory requirements fulfilled!</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {cand.matched_preferred_skills.length > 0 && (
                      <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-2">
                        <span className="text-xs font-semibold text-cyan-500">
                          Bonus Preferred Skills Provided ({cand.matched_preferred_skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {cand.matched_preferred_skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {rankings?.ranked_candidates.length === 0 && !isLoading && (
            <div className="py-16 text-center rounded-2xl border border-dashed border-border p-8 space-y-3">
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
              <h4 className="text-base font-semibold text-foreground">No applicants found for this position</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Upload resumes or associate candidate applications to generate AI ranking evaluations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
