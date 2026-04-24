import { useState } from 'react';
import { Settings, User, Building, Shield, Bell, Save, Loader2, Globe, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const { user, organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'organization' | 'security'>('profile');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [orgForm, setOrgForm] = useState({
    name: organization?.name || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate save
    setTimeout(() => {
      toast.success('Configuration synchronized successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end bg-bg-card border border-border p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center">
              <Settings className="w-8 h-8 text-brand" />
           </div>
           <div>
              <h1 className="text-3xl font-bold text-text-heading tracking-tight mb-1">Clinic Settings</h1>
              <p className="text-text-muted">Control your infrastructure, profile, and security preferences</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-2">
          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'organization', label: 'Organization', icon: Building, adminOnly: true },
            { id: 'security', label: 'Security & Privacy', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((item: any) => (
            (!item.adminOnly || user?.role === 'ADMIN') && (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border border-transparent",
                  activeSection === item.id 
                    ? "bg-bg-active text-brand border-border shadow-sm" 
                    : "text-text-dim hover:bg-bg-hover hover:text-text-primary"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="uppercase tracking-widest text-[10px]">{item.label}</span>
              </button>
            )
          ))}
        </aside>

        <div className="flex-1">
          <form onSubmit={handleSave} className="bg-bg-card border border-border rounded-2xl shadow-2xl p-10 space-y-10">
            {activeSection === 'profile' && (
              <div className="space-y-8">
                 <div className="flex items-center gap-4 pb-6 border-b border-border">
                    <div className="w-20 h-20 bg-bg-active border-2 border-border rounded-3xl flex items-center justify-center text-3xl font-bold text-brand shadow-inner">
                       {user?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-text-heading">Profile Attributes</h3>
                       <p className="text-xs text-text-dim font-bold uppercase tracking-widest mt-1">Personnel ID: {user?.id.slice(0, 8)}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Full Identity</label>
                       <input 
                         type="text" 
                         className="w-full bg-bg-active border border-border rounded-xl px-5 py-4 text-sm text-text-primary focus:ring-2 focus:ring-brand outline-none transition-all"
                         value={profileForm.name}
                         onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Verified Email</label>
                       <input 
                         type="email" 
                         disabled
                         className="w-full bg-bg-active border border-border rounded-xl px-5 py-4 text-sm text-text-dim cursor-not-allowed font-medium"
                         value={profileForm.email}
                       />
                    </div>
                 </div>
              </div>
            )}

            {activeSection === 'organization' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                 <div className="flex items-center gap-4 pb-6 border-b border-border">
                    <div className="w-20 h-20 bg-brand/10 border-2 border-brand/20 rounded-3xl flex items-center justify-center text-4xl text-brand">
                       <Building className="w-10 h-10" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-text-heading">Corporate Infrastructure</h3>
                       <p className="text-xs text-text-dim font-bold uppercase tracking-widest mt-1">Tenant ID: {organization?.id.slice(0, 8)}</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Organization Name</label>
                       <input 
                         type="text" 
                         className="w-full bg-bg-active border border-border rounded-xl px-5 py-4 text-sm text-text-primary focus:ring-2 focus:ring-brand outline-none transition-all"
                         value={orgForm.name}
                         onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-5 bg-bg-active border border-border rounded-xl">
                          <Globe className="w-5 h-5 text-text-dim mb-3" />
                          <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Timezone</p>
                          <p className="text-xs font-bold text-text-heading">UTC+0 (London, GMT)</p>
                       </div>
                       <div className="p-5 bg-bg-active border border-border rounded-xl">
                          <Lock className="w-5 h-5 text-text-dim mb-3" />
                          <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Data Sovereignty</p>
                          <p className="text-xs font-bold text-text-heading">AES-256 Encrypted</p>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            <div className="pt-10 border-t border-border flex justify-end">
               <button 
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-brand hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-xs transition-all shadow-xl shadow-brand/20 active:scale-95 disabled:opacity-50"
               >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                SYNCHRONIZE CHANGES
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
