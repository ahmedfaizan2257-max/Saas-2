import { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, AlertCircle, CheckCircle2, Clock, XCircle, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface Claim {
  id: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DENIED';
  denialReason: string | null;
  createdAt: string;
  patient: { name: string };
  invoice: { totalAmount: number };
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClaims = async () => {
    try {
      const res = await fetch('/api/claims', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setClaims(await res.json());
      }
    } catch (error) {
      toast.error('Failed to load insurance claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'DENIED': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'IN_REVIEW': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'status-done';
      case 'DENIED': return 'status-problem';
      case 'IN_REVIEW': return 'status-pending';
      default: return 'status-new';
    }
  };

  const filteredClaims = claims.filter(c => 
    c.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-bg-card border border-border p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-text-heading tracking-tight mb-1">Insurance Claims</h1>
          <p className="text-text-muted">Lifecycle tracking for third-party medical reimbursements</p>
        </div>
        <div className="flex bg-bg-active border border-border rounded-xl p-1">
           <button className="px-6 py-2.5 bg-bg-card text-brand text-xs font-bold uppercase tracking-widest rounded-lg border border-border shadow-sm">
             ALL CLAIMS
           </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { label: 'TOTAL SUBMITTED', val: claims.length, color: 'text-brand' },
          { label: 'PENDING REVIEW', val: claims.filter(c => c.status === 'IN_REVIEW').length, color: 'text-yellow-500' },
          { label: 'APPROVED', val: claims.filter(c => c.status === 'APPROVED').length, color: 'text-green-500' },
          { label: 'DENIALS', val: claims.filter(c => c.status === 'DENIED').length, color: 'text-red-500' },
        ].map((stat, i) => (
          <div key={i} className="min-w-[200px] bg-bg-card border border-border p-5 rounded-xl shadow-sm">
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-3 leading-none">{stat.label}</p>
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-bg-card border border-border rounded-2xl shadow-lg flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center bg-bg-header/20">
          <Search className="w-4 h-4 text-text-dim mr-4" />
          <input 
            type="text" 
            placeholder="Search claims by ID or patient name..." 
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-heading transition-colors pl-4 border-l border-border">
            <Filter className="w-3 h-3" /> FILTER: LATEST
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-brand animate-spin" />
            <p className="text-text-dim font-bold tracking-widest text-[10px]">SYNCING WITH CLEARINGHOUSE...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-bg-active rounded-full flex items-center justify-center mx-auto mb-4 border border-border opacity-50">
              <ShieldCheck className="w-8 h-8 text-text-dim" />
            </div>
            <p className="text-text-dim italic text-sm">No active insurance claims found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {filteredClaims.map((claim) => (
              <div key={claim.id} className="p-6 flex items-center justify-between hover:bg-bg-hover/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-105 shadow-lg shadow-black/20",
                    claim.status === 'APPROVED' ? "bg-green-500/10 border-green-500/20" : 
                    claim.status === 'DENIED' ? "bg-red-500/10 border-red-500/20" : "bg-bg-active border-border"
                  )}>
                    {getStatusIcon(claim.status)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-heading mb-1">{claim.patient.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-text-dim">
                      <span>CLAIM: #{claim.id.slice(0, 8)}</span>
                      <span className="text-border">•</span>
                      <span>ISSUED: {new Date(claim.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                   <div className="text-right">
                      <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Reimbursement Value</div>
                      <div className="text-lg font-bold text-text-primary tabular-nums">${claim.invoice.totalAmount.toFixed(2)}</div>
                   </div>
                   <div className="min-w-[120px] flex justify-end">
                      <span className={cn("status-badge", getStatusClass(claim.status))}>
                        {claim.status.replace('_', ' ')}
                      </span>
                   </div>
                   <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-brand group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredClaims.some(c => c.status === 'DENIED') && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-bottom duration-500">
           <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
           <div>
              <h4 className="text-sm font-bold text-red-500 mb-1 leading-none uppercase tracking-widest">Action Required: Denied Claims</h4>
              <p className="text-xs text-red-500/70 leading-relaxed font-medium">Multiple claims have been denied by payers. Please review denial reasons in the details view and resubmit with necessary supporting documentation.</p>
           </div>
        </div>
      )}
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
