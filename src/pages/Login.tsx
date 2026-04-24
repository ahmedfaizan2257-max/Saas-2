import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data);
        toast.success('Logged in successfully');
        navigate('/');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-bg-card rounded-2xl shadow-2xl border border-border">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-xl mb-4">
            <div className="w-6 h-6 bg-white rounded-md" />
          </div>
          <h1 className="text-3xl font-bold text-text-heading tracking-tight">MediCare Pro</h1>
          <p className="mt-3 text-sm text-text-muted">Sign in to manage your clinic</p>
        </div>
        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="p-3 bg-brand/5 border border-brand/20 rounded-lg mb-6">
              <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">Demo Credentials</p>
              <button 
                type="button"
                onClick={() => {
                  setEmail('admin@medipro.com');
                  setPassword('admin123');
                }}
                className="text-xs text-text-primary hover:text-brand underline transition-colors"
              >
                Auto-fill: admin@medipro.com / admin123
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-1.5 ml-1">Email address</label>
              <input
                type="email"
                required
                className="block w-full px-4 py-3 bg-bg-active border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <input
                type="password"
                required
                className="block w-full px-4 py-3 bg-bg-active border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-brand hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/50 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? 'SIGNING IN...' : 'CONTINUE TO DASHBOARD'}
          </button>
        </form>
        <div className="text-center pt-4">
          <Link to="/register" className="text-sm font-medium text-text-muted hover:text-brand transition-colors">
            Don't have an account? <span className="text-brand">Register your clinic</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
