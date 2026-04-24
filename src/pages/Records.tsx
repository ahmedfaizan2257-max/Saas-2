import { useState, useEffect } from 'react';
import { Beaker, FileText, Search, User, Calendar, AlertCircle, CheckCircle2, Download, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface LabResult {
  id: string;
  testName: string;
  resultValue: string;
  isAbnormal: boolean;
  createdAt: string;
  patient: { name: string };
}

interface Prescription {
  id: string;
  medications: string;
  notes: string | null;
  createdAt: string;
  patient: { name: string };
  doctor: { name: string };
}

export default function RecordsPage() {
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'labs' | 'prescriptions'>('labs');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [labRes, preRes] = await Promise.all([
        fetch('/api/lab-results', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/prescriptions', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);
      
      if (labRes.ok && preRes.ok) {
        setLabResults(await labRes.json());
        setPrescriptions(await preRes.json());
      }
    } catch (error) {
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLabs = labResults.filter(l => 
    l.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.medications.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-heading tracking-tight mb-1">Medical Records</h1>
          <p className="text-text-muted">Repository for diagnostics and pharmacological history</p>
        </div>
        <div className="flex bg-bg-card border border-border p-1 rounded-xl shadow-lg">
           <button 
            onClick={() => setActiveTab('labs')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
              activeTab === 'labs' ? "bg-bg-active text-brand border border-border shadow-sm" : "text-text-dim hover:text-text-muted"
            )}
           >
            <Beaker className="w-4 h-4" />
            LAB RESULTS
           </button>
           <button 
            onClick={() => setActiveTab('prescriptions')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
              activeTab === 'prescriptions' ? "bg-bg-active text-brand border border-border shadow-sm" : "text-text-dim hover:text-text-muted"
            )}
           >
            <FileText className="w-4 h-4" />
            PRESCRIPTIONS
           </button>
        </div>
      </div>

      <div className="relative group bg-bg-card border border-border rounded-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-brand" />
        <input 
          type="text" 
          placeholder={`Search ${activeTab === 'labs' ? 'tests or patients' : 'medications or patients'}...`} 
          className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-4 text-sm text-text-primary"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="text-text-dim font-medium uppercase tracking-widest text-[10px]">RETRIVING ARCHIVES...</p>
        </div>
      ) : activeTab === 'labs' ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredLabs.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-xl p-20 text-center text-text-dim italic">
              No laboratory results found in the database.
            </div>
          ) : (
            filteredLabs.map((lab) => (
              <div key={lab.id} className="bg-bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand/40 transition-all group">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border",
                    lab.isAbnormal ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-green-500/10 border-green-500/20 text-green-500"
                  )}>
                    {lab.isAbnormal ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-heading group-hover:text-brand transition-colors">{lab.testName}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
                      <User className="w-3 h-3 text-text-dim" /> {lab.patient.name}
                      <span className="text-text-dim">•</span>
                      <Calendar className="w-3 h-3 text-text-dim" /> {new Date(lab.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-12">
                   <div className="text-right">
                      <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Result Value</div>
                      <div className={cn("text-lg font-bold tabular-nums", lab.isAbnormal ? "text-red-500 underline underline-offset-4 decoration-red-500/30" : "text-text-primary")}>
                        {lab.resultValue}
                      </div>
                   </div>
                   <button className="p-3 bg-bg-active hover:bg-bg-hover text-text-muted hover:text-text-heading rounded-lg border border-border transition-all">
                      <Download className="w-5 h-5" />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrescriptions.length === 0 ? (
            <div className="col-span-full bg-bg-card border border-border rounded-xl p-20 text-center text-text-dim italic">
              No prescriptions recorded for this organization.
            </div>
          ) : (
            filteredPrescriptions.map((pre) => (
              <div key={pre.id} className="bg-bg-card border border-border rounded-2xl p-8 hover:border-brand/40 transition-all flex flex-col h-full bg-gradient-to-br from-bg-card to-bg-active/20">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl">
                    <FileText className="w-6 h-6 text-brand" />
                  </div>
                  <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest bg-bg-active px-3 py-1.5 rounded-full border border-border">
                    ID: {pre.id.slice(0, 8)}
                  </span>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-text-heading mb-1">{pre.medications}</h3>
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                    <User className="w-3 h-3" /> {pre.patient.name}
                  </div>
                </div>

                {pre.notes && (
                  <div className="flex-1 bg-bg-active/50 border border-border rounded-xl p-4 mb-6 italic text-sm text-text-muted leading-relaxed">
                    "{pre.notes}"
                  </div>
                )}

                <div className="pt-6 border-t border-border flex justify-between items-center mt-auto">
                  <div>
                    <div className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-1">Prescribing Doctor</div>
                    <div className="text-xs font-bold text-text-primary">{pre.doctor.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-1">Issue Date</div>
                    <div className="text-xs font-bold text-text-primary">{new Date(pre.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
