/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import PatientsPage from './pages/Patients';
import AppointmentsPage from './pages/Appointments';
import RecordsPage from './pages/Records';
import BillingPage from './pages/Billing';
import ClaimsPage from './pages/Claims';
import ReportsPage from './pages/Reports';
import AuditLogsPage from './pages/AuditLogs';
import SettingsPage from './pages/Settings';
import { LayoutDashboard, Users, Calendar, Beaker, FileText, CreditCard, ShieldCheck, BarChart3, Settings, LogOut, Bell, Search, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from './lib/utils';

function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Patients', icon: Users, path: '/patients' },
    { name: 'Appointments', icon: Calendar, path: '/appointments' },
    { name: 'Medical Records', icon: Beaker, path: '/records' },
    { name: 'Billing & Invoices', icon: CreditCard, path: '/billing' },
    { name: 'Insurance Claims', icon: ShieldCheck, path: '/claims' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
  ];

  const adminItems = [
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Audit Logs', icon: FileText, path: '/audit' },
  ];

  return (
    <aside className="w-64 bg-bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm" />
        </div>
        <span className="font-bold text-xl text-text-heading">
          MediCare<span className="text-brand">Pro</span>
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              location.pathname === item.path 
                ? "bg-bg-active text-text-heading" 
                : "text-text-muted hover:bg-bg-hover hover:text-text-primary"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        ))}

        {user?.role === 'ADMIN' && (
          <div className="pt-8 space-y-1">
            <p className="px-4 text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Administration</p>
            {adminItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  location.pathname === item.path 
                    ? "bg-bg-active text-text-heading" 
                    : "text-text-muted hover:bg-bg-hover hover:text-text-primary"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="p-4 mt-auto border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function Header() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          setNotifications(await res.json());
        }
      } catch (error) {}
    };
    if (user) fetchNotifications();
  }, [user]);

  return (
    <header className="h-16 border-b border-border bg-bg-header flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="relative group flex items-center bg-bg-active rounded-md px-3 border border-transparent focus-within:border-brand/50 transition-all">
        <Search className="w-4 h-4 text-text-dim group-focus-within:text-brand" />
        <input 
          type="text" 
          placeholder="Search patients, invoices, claims..." 
          className="bg-transparent border-none outline-none px-3 py-2 text-sm w-72 text-text-primary placeholder:text-text-dim"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-text-muted hover:text-text-heading transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-bg-header" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="px-4 py-3 border-b border-border bg-bg-active/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-text-heading uppercase tracking-widest">Alerts & Notifications</span>
                  <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded uppercase">{notifications.length} New</span>
               </div>
               <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-[11px] text-text-dim italic">System is quiet. No new alerts.</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 border-b border-border hover:bg-bg-hover transition-colors cursor-pointer">
                         <p className="text-xs font-bold text-text-heading mb-0.5">{n.title}</p>
                         <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">{n.message}</p>
                         <p className="text-[9px] text-text-dim font-bold uppercase mt-2 tracking-tighter">{new Date(n.createdAt).toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
               </div>
               <div className="p-3 border-t border-border bg-bg-active/20 text-center">
                  <button className="text-[10px] font-bold text-brand hover:underline uppercase tracking-widest">Clear All Archives</button>
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-border">
          <div className="text-right">
            <div className="text-sm font-semibold text-text-heading leading-none mb-1">{user?.name}</div>
            <div className="text-[11px] text-text-dim uppercase tracking-wider font-bold">{user?.role.replace('_', ' ')}</div>
          </div>
          <div className="w-9 h-9 bg-bg-active border border-border rounded-full flex items-center justify-center text-brand font-bold text-xs">
            {user?.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </div>
    </header>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-bg-main selection:bg-brand/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, organization } = useAuth();

  const stats = [
    { label: 'MONTHLY REVENUE', value: '$142,850.00', trend: '+12.4% vs last month', color: 'text-green-500' },
    { label: 'PENDING CLAIMS', value: '42', trend: 'Est. Value: $28,400', color: 'text-yellow-500' },
    { label: 'DENIED CLAIMS', value: '8', trend: 'Action required immediately', color: 'text-red-500' },
    { label: 'UNPAID INVOICES', value: '15', trend: 'Average delay: 4.2 days', color: 'text-text-dim' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-heading tracking-tight mb-1">Dashboard</h1>
          <p className="text-text-muted">Overview for {organization?.name}</p>
        </div>
        <div className="text-xs text-text-dim font-medium px-3 py-1.5 bg-bg-card border border-border rounded-md">
          LAST UPDATED: 2 MINS AGO
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-bg-card p-6 rounded-xl border border-border">
            <h3 className="text-text-dim text-[11px] font-bold uppercase tracking-widest mb-3">{stat.label}</h3>
            <p className="text-2xl font-bold text-text-heading mb-2">{stat.value}</p>
            <p className={cn("text-[11px] font-medium", stat.color)}>{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-card rounded-xl border border-border flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-semibold text-text-heading">Recent Insurance Claims</h3>
            <button className="text-[12px] font-semibold text-brand hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Patient Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Provider</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {[
                  { name: 'Marcus Holloway', provider: 'Blue Cross Blue Shield', amount: '$1,240.00', status: 'Approved', statusClass: 'status-done' },
                  { name: 'Elena Rodriguez', provider: 'United Healthcare', amount: '$450.00', status: 'In Review', statusClass: 'status-pending' },
                  { name: 'Johnathan Smith', provider: 'Aetna Health', amount: '$2,100.00', status: 'Denied', statusClass: 'status-problem' },
                  { name: 'Samantha Reed', provider: 'Medicare Part B', amount: '$890.00', status: 'Submitted', statusClass: 'status-new' },
                  { name: 'Robert Chen', provider: 'Cigna Group', amount: '$15,400.00', status: 'Paid', statusClass: 'status-done' },
                ].map((item, i) => (
                  <tr key={i} className="hover:bg-bg-hover/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-text-primary font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-text-muted">{item.provider}</td>
                    <td className="px-6 py-4 text-sm text-text-primary tabular-nums">{item.amount}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={cn("status-badge", item.statusClass)}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-bg-card rounded-xl border border-border flex flex-col p-6">
          <h3 className="text-sm font-semibold text-text-heading mb-8">Revenue Trends (7 Days)</h3>
          <div className="flex-1 flex flex-col justify-end min-h-[160px]">
             <div className="h-28 flex items-end gap-2 px-2">
                {[40, 65, 35, 90, 55, 75, 85].map((h, i) => (
                  <div key={i} className="flex-1 bg-brand/20 group relative rounded-t-sm hover:bg-brand transition-colors cursor-pointer" style={{ height: `${h}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-active border border-border px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      ${h * 100}
                    </div>
                  </div>
                ))}
             </div>
             <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-text-dim">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <span key={d}>{d}</span>)}
             </div>
          </div>
          <div className="mt-10 pt-8 border-t border-border space-y-4">
             <div className="flex justify-between items-center text-[12px]">
                <span className="text-text-muted">Top Payer</span>
                <span className="text-text-heading font-semibold">Blue Cross (42%)</span>
             </div>
             <div className="flex justify-between items-center text-[12px]">
                <span className="text-text-muted">Collection Rate</span>
                <span className="text-green-500 font-semibold">98.2%</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <ProtectedLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/patients" element={<PatientsPage />} />
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route path="/records" element={<RecordsPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/claims" element={<ClaimsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/audit" element={<AuditLogsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  {/* Other routes will be added here */}
                  <Route path="*" element={<div className="text-text-muted">This module is coming soon...</div>} />
                </Routes>
              </ProtectedLayout>
            }
          />
        </Routes>
      </Router>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1A1A1A',
          color: '#FFFFFF',
          border: '1px solid #1F1F1F',
        }
      }} />
    </AuthProvider>
  );
}
