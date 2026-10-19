import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  Sparkles,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Sliders,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Topbar } from '../components/Topbar';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import type { Job, JobStatus, EmploymentType } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchParams] = useSearchParams();
  const { hasRole } = useAuth();

  // Create/Edit Form State
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    required_skills: [] as string[],
    preferred_skills: [] as string[],
    min_experience_years: 3,
    location: '',
    employment_type: 'FULL_TIME' as EmploymentType,
    status: 'ACTIVE' as JobStatus,
    matching_weights: {
      required_skills: 0.40,
      semantic_similarity: 0.30,
      preferred_skills: 0.15,
      experience_alignment: 0.15
    }
  });

  const [reqSkillInput, setReqSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const res = await api.jobs.list({
        search: search || undefined,
        department: deptFilter || undefined
      });
      setJobs(res.items);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, deptFilter]);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const handleOpenCreate = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      department: 'Engineering',
      description: '',
      required_skills: ['Python', 'React'],
      preferred_skills: ['Docker'],
      min_experience_years: 3,
      location: 'Remote',
      employment_type: 'FULL_TIME',
      status: 'ACTIVE',
      matching_weights: {
        required_skills: 0.40,
        semantic_similarity: 0.30,
        preferred_skills: 0.15,
        experience_alignment: 0.15
      }
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      description: job.description,
      required_skills: job.required_skills || [],
      preferred_skills: job.preferred_skills || [],
      min_experience_years: job.min_experience_years,
      location: job.location,
      employment_type: job.employment_type,
      status: job.status,
      matching_weights: (job.matching_weights as any) || {
        required_skills: 0.40,
        semantic_similarity: 0.30,
        preferred_skills: 0.15,
        experience_alignment: 0.15
      }
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (editingJob) {
        await api.jobs.update(editingJob.id, formData);
      } else {
        await api.jobs.create(formData);
      }
      setIsCreateModalOpen(false);
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save job opening.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job opening? This will remove associated applications.')) {
      try {
        await api.jobs.delete(id);
        fetchJobs();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete job.');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar
        title="Job Openings"
        subtitle="Manage job requisitions, requirements, and candidate ranking profiles."
        actions={
          hasRole(['ADMIN', 'RECRUITER']) && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Position</span>
            </button>
          )
        }
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, description, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="AI Research">AI Research</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Product">Product</option>
            </select>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {job.department}
                    </span>
                    <h3 className="text-base font-bold text-foreground hover:text-primary transition-colors">
                      <Link to={`/jobs/${job.id}/rankings`}>{job.title}</Link>
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full border ${
                      job.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-slate-500/10 text-slate-600 border-slate-500/30'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Meta Tags */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    {job.employment_type.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                    {job.min_experience_years}+ yrs
                  </span>
                </div>

                {/* Required Skills Badges */}
                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Required Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {job.required_skills?.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-foreground border border-border"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{job.candidates_count || 0} Applicants</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/jobs/${job.id}/rankings`}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Rankings</span>
                  </Link>

                  {hasRole(['ADMIN', 'RECRUITER']) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(job)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Edit Job"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && !isLoading && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border p-8 space-y-3">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto" />
            <h4 className="text-base font-semibold text-foreground">No job openings found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create your first job requisition to start matching candidates with AI recommendations.
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Job Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingJob ? 'Edit Job Requisition' : 'Create Job Opening'}
        subtitle="Define role requirements and customize the explainable AI candidate ranking criteria."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveJob} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 text-rose-500 text-xs border border-rose-500/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Job Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. Senior Machine Learning Engineer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. Engineering"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. San Francisco, CA (Remote)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Employment Type</label>
              <select
                value={formData.employment_type}
                onChange={e => setFormData({ ...formData, employment_type: e.target.value as EmploymentType })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              >
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Job Description *</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Detail responsibilities, mission, and day-to-day requirements..."
            />
          </div>

          {/* Required Skills Tag Input */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Mandatory Required Skills (40% default match weight)
            </label>
            <div className="flex flex-wrap gap-1 p-2 rounded-lg border border-border bg-secondary/20 mb-2">
              {formData.required_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      required_skills: formData.required_skills.filter(s => s !== skill)
                    })}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={reqSkillInput}
                onChange={e => setReqSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (reqSkillInput.trim()) {
                      setFormData({
                        ...formData,
                        required_skills: [...formData.required_skills, reqSkillInput.trim()]
                      });
                      setReqSkillInput('');
                    }
                  }
                }}
                placeholder="Type skill & press Enter (e.g. Python, React, PostgreSQL)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
              />
            </div>
          </div>

          {/* Preferred Skills Tag Input */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Preferred / Bonus Skills (15% default match weight)
            </label>
            <div className="flex flex-wrap gap-1 p-2 rounded-lg border border-border bg-secondary/20 mb-2">
              {formData.preferred_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      preferred_skills: formData.preferred_skills.filter(s => s !== skill)
                    })}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={prefSkillInput}
                onChange={e => setPrefSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (prefSkillInput.trim()) {
                      setFormData({
                        ...formData,
                        preferred_skills: [...formData.preferred_skills, prefSkillInput.trim()]
                      });
                      setPrefSkillInput('');
                    }
                  }
                }}
                placeholder="Type bonus skill & press Enter (e.g. Docker, AWS, Redis)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Min Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.min_experience_years}
                onChange={e => setFormData({ ...formData, min_experience_years: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as JobStatus })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background text-foreground"
              >
                <option value="ACTIVE">Active (Accepting)</option>
                <option value="DRAFT">Draft</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* AI Matching Weights Config */}
          <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Sliders className="w-4 h-4 text-primary" />
              <span>AI Candidate Matching Weights</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div>
                <label className="block text-[10px]">Required Skills</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={formData.matching_weights.required_skills}
                  onChange={e => setFormData({
                    ...formData,
                    matching_weights: { ...formData.matching_weights, required_skills: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 text-xs rounded border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-[10px]">Semantic Text</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={formData.matching_weights.semantic_similarity}
                  onChange={e => setFormData({
                    ...formData,
                    matching_weights: { ...formData.matching_weights, semantic_similarity: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 text-xs rounded border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-[10px]">Preferred Skills</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={formData.matching_weights.preferred_skills}
                  onChange={e => setFormData({
                    ...formData,
                    matching_weights: { ...formData.matching_weights, preferred_skills: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 text-xs rounded border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-[10px]">Experience</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={formData.matching_weights.experience_alignment}
                  onChange={e => setFormData({
                    ...formData,
                    matching_weights: { ...formData.matching_weights, experience_alignment: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 text-xs rounded border border-input bg-background"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{editingJob ? 'Update Job' : 'Publish Opening'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
