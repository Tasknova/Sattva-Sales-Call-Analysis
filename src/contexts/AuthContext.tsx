import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface UserRole {
  id: string;
  user_id: string;
  company_id: string;
  role: 'admin' | 'manager' | 'employee';
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  industry?: string;
  phone?: string;
  address?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  company: Company | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInAdmin: (email: string, password: string) => Promise<User>;
  signInManager: (email: string, password: string, companyId: string) => Promise<User>;
  signInEmployee: (email: string, password: string, companyId: string) => Promise<User>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ user: User; needsConfirmation: boolean }>;
  refreshUserData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role and company data
  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      console.log('Fetching user data for user:', userId);
      // Fetch user role - prioritize admin role (oldest created)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        console.log('Role error details:', roleError);
        
        // If it's a "multiple rows" error, try to get the first one
        if (roleError.code === 'PGRST116') {
          console.log('Multiple roles found, fetching the first one...');
          const { data: multipleRoles, error: multipleError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1);
            
          if (multipleError || !multipleRoles || multipleRoles.length === 0) {
            console.log('No role data found after handling multiple roles');
            setUserRole(null);
            setCompany(null);
            setLoading(false);
            return;
          }
          
          // Use the first role
          const firstRole = multipleRoles[0];
          console.log('Using first role:', firstRole);
          setUserRole(firstRole);
          
          // Fetch company data for this role using RPC (bypasses RLS)
          if (firstRole?.company_id) {
            console.log('Fetching company data for company_id:', firstRole.company_id);
            const { data: companies, error: companyError } = await supabase
              .rpc('get_company_by_id', {
                p_company_id: firstRole.company_id
              });

            if (companyError) {
              console.error('Error fetching company:', companyError);
              setCompany(null);
            } else if (companies && companies.length > 0) {
              console.log('Company data fetched:', companies[0]);
              setCompany(companies[0]);
            } else {
              setCompany(null);
            }
          } else {
            setCompany(null);
          }
          
          setLoading(false);
          return;
        }
        
        setUserRole(null);
        setCompany(null);
        setLoading(false);
        return;
      }

      if (!roleData) {
        console.log('No role data found for user:', userId);
        setUserRole(null);
        setCompany(null);
        setLoading(false);
        return;
      }

      console.log('User role fetched:', roleData);
      setUserRole(roleData);

      // Fetch company data using RPC (bypasses RLS)
      if (roleData?.company_id) {
        console.log('Fetching company data for company_id:', roleData.company_id);
        const { data: companies, error: companyError } = await supabase
          .rpc('get_company_by_id', {
            p_company_id: roleData.company_id
          });

        if (companyError) {
          console.error('Error fetching company:', companyError);
          console.log('Company error details:', companyError);
          setCompany(null);
          setLoading(false);
          return;
        }

        if (!companies || companies.length === 0) {
          console.log('No company data found for company_id:', roleData.company_id);
          setCompany(null);
          setLoading(false);
          return;
        }

        console.log('Company data fetched:', companies[0]);
        setCompany(companies[0]);
      } else {
        console.log('No company_id in role data');
        setCompany(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      console.log('Fetch user data error details:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      console.log('Getting initial session...');
      
      // Check for custom authentication session first
      const customSession = localStorage.getItem('custom_auth_session');
      if (customSession) {
        try {
          const sessionData = JSON.parse(customSession);
          console.log('Found custom session:', sessionData);
          
          // Check if session is expired (24 hours)
          const sessionAge = Date.now() - (sessionData.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
          
          if (sessionAge > maxAge) {
            console.log('Custom session expired, clearing...');
            localStorage.removeItem('custom_auth_session');
          } else {
            // Restore the session
            setUser(sessionData.user);
            setUserRole(sessionData.userRole);
            setCompany(sessionData.company);
            setSession(sessionData.session);
            
            console.log('Restored custom session successfully');
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing custom session:', error);
          localStorage.removeItem('custom_auth_session');
        }
      }
      
      // Fallback to Supabase Auth session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('User found in session, fetching user data for:', session.user.id);
        await fetchUserData(session.user.id);
      } else {
        console.log('No user in session, setting loading to false');
        setLoading(false);
      }
    };

    getSession();
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Auth loading timeout - forcing loading to false');
      console.log('Current state:', { user: !!user, userRole, company });
      setLoading(false);
    }, 15000); // 15 second timeout
    
    return () => {
      clearTimeout(timeout);
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, 'Session:', session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Auth state change - user found, fetching data for:', session.user.id);
          await fetchUserData(session.user.id);
        } else {
          console.log('Auth state change - no user, clearing data');
          setUserRole(null);
          setCompany(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signInManager = async (email: string, password: string) => {
    try {
      console.log('Attempting manager login for:', email);
      
      // Use RPC function to authenticate manager (bypasses RLS)
      const { data: managers, error: managerError } = await supabase
        .rpc('authenticate_manager', {
          p_email: email,
          p_password: password
        });

      if (managerError || !managers || managers.length === 0) {
        console.error('Manager not found or invalid credentials:', managerError);
        throw new Error('Invalid manager credentials');
      }

      const manager = managers[0];

      console.log('Manager found:', manager);
      
      // Check if role data is included (new function returns role info)
      if (!manager.role || manager.role !== 'manager') {
        console.log('No manager role found for user:', manager.user_id);
        throw new Error('Manager role not found for this user');
      }

      // Create userRoleData object from the returned data
      const userRoleData = {
        id: manager.role_id,
        user_id: manager.user_id,
        role: manager.role,
        company_id: manager.role_company_id,
        is_active: true
      };

      console.log('Set user role in context:', userRoleData);
      console.log('User role data role field:', userRoleData.role);

      // Create a mock user object for the session
      const mockUser = {
        id: manager.user_id,
        email: manager.email,
        user_metadata: {
          full_name: manager.full_name,
          role: 'manager'
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone: '',
        phone_confirmed_at: null,
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        factors: null,
        identities: [],
        email_confirmed_at: new Date().toISOString(),
        recovery_sent_at: null,
        new_email: null,
        invited_at: null,
        action_link: null,
        email_change_sent_at: null,
        new_phone: null,
        phone_change_sent_at: null,
        email_change_confirm_status: 0,
        banned_until: null,
        is_anonymous: false
      } as any;

      // Set the user in the context ONLY after all validations pass
      setUser(mockUser);
      setUserRole(userRoleData);
      console.log('Set user in context:', mockUser);

      // Fetch company data using RPC function (bypasses RLS)
      let companyData = null;
      if (userRoleData?.company_id) {
        const { data: companies, error: companyError} = await supabase
          .rpc('get_company_by_id', {
            p_company_id: userRoleData.company_id
          });

        console.log('Manager company query result:', companies);
        console.log('Manager company query error:', companyError);

        if (companies && companies.length > 0) {
          const company = companies[0];
          setCompany(company);
          companyData = company;
          console.log('Set manager company in context:', company);
        }
      }

      // Save session to localStorage for persistence
      const sessionData = {
        user: mockUser,
        userRole: userRoleData,
        company: companyData,
        session: null, // No Supabase session for custom auth
        timestamp: Date.now()
      };
      
      localStorage.setItem('custom_auth_session', JSON.stringify(sessionData));
      console.log('Saved custom session to localStorage');

      return mockUser;
    } catch (error) {
      console.error('Error signing in manager:', error);
      // Clear any existing Supabase Auth session on failure
      await supabase.auth.signOut();
      throw error;
    }
  };

  const signInAdmin = async (email: string, password: string) => {
    try {
      console.log('Attempting admin login for:', email);
      
      // Use RPC function to authenticate admin (bypasses RLS)
      const { data: admins, error: adminError } = await supabase
        .rpc('authenticate_admin', {
          p_email: email,
          p_password: password
        });

      if (adminError || !admins || admins.length === 0) {
        console.error('Admin not found or invalid credentials:', adminError);
        throw new Error('Invalid admin credentials');
      }

      const admin = admins[0];

      console.log('Admin found:', admin);
      
      // Check if role data is included (new function returns role info)
      if (!admin.role || admin.role !== 'admin') {
        console.log('No admin role found for user:', admin.user_id);
        throw new Error('Admin role not found for this user');
      }

      // Create userRoleData object from the returned data
      const userRoleData = {
        id: admin.role_id,
        user_id: admin.user_id,
        role: admin.role,
        company_id: admin.role_company_id,
        is_active: true
      };

      console.log('Set admin user role in context:', userRoleData);
      console.log('User role data role field:', userRoleData.role);

      // Create a mock user object for the session
      const mockUser = {
        id: admin.user_id,
        email: admin.email,
        user_metadata: {
          full_name: admin.full_name,
          role: 'admin'
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone: '',
        phone_confirmed_at: null,
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        factors: null,
        identities: [],
        email_confirmed_at: new Date().toISOString(),
        recovery_sent_at: null,
        new_email: null,
        invited_at: null,
        action_link: null,
        email_change_sent_at: null,
        new_phone: null,
        phone_change_sent_at: null,
        email_change_confirm_status: 0,
        banned_until: null,
        is_anonymous: false
      } as any;

      // Set the user in the context ONLY after all validations pass
      setUser(mockUser);
      setUserRole(userRoleData);
      console.log('Set admin user in context:', mockUser);

      // Fetch company data using RPC (bypasses RLS)
      let companyData = null;
      if (userRoleData?.company_id) {
        const { data: companies, error: companyError } = await supabase
          .rpc('get_company_by_id', {
            p_company_id: userRoleData.company_id
          });

        console.log('Company query result:', companies);
        console.log('Company query error:', companyError);

        if (companies && companies.length > 0) {
          const company = companies[0];
          setCompany(company);
          companyData = company;
          console.log('Set company in context:', company);
        }
      }

      // Save session to localStorage for persistence
      const sessionData = {
        user: mockUser,
        userRole: userRoleData,
        company: companyData,
        session: null, // No Supabase session for custom auth
        timestamp: Date.now()
      };
      
      localStorage.setItem('custom_auth_session', JSON.stringify(sessionData));
      console.log('Saved custom admin session to localStorage');

      return mockUser;
    } catch (error) {
      console.error('Error signing in admin:', error);
      // Clear any existing Supabase Auth session on failure
      await supabase.auth.signOut();
      throw error;
    }
  };

  const signInEmployee = async (email: string, password: string) => {
    try {
      console.log('Attempting employee login for:', email);
      
      // Use RPC function to authenticate employee (bypasses RLS)
      const { data: employees, error: employeeError } = await supabase
        .rpc('authenticate_employee', {
          p_email: email,
          p_password: password
        });

      if (employeeError || !employees || employees.length === 0) {
        console.error('Employee not found or invalid credentials:', employeeError);
        throw new Error('Invalid employee credentials');
      }

      const employee = employees[0];

      console.log('Employee found:', employee);
      console.log('Employee ID fields:', {
        id: employee.id,
        user_id: employee.user_id,
        role_id: employee.role_id
      });
      
      // Check if role data is included (new function returns role info)
      if (!employee.role || employee.role !== 'employee') {
        console.log('No employee role found for user:', employee.user_id);
        throw new Error('Employee role not found for this user');
      }

      // Create userRoleData object from the returned data
      // Use the employees table ID (e.id from RPC), not user_roles.id
      const userRoleData = {
        id: employee.id, // This is e.id from employees table (first column in SELECT)
        user_id: employee.user_id,
        role: employee.role,
        company_id: employee.role_company_id,
        is_active: true
      };

      console.log('Created userRoleData:', userRoleData);
      console.log('User role data role field:', userRoleData.role);

      // Create a mock user object for the session
      const mockUser = {
        id: employee.user_id,
        email: employee.email,
        user_metadata: {
          full_name: employee.full_name,
          role: 'employee'
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone: '',
        phone_confirmed_at: null,
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        factors: null,
        identities: [],
        email_confirmed_at: new Date().toISOString(),
        recovery_sent_at: null,
        new_email: null,
        invited_at: null,
        action_link: null,
        email_change_sent_at: null,
        new_phone: null,
        phone_change_sent_at: null,
        email_change_confirm_status: 0,
        banned_until: null,
        is_anonymous: false
      } as any;

      // Set the user in the context ONLY after all validations pass
      setUser(mockUser);
      setUserRole(userRoleData);
      console.log('Set user in context:', mockUser);

      // Fetch company data using RPC function (bypasses RLS)
      let companyData = null;
      if (userRoleData?.company_id) {
        const { data: companies, error: companyError } = await supabase
          .rpc('get_company_by_id', {
            p_company_id: userRoleData.company_id
          });

        console.log('Company query result:', companies);
        console.log('Company query error:', companyError);

        if (companies && companies.length > 0) {
          const company = companies[0];
          setCompany(company);
          companyData = company;
          console.log('Set company in context:', company);
        }
      }

      // Save session to localStorage for persistence
      const sessionData = {
        user: mockUser,
        userRole: userRoleData,
        company: companyData,
        session: null, // No Supabase session for custom auth
        timestamp: Date.now()
      };
      
      localStorage.setItem('custom_auth_session', JSON.stringify(sessionData));
      console.log('Saved custom session to localStorage');

      return mockUser;
    } catch (error) {
      console.error('Error signing in employee:', error);
      // Clear any existing Supabase Auth session on failure
      await supabase.auth.signOut();
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }

    console.log('Signup response:', { user: data.user, session: data.session });

    // Auto-confirm email if user was created but email not confirmed
    if (data.user && !data.user.email_confirmed_at) {
      console.log('Auto-confirming email for user:', data.user.email);
      try {
        // Update the user's email_confirmed_at in the database
        const { error: confirmError } = await supabase.rpc('confirm_user_email', {
          user_id: data.user.id
        });
        
        if (confirmError) {
          console.error('Error auto-confirming email:', confirmError);
          // Try direct SQL update as fallback
          await supabase
            .from('auth.users')
            .update({ email_confirmed_at: new Date().toISOString() })
            .eq('id', data.user.id);
        }
      } catch (confirmError) {
        console.error('Failed to auto-confirm email:', confirmError);
        // Continue anyway - user can still be created
      }
    }

    // If signup is successful, update the user state immediately
    if (data.user) {
      setUser(data.user);
      setSession(data.session);
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      console.log('Email confirmation required. User created but session not available.');
      // Don't throw error, let the UI handle the confirmation flow
      return { user: data.user, needsConfirmation: true };
    }

    return { user: data.user, needsConfirmation: false };
  };

  const refreshUserData = async () => {
    // Check if using custom auth (employee/manager)
    const customSession = localStorage.getItem('custom_auth_session');
    if (customSession) {
      try {
        const sessionData = JSON.parse(customSession);
        console.log('Refreshing user data from custom session:', sessionData);
        setUser(sessionData.user);
        setUserRole(sessionData.userRole);
        setCompany(sessionData.company);
        return;
      } catch (error) {
        console.error('Error refreshing custom session:', error);
      }
    }
    
    // Fallback to fetching from database for Supabase Auth users
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  const signOut = async () => {
    try {
      // Clear custom session from localStorage
      localStorage.removeItem('custom_auth_session');
      console.log('Cleared custom session from localStorage');
      
      // Clear local state
      setUser(null);
      setUserRole(null);
      setCompany(null);
      setSession(null);
      console.log('Cleared local state');
      
      // Clear Supabase Auth session
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    userRole,
    company,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signInAdmin,
    signInManager,
    signInEmployee,
    signUpWithEmail,
    refreshUserData,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
