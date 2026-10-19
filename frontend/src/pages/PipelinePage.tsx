import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  Filter,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { Modal } from '../components/Modal';
import { ScoreBadge } from '../components/ScoreBadge';
import { api } from '../services/api';
import type { Application, Job, ApplicationStage } from '../types';

const PIPELINE_COLUMNS: Array<{ stage: ApplicationStage; title: string; color: string }> = [
  { stage: 'APPLIED', title: 'Applied', color: 'border-indigo-500/50' },
  { stage: 'SCREENING', title: 'Screening', color: 'border-purple-500/50' },
  { stage: 'SHORTLISTED', title: 'Shortlisted', color: 'border-cyan-500/50' },
  { stage: 'INTERVIEW', title: 'Interview', color: 'border-amber-500/50' },
  { stage: 'OFFER', title: 'Offer', color: 'border-emerald-500/50' },
  { stage: 'HIRED', title: 'Hired', color: 'border-green-500/50' },
];

export const PipelinePage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchPipeline = async () => {
    try {
      setIsLoading(true);
      const [appList, jobList] = await Promise.all([
        api.applications.list(selectedJobId ? { job_id: selectedJobId } : undefined),
        api.jobs.list({ status: 'ACTIVE' })
      ]);
      setApplications(appList);
      setJobs(jobList.items);
    } catch (err) {
      console.error('Failed to load pipeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [selectedJobId]);

  const handleStageChange = async (appId: string, newStage: ApplicationStage) => {
    try {
      // Optimistic update
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, stage: newStage } : a)
      );

      await api.applications.updateStage(appId, {
        stage: newStage,
        reason: `Moved via Kanban Pipeline to ${newStage}`
      });
      fetchPipeline();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update candidate stage');
      fetchPipeline();
    }
  };

  const handleOpenDetails = async (app: Application) => {
    try {
      const fullApp = await api.applications.get(app.id);
      setSelectedApp(fullApp);
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Failed to load application history:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar
        title="Hiring Pipeline"
        subtitle="Visual Kanban stage workflow with persistent state tracking and history audit."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Job Filter:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            >
              <option value="">All Job Positions</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Kanban Board Container */}
      <div className="p-8 flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-[1200px] h-[calc(100vh-10rem)]">
          {PIPELINE_COLUMNS.map((col, colIdx) => {
            const colApps = applications.filter((a) => a.stage === col.stage);

            return (
              <div
                key={col.stage}
                className="flex-1 flex flex-col rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-4 overflow-hidden"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-3 mb-3 border-b-2 ${col.color}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{col.title}</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[11px] font-mono font-bold text-muted-foreground">
                      {colApps.length}
                    </span>
                  </div>
                </div>

                {/* Candidate Cards Column */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 hover:shadow-md transition-all space-y-3 cursor-pointer group"
                      onClick={() => handleOpenDetails(app)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                            {app.candidate_name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{app.job_title}</p>
                        </div>
                        {app.match_score && (
                          <ScoreBadge score={app.match_score.overall_score} size="sm" />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(app.applied_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>

                        {/* Stage Transition Quick Arrows */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {colIdx > 0 && (
                            <button
                              onClick={() => handleStageChange(app.id, PIPELINE_COLUMNS[colIdx - 1].stage)}
                              title={`Move back to ${PIPELINE_COLUMNS[colIdx - 1].title}`}
                              className="p-1 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {colIdx < PIPELINE_COLUMNS.length - 1 && (
                            <button
                              onClick={() => handleStageChange(app.id, PIPELINE_COLUMNS[colIdx + 1].stage)}
                              title={`Advance to ${PIPELINE_COLUMNS[colIdx + 1].title}`}
                              className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground/60 border border-dashed border-border/50 rounded-xl">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Application & History Modal */}
      {selectedApp && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedApp.candidate_name || 'Application Details'}
          subtitle={`Position: ${selectedApp.job_title} (${selectedApp.job_department})`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">Current Stage</span>
                <span className="text-sm font-bold text-foreground">{selectedApp.stage}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Applied On</span>
                <span className="text-xs font-semibold text-foreground font-mono">
                  {new Date(selectedApp.applied_at).toLocaleString()}
                </span>
              </div>
              {selectedApp.match_score && (
                <div>
                  <span className="text-xs text-muted-foreground block">AI Match Score</span>
                  <ScoreBadge score={selectedApp.match_score.overall_score} size="md" />
                </div>
              )}
            </div>

            {/* Score Explanation */}
            {selectedApp.match_score && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs space-y-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Score Rationale
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedApp.match_score.score_explanation}
                </p>
              </div>
            )}

            {/* Stage Transition History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-primary" />
                Stage Transition Audit Log
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selectedApp.stage_history?.map((hist: any) => (
                  <div key={hist.id} className="p-3 rounded-lg bg-secondary/30 border border-border text-xs flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {hist.from_stage} → <span className="text-primary">{hist.to_stage}</span>
                      </p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">{hist.reason || 'Stage updated'}</p>
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground">
                      <p className="font-medium text-foreground">{hist.changed_by_name || 'System'}</p>
                      <p>{new Date(hist.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast Stage Transition Actions */}
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">Transition stage to:</span>
              <div className="flex flex-wrap gap-1.5">
                {PIPELINE_COLUMNS.map((col) => (
                  <button
                    key={col.stage}
                    disabled={selectedApp.stage === col.stage}
                    onClick={() => {
                      handleStageChange(selectedApp.id, col.stage);
                      setIsDetailOpen(false);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      selectedApp.stage === col.stage
                        ? 'bg-primary text-primary-foreground opacity-50 cursor-not-allowed'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                    }`}
                  >
                    {col.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
