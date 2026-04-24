import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Plus, Calendar as CalendarIcon, Clock, User, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Appointment {
  id: string;
  patientId: string;
  date: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  patient: { name: string };
}

interface Patient {
  id: string;
  name: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    date: '',
    time: '09:00',
    status: 'UPCOMING',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [appRes, patRes] = await Promise.all([
        fetch('/api/appointments', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/patients', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);
      
      if (appRes.ok && patRes.ok) {
        setAppointments(await appRes.json());
        setPatients(await patRes.json());
      }
    } catch (error) {
      toast.error('Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dateTime = new Date(`${newAppointment.date}T${newAppointment.time}`);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          patientId: newAppointment.patientId,
          date: dateTime.toISOString(),
          status: newAppointment.status,
          notes: newAppointment.notes
        }),
      });
      if (res.ok) {
        toast.success('Appointment scheduled');
        setShowAddModal(false);
        setNewAppointment({ patientId: '', date: '', time: '09:00', status: 'UPCOMING', notes: '' });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Booking failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calendarEvents = appointments.map(app => ({
    id: app.id,
    title: `${app.patient.name} - ${app.status}`,
    start: new Date(app.date),
    end: new Date(new Date(app.date).getTime() + 30 * 60000), // 30 min duration
    resource: app
  }));

  const eventStyleGetter = (event: any) => {
    const status = event.resource.status;
    let bgColor = '#3b82f6'; // Blue for upcoming
    if (status === 'COMPLETED') bgColor = '#22c55e'; // Green
    if (status === 'CANCELLED') bgColor = '#ef4444'; // Red
    
    return {
      style: {
        backgroundColor: bgColor,
        borderRadius: '6px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '2px 8px'
      }
    };
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-bg-card border border-border p-6 rounded-2xl">
        <div>
          <h1 className="text-3xl font-bold text-text-heading tracking-tight mb-1">Schedule</h1>
          <p className="text-text-muted">Manage patient consults and facility bookings</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex bg-bg-active border border-border rounded-lg p-1">
              {[Views.MONTH, Views.WEEK, Views.DAY].map(v => (
                <button 
                  key={v}
                  onClick={() => setCurrentView(v as any)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                    currentView === v ? "bg-bg-card text-brand border border-border" : "text-text-dim hover:text-text-muted"
                  )}
                >
                  {v}
                </button>
              ))}
           </div>
           <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-brand hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            BOOK APPOINTMENT
          </button>
        </div>
      </div>

      <div className="flex-1 bg-bg-card border border-border rounded-2xl p-6 shadow-2xl overflow-hidden relative min-h-[600px]">
        {loading && (
          <div className="absolute inset-0 bg-bg-card/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-brand animate-spin" />
            <p className="text-text-dim font-bold tracking-widest text-xs">SYNCHRONIZING CALENDAR...</p>
          </div>
        )}
        
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          view={currentView}
          onView={(v) => setCurrentView(v as any)}
          date={currentDate}
          onNavigate={(d) => setCurrentDate(d)}
          eventPropGetter={eventStyleGetter}
          style={{ height: '100%' }}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          className="medical-calendar"
          components={{
            toolbar: (props) => (
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <button onClick={() => props.onNavigate('PREV')} className="p-2 hover:bg-bg-active rounded-lg transition-colors border border-border">
                    <ChevronLeft className="w-5 h-5 text-text-muted" />
                  </button>
                  <button onClick={() => props.onNavigate('TODAY')} className="px-4 py-2 hover:bg-bg-active rounded-lg transition-colors border border-border text-xs font-bold text-text-heading">
                    TODAY
                  </button>
                  <button onClick={() => props.onNavigate('NEXT')} className="p-2 hover:bg-bg-active rounded-lg transition-colors border border-border">
                    <ChevronRight className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-text-heading tracking-tight">{format(props.date, 'MMMM yyyy')}</h2>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-dim uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-brand" /> Upcoming
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-dim uppercase tracking-widest pl-4">
                    <div className="w-2 h-2 rounded-full bg-green-500" /> Done
                  </span>
                </div>
              </div>
            )
          }}
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .medical-calendar { border: none !important; }
        .rbc-month-view, .rbc-time-view { border: 1px solid var(--color-border) !important; border-radius: 12px; background: #050505; }
        .rbc-header { border-bottom: 1px solid var(--color-border) !important; padding: 12px !important; color: var(--color-text-dim); text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; }
        .rbc-day-bg { border-left: 1px solid var(--color-border) !important; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid var(--color-border) !important; }
        .rbc-off-range-bg { background: #080808 !important; }
        .rbc-today { background: #0d0d0d !important; }
        .rbc-event { padding: 4px 8px !important; margin: 2px !important; border: 1px solid rgba(255,255,255,0.1) !important; }
        .rbc-show-more { color: var(--color-brand); font-weight: bold; font-size: 10px; }
      `}} />

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-bg-header/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-brand" />
                </div>
                <h2 className="text-xl font-bold text-text-heading">Schedule Consultation</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-text-dim hover:text-text-heading p-2 rounded-full transition-colors border border-border backdrop-blur-md">✕</button>
            </div>
            
            <form onSubmit={handleAddAppointment} className="p-8 space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                    <User className="w-3 h-3" /> Select Patient
                  </label>
                  <select 
                    required 
                    className="w-full bg-bg-active border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 outline-none transition-all appearance-none"
                    value={newAppointment.patientId}
                    onChange={(e) => setNewAppointment({...newAppointment, patientId: e.target.value})}
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                      <CalendarIcon className="w-3 h-3" /> Visit Date
                    </label>
                    <input 
                      type="date" required 
                      className="w-full bg-bg-active border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 outline-none transition-all [color-scheme:dark]"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Arrival Time
                    </label>
                    <input 
                      type="time" required 
                      className="w-full bg-bg-active border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 outline-none transition-all [color-scheme:dark]"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2 ml-1">Appointment Type / Notes</label>
                  <textarea 
                    className="w-full bg-bg-active border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-brand/50 outline-none transition-all min-h-[80px]"
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                    placeholder="Brief description of consultation..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-brand hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'SECURE BOOKING...' : 'CONFIRM APPOINTMENT'}
                </button>
                <p className="text-[10px] text-center text-text-dim font-bold uppercase tracking-widest">Patient will be notified via email automatically</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
