import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  User,
  Star,
  Loader2
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import type { Interview, Application, User as AppUser, RecommendationType } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const InterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Schedule Modal
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [formData, setFormData] = useState({
    application_id: '',
    interviewer_id: '',
    title: '',
    interview_type: 'ONLINE',
    scheduled_start: '',
    scheduled_end: '',
    timezone: 'UTC',
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    location: ''
  });
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback Modal
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<Interview | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    recommendation: 'YES' as RecommendationType,
    technical_skills_feedback: '',
    communication_feedback: '',
    general_notes: ''
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const { hasRole } = useAuth();

  const fetchInterviewsData = async () => {
    try {
      setIsLoading(true);
      const [ivs, apps, teamUsers] = await Promise.all([
        api.interviews.list(),
        api.applications.list(),
        api.admin.listUsers().catch(() => [])
      ]);
      setInterviews(ivs);
      setApplications(apps);
      setUsers(teamUsers);

      if (apps.length > 0 && !formData.application_id) {
        setFormData(prev => ({
          ...prev,
          application_id: apps[0].id,
          title: `Technical Round: ${apps[0].candidate_name}`
        }));
      }
    } catch (err) {
      console.error('Failed to load interviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewsData();
  }, []);

  const handleOpenSchedule = () => {
    const start = new Date(Date.now() + 86400000);
    start.setHours(14, 0, 0, 0);
    const end = new Date(start.getTime() + 45 * 60000);

    const defaultApp = applications[0];
    setFormData({
      application_id: defaultApp?.id || '',
      interviewer_id: users[0]?.id || '',
      title: defaultApp ? `Technical Interview: ${defaultApp.candidate_name}` : 'Technical Interview',
      interview_type: 'ONLINE',
      scheduled_start: start.toISOString().slice(0, 16),
      scheduled_end: end.toISOString().slice(0, 16),
      timezone: 'UTC',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      location: ''
    });
    setScheduleError(null);
    setIsScheduleOpen(true);
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setScheduleError(null);

    try {
      await api.interviews.create({
        ...formData,
        scheduled_start: new Date(formData.scheduled_start).toISOString(),
        scheduled_end: new Date(formData.scheduled_end).toISOString(),
        interviewer_id: formData.interviewer_id || undefined
      });
      setIsScheduleOpen(false);
      fetchInterviewsData();
    } catch (err: any) {
      setScheduleError(err.response?.data?.detail || 'Failed to schedule interview. Check for calendar conflicts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInterview = async (id: string) => {
    if (confirm('Cancel this scheduled interview session?')) {
      try {
        await api.interviews.delete(id);
        fetchInterviewsData();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to cancel interview');
      }
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterviewForFeedback) return;
    setIsSubmittingFeedback(true);

    try {
      await api.interviews.submitFeedback(selectedInterviewForFeedback.id, feedbackData);
      setSelectedInterviewForFeedback(null);
      fetchInterviewsData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit interview feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#000000] text-white">
      <Topbar
        title="Interview Coordination"
        subtitle="Conflict-free calendar synchronization, meeting coordinates, and interviewer scorecards."
        actions={
          hasRole(['ADMIN', 'RECRUITER']) && (
            <button
              onClick={handleOpenSchedule}
              className="air-button-solid-white text-xs px-3.5 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Interview</span>
            </button>
          )
        }
      />

      <div className="p-6 lg:p-8 space-y-8 flex-1 max-w-[1150px] w-full mx-auto">
        {/* Interviews List in Air Cards */}
        <div className="space-y-4">
          {interviews.map((iv) => {
            const isCompleted = iv.status === 'COMPLETED';
            const isCancelled = iv.status === 'CANCELLED';

            return (
              <div
                key={iv.id}
                className="air-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left: Interview Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-[#1b1b1b]">{iv.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${
                        iv.status === 'SCHEDULED'
                          ? 'bg-black/5 text-[#1b1b1b] border-black/10'
                          : iv.status === 'COMPLETED'
                          ? 'bg-black text-white border-black'
                          : 'bg-black/5 text-neutral-400 border-black/10 line-through'
                      }`}
                    >
                      {iv.status}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-black/5 text-[#1b1b1b] border border-black/10">
                      {iv.interview_type}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-neutral-600 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-700" />
                      {new Date(iv.scheduled_start).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' '}-{' '}
                      {new Date(iv.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-neutral-700" />
                      Interviewer: <strong className="text-[#1b1b1b]">{iv.interviewer_name || 'Assigned Lead'}</strong>
                    </span>

                    <span>Candidate: <strong className="text-[#1b1b1b]">{iv.candidate_name}</strong></span>
                  </div>

                  {iv.meeting_link && !isCancelled && (
                    <div className="pt-1">
                      <a
                        href={iv.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#2b7fff] font-mono font-semibold hover:underline"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Open Video Conference Coordinates</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Feedback Summary if available */}
                  {iv.feedbacks && iv.feedbacks.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-lg bg-white border border-black/10 text-xs space-y-1 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1b1b1b] flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-neutral-800 fill-neutral-800" />
                          Feedback by {iv.feedbacks[0].reviewer_name} (Rating: {iv.feedbacks[0].rating}/5)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/5 text-[#1b1b1b]">
                          {iv.feedbacks[0].recommendation}
                        </span>
                      </div>
                      <p className="text-neutral-600 text-[11px] font-sans">{iv.feedbacks[0].technical_skills_feedback}</p>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {!isCompleted && !isCancelled && (
                    <>
                      <button
                        onClick={() => setSelectedInterviewForFeedback(iv)}
                        className="air-button-light text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Scorecard</span>
                      </button>

                      <button
                        onClick={() => handleCancelInterview(iv.id)}
                        className="air-button-light text-xs py-1.5 px-3 text-neutral-500 hover:text-black"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {interviews.length === 0 && !isLoading && (
            <div className="py-16 text-center rounded-xl border border-dashed border-white/15 p-8 space-y-3">
              <CalendarIcon className="w-8 h-8 text-neutral-500 mx-auto" />
              <h4 className="text-base font-semibold text-white">No interviews scheduled yet</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Schedule your first interview with conflict checking and structured feedback scorecards.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Interview Session"
        subtitle="Validate interviewer conflict calendars, select type, and provide conference coordinates."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateInterview} className="space-y-4">
          {scheduleError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{scheduleError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Target Application / Candidate *</label>
            <select
              required
              value={formData.application_id}
              onChange={(e) => {
                const appId = e.target.value;
                const chosen = applications.find(a => a.id === appId);
                setFormData({
                  ...formData,
                  application_id: appId,
                  title: chosen ? `Technical Interview: ${chosen.candidate_name}` : formData.title
                });
              }}
              className="air-input text-xs"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.candidate_name} — {app.job_title} ({app.stage})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Interview Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="air-input text-xs"
              placeholder="e.g. Systems Architecture Deep Dive"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Assigned Interviewer</label>
              <select
                value={formData.interviewer_id}
                onChange={e => setFormData({ ...formData, interviewer_id: e.target.value })}
                className="air-input text-xs"
              >
                <option value="">Current User (Me)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Interview Format</label>
              <select
                value={formData.interview_type}
                onChange={e => setFormData({ ...formData, interview_type: e.target.value })}
                className="air-input text-xs"
              >
                <option value="ONLINE">Online Video</option>
                <option value="PHONE">Phone Screen</option>
                <option value="IN_PERSON">In-Person</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.scheduled_start}
                onChange={e => setFormData({ ...formData, scheduled_start: e.target.value })}
                className="air-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">End Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.scheduled_end}
                onChange={e => setFormData({ ...formData, scheduled_end: e.target.value })}
                className="air-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Meeting Link or Location</label>
            <input
              type="text"
              value={formData.meeting_link}
              onChange={e => setFormData({ ...formData, meeting_link: e.target.value })}
              className="air-input text-xs"
              placeholder="https://meet.google.com/xyz-abcd-efg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button
              type="button"
              onClick={() => setIsScheduleOpen(false)}
              className="air-button-light text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1b1b1b] text-white hover:bg-black rounded-lg px-4 py-2 font-medium flex items-center gap-1.5 disabled:opacity-50 text-xs"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarIcon className="w-3.5 h-3.5" />}
              <span>Confirm & Schedule</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Structured Feedback Modal */}
      {selectedInterviewForFeedback && (
        <Modal
          isOpen={!!selectedInterviewForFeedback}
          onClose={() => setSelectedInterviewForFeedback(null)}
          title="Interview Evaluation Scorecard"
          subtitle={`Candidate: ${selectedInterviewForFeedback.candidate_name} • ${selectedInterviewForFeedback.title}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Overall Rating (1 - 5 Stars) *</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= feedbackData.rating ? 'text-[#1b1b1b] fill-[#1b1b1b]' : 'text-neutral-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-mono font-bold text-[#1b1b1b] ml-2">{feedbackData.rating} / 5</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Hiring Recommendation *</label>
              <select
                value={feedbackData.recommendation}
                onChange={(e) => setFeedbackData({ ...feedbackData, recommendation: e.target.value as RecommendationType })}
                className="air-input text-xs"
              >
                <option value="STRONG_YES">Strong Yes (Exceptional candidate)</option>
                <option value="YES">Yes (Recommend to advance)</option>
                <option value="NEUTRAL">Neutral (Need second opinion)</option>
                <option value="NO">No (Does not meet bar)</option>
                <option value="STRONG_NO">Strong No (Definite pass)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Technical Skills & System Design</label>
              <textarea
                rows={3}
                value={feedbackData.technical_skills_feedback}
                onChange={(e) => setFeedbackData({ ...feedbackData, technical_skills_feedback: e.target.value })}
                className="air-input text-xs"
                placeholder="Assess problem solving, coding fundamentals, and architecture..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Communication & Team Alignment</label>
              <textarea
                rows={2}
                value={feedbackData.communication_feedback}
                onChange={(e) => setFeedbackData({ ...feedbackData, communication_feedback: e.target.value })}
                className="air-input text-xs"
                placeholder="Assess clarity, active listening, and collaboration..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
              <button
                type="button"
                onClick={() => setSelectedInterviewForFeedback(null)}
                className="air-button-light text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="bg-[#1b1b1b] text-white hover:bg-black rounded-lg px-4 py-2 font-medium flex items-center gap-1.5 disabled:opacity-50 text-xs"
              >
                {isSubmittingFeedback ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Save Evaluation</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
