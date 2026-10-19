import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Clock,
  Users,
  Sparkles,
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
    setError(null);
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
    setError(null);
    setIsCreateModalOpen(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this job opening? Associated candidates and applications will be impacted.')) {
      try {
        await api.jobs.delete(jobId);
        fetchJobs();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete job opening');
      }
    }
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingJob) {
        await api.jobs.update(editingJob.id, formData);
      } else {
        await api.jobs.create(formData);
      }
      setIsCreateModalOpen(false);
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save job opening');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#000000] text-white">
      <Topbar
        title="Job Management"
        subtitle="Manage open requisitions, define skill requirements, and calibrate AI weights."
        actions={
          hasRole(['ADMIN', 'RECRUITER']) && (
            <button
              onClick={handleOpenCreate}
              className="air-button-solid-white text-xs px-3.5 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Job</span>
            </button>
          )
        }
      />

      <div className="p-6 lg:p-8 space-y-8 flex-1 max-w-[1150px] w-full mx-auto">
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 rounded-lg border border-white/10 bg-white/[0.03]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by title or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-white/20 bg-[#0d0d0d] text-white focus:outline-none focus:border-white font-mono"
            >
            </input>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-neutral-400 font-mono uppercase">Department:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded border border-white/20 bg-[#0d0d0d] text-white focus:outline-none focus:border-white font-mono"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="AI Research">AI Research</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Product">Product</option>
            </select>
          </div>
        </div>

        {/* Jobs Grid (air-card off-white containers) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="air-card flex flex-col justify-between space-y-4 hover:opacity-95 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#0369a1] bg-[#e0f2fe] border border-[#bae6fd] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] font-mono">
                      {job.department}
                    </span>
                    <h3 className="text-base font-bold text-[#1b1b1b] hover:text-[#0284c7] transition-colors mt-1.5">
                      <Link to={`/jobs/${job.id}/rankings`}>{job.title}</Link>
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-mono uppercase rounded-full border font-medium ${
                      job.status === 'ACTIVE'
                        ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
                        : 'bg-black/5 text-neutral-400 border-black/10'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Meta Tags */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-neutral-500 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-700" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-700" />
                    {job.employment_type.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-neutral-700" />
                    {job.min_experience_years}+ yrs
                  </span>
                </div>

                {/* Required Skills Badges */}
                <div className="pt-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1.5">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.required_skills?.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(0,0,0,0.03)]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-black/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-mono">
                  <Users className="w-3.5 h-3.5 text-neutral-800" />
                  <span>{job.candidates_count || 0} Applicants</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/jobs/${job.id}/rankings`}
                    className="air-button-light text-xs py-1 px-2.5 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-[#2b7fff]" />
                    <span>Rankings</span>
                  </Link>

                  {hasRole(['ADMIN', 'RECRUITER']) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(job)}
                        className="p-1.5 rounded text-neutral-500 hover:text-black hover:bg-black/5 transition-colors"
                        title="Edit Job"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 rounded text-neutral-500 hover:text-black hover:bg-black/5 transition-colors"
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
          <div className="py-16 text-center rounded-xl border border-dashed border-white/15 p-8 space-y-3">
            <Briefcase className="w-8 h-8 text-neutral-500 mx-auto" />
            <h4 className="text-base font-semibold text-white">No job openings found</h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
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
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Job Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="air-input text-xs"
                placeholder="e.g. Senior Machine Learning Engineer"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="air-input text-xs"
                placeholder="e.g. Engineering"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="air-input text-xs"
                placeholder="e.g. San Francisco, CA (Remote)"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Employment Type</label>
              <select
                value={formData.employment_type}
                onChange={e => setFormData({ ...formData, employment_type: e.target.value as EmploymentType })}
                className="air-input text-xs"
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
            <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Job Description *</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="air-input text-xs"
              placeholder="Detail responsibilities, mission, and day-to-day requirements..."
            />
          </div>

          {/* Required Skills Tag Input */}
          <div>
            <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">
              Mandatory Required Skills (40% default match weight)
            </label>
            <div className="flex flex-wrap gap-1 p-2 rounded-lg border border-black/10 bg-white mb-2">
              {formData.required_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono bg-black/5 text-[#1b1b1b] border border-black/10"
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
                className="air-input text-xs"
              />
            </div>
          </div>

          {/* Preferred Skills Tag Input */}
          <div>
            <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">
              Preferred / Bonus Skills (15% default match weight)
            </label>
            <div className="flex flex-wrap gap-1 p-2 rounded-lg border border-black/10 bg-white mb-2">
              {formData.preferred_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono bg-black/5 text-[#1b1b1b] border border-black/10"
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
                className="air-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Min Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.min_experience_years}
                onChange={e => setFormData({ ...formData, min_experience_years: parseFloat(e.target.value) || 0 })}
                className="air-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as JobStatus })}
                className="air-input text-xs"
              >
                <option value="ACTIVE">Active (Accepting)</option>
                <option value="DRAFT">Draft</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* AI Matching Weights Config */}
          <div className="p-3.5 rounded-lg bg-white border border-black/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#1b1b1b] uppercase">
              <Sliders className="w-4 h-4 text-[#2b7fff]" />
              <span>AI Candidate Matching Weights</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-neutral-600 font-mono">
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
                  className="air-input text-xs py-1 px-2"
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
                  className="air-input text-xs py-1 px-2"
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
                  className="air-input text-xs py-1 px-2"
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
                  className="air-input text-xs py-1 px-2"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="air-button-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1b1b1b] text-white hover:bg-black rounded-lg px-4 py-2 font-medium flex items-center gap-1.5 disabled:opacity-50 text-xs"
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
