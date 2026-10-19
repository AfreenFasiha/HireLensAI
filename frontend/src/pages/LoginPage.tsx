import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const demo = searchParams.get('demo');
    if (demo === 'admin') {
      setEmail('admin@technova.io');
      setPassword('Password123!');
    } else if (demo === 'recruiter') {
      setEmail('sarah.recruiter@technova.io');
      setPassword('Password123!');
    } else if (demo === 'manager') {
      setEmail('elena.engineering@technova.io');
      setPassword('Password123!');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-white selection:text-black">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white font-mono font-bold text-base">
            H
          </div>
          <span className="font-semibold tracking-widest text-xl text-white uppercase">HireLens AI</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-white">Sign in to your workspace</h2>
        <p className="mt-1 text-xs text-neutral-400">
          Or{' '}
          <Link to="/register" className="font-medium text-white underline hover:text-neutral-300">
            register a new organization
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Air off-white card */}
        <div className="air-card space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="air-input pl-9"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="air-input pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg bg-[#1b1b1b] text-white hover:bg-black font-semibold text-xs tracking-wider uppercase transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5 font-mono">
                  Sign In <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Fill */}
          <div className="pt-4 border-t border-black/10">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2.5 text-center">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@technova.io')}
                className="air-button-light text-xs py-1.5 px-2 font-mono"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('sarah.recruiter@technova.io')}
                className="air-button-light text-xs py-1.5 px-2 font-mono"
              >
                Recruiter
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('elena.engineering@technova.io')}
                className="air-button-light text-xs py-1.5 px-2 font-mono"
              >
                Hiring Mgr
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
