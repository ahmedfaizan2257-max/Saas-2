import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, TrendingUp, Users, ShieldCheck, DollarSign, Download, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface ReportData {
  totalPatients: number;
  totalInvoices: number;
  totalRevenue: number;
  revenueByStatus: {
    PAID: number;
    PENDING: number;
    OVERDUE: number;
  };
  claimStats: {
    APPROVED: number;
    DENIED: number;
    IN_REVIEW: number;
    SUBMITTED: number;
  };
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444'];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/reports/summary', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      toast.error('Failed to load analytical data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="w-12 h-12 text-brand animate-spin" />
      <p className="text-text-dim font-bold tracking-widest text-[10px] uppercase">Processing Big Data...</p>
    </div>
  );

  if (!data) return null;

  const revenueData = [
    { name: 'Paid', value: data.revenueByStatus.PAID },
    { name: 'Pending', value: data.revenueByStatus.PENDING },
    { name: 'Overdue', value: data.revenueByStatus.OVERDUE },
  ];

  const claimPieData = [
    { name: 'Approved', value: data.claimStats.APPROVED },
    { name: 'Submitted', value: data.claimStats.SUBMITTED },
    { name: 'In Review', value: data.claimStats.IN_REVIEW },
    { name: 'Denied', value: data.claimStats.DENIED },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-text-heading tracking-tight mb-1">Clinic Analytics</h1>
          <p className="text-text-muted">High-level management insights and performance metrics</p>
        </div>
        <button className="flex items-center gap-2 bg-bg-card border border-border hover:bg-bg-active text-text-heading px-4 py-2.5 rounded-lg font-bold text-xs transition-all shadow-lg active:scale-95">
          <Download className="w-4 h-4" />
          EXPORT FULL REPORT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'PATIENT BASE', val: data.totalPatients, icon: Users, color: 'text-brand', bg: 'bg-brand/10' },
          { label: 'TOTAL REVENUE', val: `$${data.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'AVG COLLECTION', val: '94%', icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'INSURANCE VOLUME', val: data.claimStats.SUBMITTED + data.claimStats.APPROVED + data.claimStats.DENIED + data.claimStats.IN_REVIEW, icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((s, i) => (
          <div key={i} className="bg-bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-brand/30 transition-all group">
             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-transparent group-hover:border-current", s.bg, s.color)}>
                <s.icon className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">{s.label}</p>
             <p className="text-2xl font-bold text-text-heading">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-bg-card border border-border rounded-2xl p-8 shadow-2xl flex flex-col">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-sm font-bold text-text-heading uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand" /> Revenue Breakdown
              </h3>
              <div className="text-[10px] font-bold text-text-dim uppercase">Currency: USD</div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#555" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#555" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                    contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-8 shadow-2xl flex flex-col">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-sm font-bold text-text-heading uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" /> Claim Success Rate
              </h3>
           </div>
           {claimPieData.length > 0 ? (
             <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={claimPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {claimPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-2xl font-bold text-text-heading tracking-tight">
                     {Math.round((data.claimStats.APPROVED / (data.claimStats.SUBMITTED + data.claimStats.APPROVED + data.claimStats.DENIED + data.claimStats.IN_REVIEW || 1)) * 100)}%
                   </p>
                   <p className="text-[8px] font-bold text-text-dim tracking-widest uppercase">Approval Rate</p>
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-text-dim italic text-sm">
                Insufficient claim data for visualization.
             </div>
           )}
           
           <div className="mt-8 flex flex-wrap justify-between gap-4 border-t border-border pt-8">
              {claimPieData.map((entry, index) => (
                <div key={index} className="flex flex-col">
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">{entry.name}</span>
                   </div>
                   <span className="text-sm font-bold text-text-heading pl-4">{entry.value}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-8 shadow-2xl">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-text-heading uppercase tracking-widest">Growth Trends</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted">
               <Calendar className="w-3 h-3" /> PERIOD: LAST 30 DAYS
            </div>
         </div>
         <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { name: 'W1', val: 400 }, { name: 'W2', val: 700 }, { name: 'W3', val: 600 }, { name: 'W4', val: 1200 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}
