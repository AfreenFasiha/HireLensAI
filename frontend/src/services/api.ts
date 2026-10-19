import axios from 'axios';
import type {
  User, Job, Candidate, Application, MatchScore,
  Interview, ParsedResumeData, JobRankingResponse,
  AnalyticsDashboard, AuditLog, ApplicationStage
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hirelens_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: refresh token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const storedRefresh = localStorage.getItem('hirelens_refresh_token');
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: storedRefresh || undefined
        }, { withCredentials: true });

        const newToken = res.data.access_token;
        localStorage.setItem('hirelens_access_token', newToken);
        if (res.data.refresh_token) {
          localStorage.setItem('hirelens_refresh_token', res.data.refresh_token);
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem('hirelens_access_token');
        localStorage.removeItem('hirelens_refresh_token');
        localStorage.removeItem('hirelens_user');
        window.dispatchEvent(new Event('hirelens_logout'));
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  auth: {
    login: (data: any) => apiClient.post('/auth/login', data).then(r => r.data),
    register: (data: any) => apiClient.post('/auth/register', data).then(r => r.data),
    logout: () => apiClient.post('/auth/logout').then(r => r.data),
    me: () => apiClient.get<User>('/auth/me').then(r => r.data),
    updateMe: (data: any) => apiClient.patch<User>('/auth/me', data).then(r => r.data),
  },

  // Jobs
  jobs: {
    list: (params?: any) => apiClient.get<{ items: Job[]; total: number; page: number; page_size: number }>('/jobs', { params }).then(r => r.data),
    get: (id: string) => apiClient.get<Job>(`/jobs/${id}`).then(r => r.data),
    create: (data: Partial<Job>) => apiClient.post<Job>('/jobs', data).then(r => r.data),
    update: (id: string, data: Partial<Job>) => apiClient.patch<Job>(`/jobs/${id}`, data).then(r => r.data),
    delete: (id: string) => apiClient.delete(`/jobs/${id}`).then(r => r.data),
  },

  // Candidates
  candidates: {
    list: (params?: any) => apiClient.get<{ items: Candidate[]; total: number; page: number; page_size: number }>('/candidates', { params }).then(r => r.data),
    get: (id: string) => apiClient.get<Candidate>(`/candidates/${id}`).then(r => r.data),
    create: (data: any) => apiClient.post<Candidate>('/candidates', data).then(r => r.data),
    update: (id: string, data: any) => apiClient.patch<Candidate>(`/candidates/${id}`, data).then(r => r.data),
    delete: (id: string) => apiClient.delete(`/candidates/${id}`).then(r => r.data),
    uploadResume: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post(`/candidates/${id}/resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(r => r.data);
    },
    downloadResumeUrl: (id: string, resumeId: string) => `${API_BASE_URL}/candidates/${id}/resume/${resumeId}/download`,
    addNote: (id: string, data: { content: string; is_private?: boolean }) => apiClient.post(`/candidates/${id}/notes`, data).then(r => r.data),
  },

  // Applications
  applications: {
    list: (params?: { job_id?: string; candidate_id?: string; stage?: ApplicationStage }) => apiClient.get<Application[]>('/applications', { params }).then(r => r.data),
    get: (id: string) => apiClient.get<Application>(`/applications/${id}`).then(r => r.data),
    create: (data: { job_id: string; candidate_id: string }) => apiClient.post<Application>('/applications', data).then(r => r.data),
    updateStage: (id: string, data: { stage: ApplicationStage; reason?: string }) => apiClient.patch<Application>(`/applications/${id}/stage`, data).then(r => r.data),
  },

  // AI & Matching
  ai: {
    parseResumePreview: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post<ParsedResumeData>('/ai/parse-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(r => r.data);
    },
    matchCandidate: (data: { job_id: string; candidate_id: string; custom_weights?: any }) => apiClient.post<MatchScore>('/ai/match-candidate', data).then(r => r.data),
    getJobRankings: (jobId: string, stage?: string) => apiClient.get<JobRankingResponse>(`/ai/job-rankings/${jobId}`, { params: { stage } }).then(r => r.data),
  },

  // Interviews
  interviews: {
    list: (params?: any) => apiClient.get<Interview[]>('/interviews', { params }).then(r => r.data),
    create: (data: any) => apiClient.post<Interview>('/interviews', data).then(r => r.data),
    update: (id: string, data: any) => apiClient.patch<Interview>(`/interviews/${id}`, data).then(r => r.data),
    delete: (id: string) => apiClient.delete(`/interviews/${id}`).then(r => r.data),
    submitFeedback: (id: string, data: any) => apiClient.post(`/interviews/${id}/feedback`, data).then(r => r.data),
  },

  // Analytics
  analytics: {
    getDashboard: (params?: { job_id?: string; days?: number }) => apiClient.get<AnalyticsDashboard>('/analytics/dashboard', { params }).then(r => r.data),
    getExportCsvUrl: (job_id?: string) => `${API_BASE_URL}/analytics/export-csv${job_id ? `?job_id=${job_id}` : ''}`,
  },

  // Admin
  admin: {
    listUsers: () => apiClient.get<User[]>('/admin/users').then(r => r.data),
    updateUserRole: (id: string, role: string) => apiClient.patch<User>(`/admin/users/${id}/role`, { role }).then(r => r.data),
    updateUserStatus: (id: string, is_active: boolean) => apiClient.patch<User>(`/admin/users/${id}/status`, { is_active }).then(r => r.data),
    getAuditLogs: (params?: any) => apiClient.get<AuditLog[]>('/admin/audit-logs', { params }).then(r => r.data),
    getOrg: () => apiClient.get('/admin/organization').then(r => r.data),
    updateOrg: (data: any) => apiClient.patch('/admin/organization', data).then(r => r.data),
  }
};
