import { useState, useEffect } from 'react';
import { FileText, Shield, User, Clock, Search, Filter, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { name: string, email: string, role: string };
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (error) {
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchLogs();
    }
  }, [user]);

  if (user?.role !== 'ADMIN') return <Navigate to="/" />;

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.details && l.details.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-bg-card border border-border p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-brand" />
           </div>
           <div>
              <h1 className="text-3xl font-bold text-text-heading tracking-tight mb-1">System Audit Trail</h1>
              <p className="text-text-muted">Security logs and administrative action history</p>
           </div>
        </div>
        <div className="flex bg-bg-active border border-border rounded-xl p-1">
           <span className="px-5 py-2 text-[10px] font-bold text-text-dim uppercase tracking-widest leading-none block mt-1">Live Monitoring: Active</span>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[700px]">
        <div className="px-8 py-5 border-b border-border bg-bg-header/20 flex items-center">
          <Search className="w-4 h-4 text-text-dim mr-4" />
          <input 
            type="text" 
            placeholder="Filter logs by user, action, or details..." 
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-4 pl-6 border-l border-border ml-4">
             <button className="text-[10px] font-bold text-text-dim hover:text-brand flex items-center gap-2 uppercase tracking-widest transition-colors">
                <Filter className="w-3.5 h-3.5" /> Export Logs
             </button>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="w-12 h-12 text-brand animate-spin" />
              <p className="text-text-dim font-bold tracking-widest text-[10px] uppercase">Reconstructing historical data...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-40 text-center">
               <FileText className="w-12 h-12 text-text-dim mx-auto mb-4 opacity-20" />
               <p className="text-text-dim italic">No matching security events in this view.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-bg-active/30 sticky top-0 z-10 backdrop-blur-md">
                <tr className="border-b border-border">
                  <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Administrator</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Action</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Context / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg-hover/40 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap">
                       <div className="flex items-center gap-2.5">
                          <Clock className="w-3.5 h-3.5 text-text-dim group-hover:text-brand transition-colors" />
                          <span className="text-xs font-mono text-text-muted">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-bg-active border border-border flex items-center justify-center text-[10px] font-bold text-brand group-hover:border-brand/40 transition-all">
                             {log.user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                             <div className="text-xs font-bold text-text-primary">{log.user.name}</div>
                             <div className="text-[10px] text-text-dim font-medium lowercase leading-tight">{log.user.email}</div>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className="px-2.5 py-1 rounded bg-bg-active border border-border text-[10px] font-bold text-text-heading tracking-wide uppercase">
                          {log.action}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-xs text-text-muted max-w-sm truncate group-hover:text-text-primary transition-colors">
                          {log.details || '—'}
                       </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-bg-card border border-border p-6 rounded-2xl flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Compliance Status: NIST / HIPAA Compliant Logging</p>
         </div>
         <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Logs are immutable after 7 days</p>
      </div>
    </div>
  );
}
