import { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, FileText, User, DollarSign, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface Invoice {
  id: string;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  createdAt: string;
  patient: { name: string };
  items: { description: string, amount: number }[];
}

interface Patient {
  id: string;
  name: string;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    patientId: '',
    items: [{ description: 'Consultation Fee', amount: 150 }],
    status: 'PENDING' as const
  });

  const fetchData = async () => {
    try {
      const [invRes, patRes] = await Promise.all([
        fetch('/api/invoices', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/patients', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);
      
      if (invRes.ok && patRes.ok) {
        setInvoices(await invRes.json());
        setPatients(await patRes.json());
      }
    } catch (error) {
      toast.error('Failed to load billing records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(newInvoice),
      });
      if (res.ok) {
        toast.success('Invoice generated');
        setShowAddModal(false);
        setNewInvoice({ patientId: '', items: [{ description: 'Consultation Fee', amount: 150 }], status: 'PENDING' });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create invoice');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-heading tracking-tight mb-1">Billing & Invoices</h1>
          <p className="text-text-muted">Track payments, arrears, and clinic revenue</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          CREATE INVOICE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-card border border-border p-6 rounded-xl flex items-center gap-4">
           <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center text-green-500">
              <DollarSign className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest leading-none mb-1.5">Total Revenue</p>
              <p className="text-xl font-bold text-text-heading">${invoices.reduce((a, b) => a + b.totalAmount, 0).toLocaleString()}</p>
           </div>
        </div>
        <div className="bg-bg-card border border-border p-6 rounded-xl flex items-center gap-4">
           <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500">
              <Clock className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest leading-none mb-1.5">Pending Payments</p>
              <p className="text-xl font-bold text-text-heading">{invoices.filter(i => i.status === 'PENDING').length}</p>
           </div>
        </div>
        <div className="bg-bg-card border border-border p-6 rounded-xl flex items-center gap-4">
           <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500">
              <AlertCircle className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest leading-none mb-1.5">Overdue Accounts</p>
              <p className="text-xl font-bold text-text-heading">{invoices.filter(i => i.status === 'OVERDUE').length}</p>
           </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-border bg-bg-header/30 flex items-center gap-4">
          <Search className="w-4 h-4 text-text-dim" />
          <input 
            type="text" 
            placeholder="Filter by invoice ID or patient name..." 
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
            <p className="text-text-dim font-bold tracking-widest text-xs">AUDITING RECORDS...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center text-text-dim italic">No billing records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-active/50 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Invoice Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Patient</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-4 text-sm text-text-muted">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-text-primary font-bold">{inv.patient.name}</td>
                    <td className="px-6 py-4 text-sm text-text-heading font-medium tabular-nums">${inv.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={cn(
                        "status-badge",
                        inv.status === 'PAID' ? "status-done" : inv.status === 'PENDING' ? "status-pending" : "status-problem"
                      )}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-text-dim hover:text-brand transition-colors p-2 hover:bg-brand/10 rounded-lg border border-transparent hover:border-brand/20">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-brand">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> New Itemized Invoice
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-white/70 hover:text-white p-2 rounded-full transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleAddInvoice} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2 ml-1">Billable Patient</label>
                  <select 
                    required 
                    className="w-full bg-bg-active border border-border rounded-xl px-4 py-3 text-sm text-text-primary appearance-none focus:ring-2 focus:ring-brand"
                    value={newInvoice.patientId}
                    onChange={(e) => setNewInvoice({...newInvoice, patientId: e.target.value})}
                  >
                    <option value="">Select patient for invoice...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="pt-4 space-y-3">
                   <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2 ml-1">Fee Breakdown</p>
                   {newInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                         <input 
                            type="text" 
                            className="flex-1 bg-bg-active border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                            value={item.description}
                            onChange={(e) => {
                               const items = [...newInvoice.items];
                               items[idx].description = e.target.value;
                               setNewInvoice({...newInvoice, items});
                            }}
                         />
                         <input 
                            type="number" 
                            className="w-24 bg-bg-active border border-border rounded-xl px-4 py-3 text-sm text-text-primary tabular-nums"
                            value={item.amount}
                            onChange={(e) => {
                               const items = [...newInvoice.items];
                               items[idx].amount = Number(e.target.value);
                               setNewInvoice({...newInvoice, items});
                            }}
                         />
                      </div>
                   ))}
                </div>

                <div className="flex justify-between items-center py-4 border-t border-border mt-6">
                   <span className="text-sm font-bold text-text-muted">Total Billable Amount</span>
                   <span className="text-xl font-bold text-brand">${newInvoice.items.reduce((a, b) => a + b.amount, 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-bg-active hover:bg-bg-hover text-text-heading border border-border py-4 rounded-xl font-bold text-xs"
                >
                  DISCARD
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-brand hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'GENERATING...' : 'ISSUE INVOICE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
