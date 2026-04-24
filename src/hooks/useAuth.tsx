import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'BILLING_STAFF';
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (data: any) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setOrganization(data.organization);
      } else {
        // DEMO MODE FALLBACK: If API fails or no token, use mock data
        console.warn('Backend unavailable, enabling Demo Mode');
        setUser({
          id: 'demo-user-id',
          email: 'demo@medipro.com',
          name: 'Ahmed Faizan (Demo)',
          role: 'ADMIN'
        });
        setOrganization({
          id: 'demo-org-id',
          name: 'MediCare Pro Demo Clinic',
          slug: 'demo-clinic'
        });
        
        // If the token is invalid, clear it
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Auth check failed - Falling back to Demo Mode', error);
      setUser({
        id: 'demo-user-id',
        email: 'demo@medipro.com',
        name: 'Ahmed Faizan (Demo)',
        role: 'ADMIN'
      });
      setOrganization({
        id: 'demo-org-id',
        name: 'MediCare Pro Demo Clinic',
        slug: 'demo-clinic'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (data: any) => {
    setUser(data.user);
    setOrganization(data.organization);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
