import { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail, Calendar, Activity, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface Patient {
  id: string;
  name: string;
  dob: string;
  phone: string;
  email: string | null;
  diagnosis: string | null;
  insuranceId: string | null;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPatient, setNewPatient] = useState({
    name: '',
    dob: '',
    phone: '',
    email: '',
    diagnosis: '',
    insuranceId: '',
    medicalHistory: ''
  });

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(newPatient),
      });
      if (res.ok) {
        toast.success('Patient added successfully');
        setShowAddModal(false);
        setNewPatient({ name: '', dob: '', phone: '', email: '', diagnosis: '', insuranceId: '', medicalHistory: '' });
        fetchPatients();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add patient');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    (p.insuranceId && p.insuranceId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-heading tracking-tight mb-1">Patients</h1>
          <p className="text-text-muted">Directly manage and view your patient database</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          ADD PATIENT
        </button>
      </div>

      <div className="relative group bg-bg-card border border-border rounded-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-brand" />
        <input 
          type="text" 
          placeholder="Search by name, phone, or insurance ID..." 
          className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-4 text-sm text-text-primary"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="text-text-dim font-medium">Accessing medical records...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-xl p-20 text-center">
          <div className="w-16 h-16 bg-bg-active rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
            <User className="w-8 h-8 text-text-dim" />
          </div>
          <h3 className="text-lg font-semibold text-text-heading mb-1">No patients found</h3>
          <p className="text-text-muted text-sm max-w-xs mx-auto">Try adjusting your search or add a new patient to the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-bg-card border border-border rounded-xl p-6 hover:border-brand/40 transition-all cursor-pointer group shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-bg-active rounded-full flex items-center justify-center text-brand font-bold">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Active
                </div>
              </div>
              <h3 className="text-lg font-bold text-text-heading mb-1 group-hover:text-brand transition-colors">{patient.name}</h3>
              <p className="text-text-muted text-xs font-medium uppercase tracking-widest mb-4">
                {patient.insuranceId ? `INS: ${patient.insuranceId}` : 'No Insurance linked'}
              </p>
              
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <Calendar className="w-4 h-4 text-text-dim" />
                  <span>DOB: {new Date(patient.dob).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <Phone className="w-4 h-4 text-text-dim" />
                  <span>{patient.phone}</span>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <Mail className="w-4 h-4 text-text-dim" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.diagnosis && (
                  <div className="flex items-start gap-3 text-sm text-text-muted mt-2 pt-2 border-t border-border-subtle">
                    <Activity className="w-4 h-4 text-brand mt-0.5" />
                    <span className="italic">{patient.diagnosis}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-bg-header">
              <h2 className="text-xl font-bold text-text-heading">New Patient Enrollment</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-text-dim hover:text-text-heading p-2 bg-bg-active rounded-lg transition-colors border border-border"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddPatient} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input 
                    type="text" required 
                    className="w-full bg-bg-active border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1">Date of Birth</label>
                  <input 
                    type="date" required 
                    className="w-full bg-bg-active border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all [color-scheme:dark]"
                    value={newPatient.dob}
                    onChange={(e) => setNewPatient({...newPatient, dob: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                  <input 
                    type="tel" required 
                    className="w-full bg-bg-active border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1">Email (Optional)</label>
                  <input 
                    type="email" 
                    className="w-full bg-bg-active border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1">Insurance ID</label>
                  <input 
                    type="text" 
                    className="w-full bg-bg-active border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all"
                    value={newPatient.insuranceId}
                    onChange={(e) => setNewPatient({...newPatient, insuranceId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1">Initial Diagnosis</label>
                  <input 
                    type="text" 
                    className="w-full bg-bg-active border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all"
                    value={newPatient.diagnosis}
                    onChange={(e) => setNewPatient({...newPatient, diagnosis: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1">Medical History Summary</label>
                <textarea 
                  className="w-full bg-bg-active border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all min-h-[100px]"
                  value={newPatient.medicalHistory}
                  onChange={(e) => setNewPatient({...newPatient, medicalHistory: e.target.value})}
                  placeholder="Known allergies, chronic conditions..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-bg-active hover:bg-bg-hover text-text-heading border border-border py-4 rounded-lg font-bold text-sm transition-all"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-brand hover:bg-blue-500 text-white py-4 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'ENROLLING...' : 'ENROLL PATIENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
