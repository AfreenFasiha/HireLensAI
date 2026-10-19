import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  ChevronDown,
  ChevronUp
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
    <div className="flex-1 flex flex-col min-h-screen bg-[#000000] text-white">
      <Topbar
        title={job ? `${job.title} — Candidate Rankings` : 'Candidate Rankings'}
        subtitle="Ranked applicant assessment powered by explainable multi-factor AI matching."
        actions={
          <Link
            to="/jobs"
            className="air-button-ghost text-xs px-3.5 py-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Jobs</span>
          </Link>
        }
      />

      <div className="p-6 lg:p-8 space-y-8 flex-1 max-w-[1150px] w-full mx-auto">
        {/* Ethical AI Notice Banner */}
        <div className="air-card flex items-start gap-4 bg-gradient-to-r from-[#f0f9ff]/90 via-white to-[#f5f3ff]/90 border-t-white border-[#e0e7ff]">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#e0f2fe] to-[#ede9fe] text-[#0369a1] mt-0.5 shrink-0 border border-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <Sparkles className="w-5 h-5 text-[#0284c7]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1b1b1b] font-mono uppercase tracking-wider flex items-center gap-2">
              <span>Human-in-the-Loop Decision Support Notice</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
                Explainable AI
              </span>
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {rankings?.advisory_notice ||
                'AI match scores evaluate technical skill coverage, resume semantic similarity, and experience alignment. Recommendations serve as advisory decision support and must never automatically reject candidates or make autonomous hiring determinations.'}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] gap-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-mono uppercase text-neutral-300">Filter Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-white/20 bg-[#0d0d0d] text-white focus:outline-none focus:border-white font-mono"
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

          <span className="text-xs text-neutral-400 font-mono">
            Total Ranked Applicants: <strong className="text-white">{rankings?.total_candidates || 0}</strong>
          </span>
        </div>

        {/* Ranked Candidates List (Light candidate comparison cards) */}
        <div className="space-y-4">
          {rankings?.ranked_candidates.map((cand, index) => {
            const isExpanded = expandedId === cand.application_id;

            return (
              <div
                key={cand.application_id}
                className={`air-card transition-all ${
                  isExpanded ? 'ring-2 ring-[#38bdf8]/50 shadow-[0_8px_30px_rgba(56,189,248,0.15)]' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Rank & Candidate Details */}
                  <div className="flex items-center gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white to-neutral-100 font-mono font-bold text-sm text-[#1b1b1b] border-t border-t-white border-black/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.06)]">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <Link
                          to="/candidates"
                          className="font-bold text-base text-[#1b1b1b] hover:text-[#0284c7] transition-colors"
                        >
                          {cand.candidate_name}
                        </Link>
                        <StageBadge stage={cand.stage} />
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 font-mono">
                        {cand.candidate_title || 'Software Professional'} • {cand.candidate_experience} yrs exp • {cand.candidate_email}
                      </p>
                    </div>
                  </div>

                  {/* Right: Match Score & Actions */}
                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="flex flex-col items-end">
                      <ScoreBadge score={cand.overall_score} size="md" />
                      <span className="text-[10px] text-neutral-500 mt-1 font-mono uppercase">Overall Match</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {cand.stage !== 'SHORTLISTED' && cand.stage !== 'OFFER' && cand.stage !== 'HIRED' && (
                        <button
                          onClick={() => handleAdvanceStage(cand.application_id, 'SHORTLISTED' as ApplicationStage)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#1b1b1b] to-black text-white hover:opacity-90 font-medium text-xs flex items-center gap-1 transition-all border-t border-t-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_6px_rgba(0,0,0,0.3)]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Shortlist</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : cand.application_id)}
                        className="air-button-light text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide' : 'Breakdown'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Bars (Pastel progress indicators) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-black/10">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-500">Required (40%)</span>
                      <span className="font-bold text-[#15803d]">{cand.required_skills_score}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-200/80 rounded-full overflow-hidden shadow-inner p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-[#86efac] to-[#15803d] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.35)] transition-all duration-500"
                        style={{ width: `${Math.min(cand.required_skills_score, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-500">Semantic (30%)</span>
                      <span className="font-bold text-[#0369a1]">{cand.semantic_similarity_score}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-200/80 rounded-full overflow-hidden shadow-inner p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-[#7dd3fc] to-[#0284c7] rounded-full shadow-[0_0_8px_rgba(56,189,248,0.35)] transition-all duration-500"
                        style={{ width: `${Math.min(cand.semantic_similarity_score, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-500">Preferred (15%)</span>
                      <span className="font-bold text-[#6d28d9]">{cand.preferred_skills_score}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-200/80 rounded-full overflow-hidden shadow-inner p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-[#c4b5fd] to-[#7c3aed] rounded-full shadow-[0_0_8px_rgba(139,92,246,0.35)] transition-all duration-500"
                        style={{ width: `${Math.min(cand.preferred_skills_score, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-500">Experience (15%)</span>
                      <span className="font-bold text-[#c2410c]">{cand.experience_alignment_score}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-200/80 rounded-full overflow-hidden shadow-inner p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-[#fdba74] to-[#ea580c] rounded-full shadow-[0_0_8px_rgba(249,115,22,0.35)] transition-all duration-500"
                        style={{ width: `${Math.min(cand.experience_alignment_score, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-black/10 space-y-4">
                    {/* Natural Language Explanation */}
                    <div className="p-3.5 rounded-lg bg-white border border-black/10 text-xs space-y-1">
                      <span className="font-bold text-[#1b1b1b] flex items-center gap-1.5 font-mono uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#2b7fff]" />
                        Score Rationale
                      </span>
                      <p className="text-neutral-600 leading-relaxed">{cand.score_explanation}</p>
                    </div>

                    {/* Matched vs Missing Skills Grid (Glossy pastel skill tags) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl border-t border-t-white border-black/10 bg-gradient-to-b from-white to-[#fbfbfa] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.04)] space-y-2">
                        <span className="text-xs font-bold text-[#15803d] flex items-center gap-1.5 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d]" />
                          Matched Required Skills ({cand.matched_required_skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cand.matched_required_skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.04)]"
                            >
                              {s}
                            </span>
                          ))}
                          {cand.matched_required_skills.length === 0 && (
                            <span className="text-xs text-neutral-500 italic">None identified</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border-t border-t-white border-black/10 bg-gradient-to-b from-white to-[#fbfbfa] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.04)] space-y-2">
                        <span className="text-xs font-bold text-[#be123c] flex items-center gap-1.5 font-mono">
                          <XCircle className="w-3.5 h-3.5 text-[#be123c]" />
                          Missing Required Skills ({cand.missing_required_skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cand.missing_required_skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#ffe4e6] text-[#be123c] border border-[#fecdd3] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                            >
                              {s}
                            </span>
                          ))}
                          {cand.missing_required_skills.length === 0 && (
                            <span className="text-xs text-[#15803d] font-medium flex items-center gap-1">
                              ✓ All mandatory requirements fulfilled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {cand.matched_preferred_skills.length > 0 && (
                      <div className="p-3.5 rounded-xl border-t border-t-white border-black/10 bg-gradient-to-b from-white to-[#fbfbfa] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.04)] space-y-2">
                        <span className="text-xs font-bold text-[#6d28d9] font-mono flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#7c3aed]" />
                          Preferred Skills Coverage ({cand.matched_preferred_skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cand.matched_preferred_skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#ede9fe] text-[#6d28d9] border border-[#ddd6fe] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.04)]"
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
            <div className="py-16 text-center rounded-xl border border-dashed border-white/15 p-8 space-y-3">
              <Sparkles className="w-8 h-8 text-neutral-500 mx-auto" />
              <h4 className="text-base font-semibold text-white">No applicants found for this position</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Upload resumes or associate candidate applications to generate AI ranking evaluations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
