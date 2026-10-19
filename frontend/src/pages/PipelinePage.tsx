import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Clock,
  History,
  AlertCircle
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { Modal } from '../components/Modal';
import { ScoreBadge } from '../components/ScoreBadge';
import { api } from '../services/api';
import type { Application, Job, ApplicationStage } from '../types';

const PIPELINE_COLUMNS: Array<{ stage: ApplicationStage; title: string }> = [
  { stage: 'APPLIED', title: 'Applied' },
  { stage: 'SCREENING', title: 'Screening' },
  { stage: 'SHORTLISTED', title: 'Shortlisted' },
  { stage: 'INTERVIEW', title: 'Interview' },
  { stage: 'OFFER', title: 'Offer' },
  { stage: 'HIRED', title: 'Hired' },
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
    <div className="flex-1 flex flex-col min-h-screen bg-[#000000] text-white">
      <Topbar
        title="Hiring Pipeline"
        subtitle="Visual Kanban stage workflow with persistent state tracking and history audit."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-mono hidden sm:inline uppercase">Position:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-xs py-1.5 px-3 rounded border border-white/20 bg-[#0d0d0d] text-white focus:outline-none focus:border-white font-mono"
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
      <div className="p-6 lg:p-8 flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-[1200px] h-[calc(100vh-10rem)]">
          {PIPELINE_COLUMNS.map((col, colIdx) => {
            const colApps = applications.filter((a) => a.stage === col.stage);

            return (
              <div
                key={col.stage}
                className="flex-1 flex flex-col rounded-[12px] border border-white/10 bg-white/[0.02] p-4 overflow-hidden"
              >
                {/* Monochrome Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <span className="text-xs font-semibold tracking-wider uppercase font-mono text-white">
                    {col.title}
                  </span>
                  <span className="flex h-5 px-1.5 items-center justify-center rounded bg-white/10 text-[10px] font-mono font-bold text-neutral-300">
                    {colApps.length}
                  </span>
                </div>

                {/* Off-White Candidate Cards Column */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-[10px] border border-black/5 bg-[#f5f5f5] text-[#1b1b1b] shadow-none hover:border-black/20 transition-all space-y-3 cursor-pointer group"
                      onClick={() => handleOpenDetails(app)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-[#1b1b1b] text-sm group-hover:text-[#2b7fff] transition-colors">
                            {app.candidate_name}
                          </h4>
                          <p className="text-[11px] text-neutral-500 line-clamp-1">{app.job_title}</p>
                        </div>
                        {app.match_score && (
                          <ScoreBadge score={app.match_score.overall_score} size="sm" />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-2 border-t border-black/10">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {new Date(app.applied_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>

                        {/* Stage Transition Quick Arrows */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {colIdx > 0 && (
                            <button
                              onClick={() => handleStageChange(app.id, PIPELINE_COLUMNS[colIdx - 1].stage)}
                              title={`Move back to ${PIPELINE_COLUMNS[colIdx - 1].title}`}
                              className="p-1 rounded bg-black/5 hover:bg-black/15 text-[#1b1b1b] transition-colors"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {colIdx < PIPELINE_COLUMNS.length - 1 && (
                            <button
                              onClick={() => handleStageChange(app.id, PIPELINE_COLUMNS[colIdx + 1].stage)}
                              title={`Advance to ${PIPELINE_COLUMNS[colIdx + 1].title}`}
                              className="p-1 rounded bg-[#1b1b1b] text-white hover:bg-black transition-colors"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="py-8 text-center text-xs text-neutral-500 font-mono border border-dashed border-white/10 rounded-lg">
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
            <div className="flex flex-wrap items-center justify-between p-4 rounded-lg bg-white border border-black/10 gap-4">
              <div>
                <span className="text-xs text-neutral-500 font-mono block">Current Stage</span>
                <span className="text-sm font-bold text-[#1b1b1b]">{selectedApp.stage}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 font-mono block">Applied On</span>
                <span className="text-xs font-semibold text-[#1b1b1b] font-mono">
                  {new Date(selectedApp.applied_at).toLocaleString()}
                </span>
              </div>
              {selectedApp.match_score && (
                <div>
                  <span className="text-xs text-neutral-500 font-mono block">AI Match Score</span>
                  <ScoreBadge score={selectedApp.match_score.overall_score} size="md" />
                </div>
              )}
            </div>

            {/* Score Explanation */}
            {selectedApp.match_score && (
              <div className="p-4 rounded-lg border border-black/10 bg-white text-xs space-y-1">
                <span className="font-bold text-[#1b1b1b] flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-[#2b7fff]" />
                  Score Rationale
                </span>
                <p className="text-neutral-600 leading-relaxed">
                  {selectedApp.match_score.score_explanation}
                </p>
              </div>
            )}

            {/* Stage Transition History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#1b1b1b] uppercase font-mono tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-neutral-700" />
                Stage Transition Audit Log
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selectedApp.stage_history?.map((hist: any) => (
                  <div key={hist.id} className="p-3 rounded-lg bg-white border border-black/10 text-xs flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-[#1b1b1b]">
                        {hist.from_stage} → <span className="text-[#2b7fff]">{hist.to_stage}</span>
                      </p>
                      <p className="text-neutral-500 text-[11px] mt-0.5">{hist.reason || 'Stage updated'}</p>
                    </div>
                    <div className="text-right text-[10px] text-neutral-500 font-mono">
                      <p className="font-medium text-[#1b1b1b]">{hist.changed_by_name || 'System'}</p>
                      <p>{new Date(hist.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast Stage Transition Actions */}
            <div className="pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-neutral-600 font-mono">Transition stage:</span>
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
                        ? 'bg-black text-white opacity-50 cursor-not-allowed'
                        : 'air-button-light'
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
