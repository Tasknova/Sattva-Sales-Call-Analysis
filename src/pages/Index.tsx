import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, UserProfile } from "@/lib/supabase";
import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";
import ProfilePage from "@/components/ProfilePage";
import OnboardingFlow from "@/components/OnboardingFlow";
import AuthModal from "@/components/AuthModal";
import RoleSelection from "@/components/auth/RoleSelection";
import SimpleAdminSignup from "@/components/auth/SimpleAdminSignup";
import AdminLogin from "@/components/auth/AdminLogin";
import LoginOptions from "@/components/auth/LoginOptions";
import CompanyOnboarding from "@/components/auth/CompanyOnboarding";
import ManagerLogin from "@/components/auth/ManagerLogin";
import EmployeeLogin from "@/components/auth/EmployeeLogin";

type ViewType = 'landing' | 'role-selection' | 'admin-signup' | 'admin-login' | 'login-options' | 'company-onboarding' | 'manager-login' | 'employee-login' | 'auth' | 'onboarding' | 'dashboard' | 'profile';

const Index = () => {
  const { user, userRole, company, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Check if we should show dashboard based on URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && user) {
      setCurrentView('dashboard');
    }
  }, [searchParams, user]);

  // Handle authentication state changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      authLoading, 
      user: !!user, 
      userRole: !!userRole, 
      company: !!company,
      userRoleData: userRole,
      companyData: company,
      currentView
    });

    if (authLoading) {
      console.log('Still loading auth...');
      return;
    }

    if (!user) {
      console.log('No user, going to landing');
      setCurrentView('landing');
      return;
    }

    // User is authenticated, check their role and company status
    if (userRole && company) {
      console.log('User has role and company');
      console.log('Role data:', userRole);
      console.log('Company data:', company);
      setCurrentView('dashboard');
    } else if (userRole && !company) {
      console.log('User has role but no company, going to company onboarding');
      console.log('Role data:', userRole);
      setCurrentView('company-onboarding');
    } else if (!userRole) {
      // Check if this is a new user or an existing user with missing data
      console.log('User authenticated but no role, checking if new user or data issue');
      console.log('User ID:', user?.id);
      
      // Check if user has any existing data in the database
      // If they have a profile but no role, it might be a data issue
      // If they have no profile at all, they're likely a new user
      console.log('Checking user profile to determine if new user...');
      
      // Check if user has any existing data in the database
      // If they have a profile but no role, it might be a data issue
      // If they have no profile at all, they're likely a new user
      console.log('Checking user profile to determine if new user...');
      
      // Check if user has any existing data in the database
      // If they have a profile but no role, it might be a data issue
      // If they have no profile at all, they're likely a new user
      console.log('Checking user profile to determine if new user...');
      
      // Check if user has any existing data in the database
      // If they have a profile but no role, it might be a data issue
      // If they have no profile at all, they're likely a new user
      console.log('Checking user profile to determine if new user...');
      
      // For now, assume it's a new user and redirect to company onboarding
      // TODO: Add better logic to distinguish between new users and data issues
      console.log('Assuming new user, going to company onboarding');
      setCurrentView('company-onboarding');
    } else {
      console.log('Unknown state, staying on current view');
      console.log('Current state:', { userRole, company });
      // Don't change view if we're not sure about the state
    }
  }, [user, userRole, company, authLoading]);

  const fetchUserProfile = async () => {
    if (!user) return;

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no record exists

      if (error) {
        console.error('Error fetching profile:', error);
        // If it's a 406 or other error, still proceed to onboarding
        setCurrentView('onboarding');
        return;
      }

      setUserProfile(data);

      if (!data || !data.onboarding_completed) {
        setCurrentView('onboarding');
      } else {
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // On any error, default to onboarding
      setCurrentView('onboarding');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleGetStarted = () => {
    setCurrentView('role-selection');
  };

  const handleLogin = () => {
    setCurrentView('login-options');
  };

  const handleSignup = () => {
    setCurrentView('admin-signup');
  };

  const handleLoginOptions = () => {
    setCurrentView('login-options');
  };

  const handleAdminLogin = () => {
    setCurrentView('admin-login');
  };

  const handleManagerLogin = () => {
    setCurrentView('manager-login');
  };

  const handleEmployeeLogin = () => {
    setCurrentView('employee-login');
  };

  const handleAdminSignupComplete = () => {
    setCurrentView('company-onboarding');
  };

  const handleCompanyOnboardingComplete = () => {
    setCurrentView('dashboard');
  };

  const handleManagerLoginComplete = () => {
    setCurrentView('dashboard');
  };

  const handleEmployeeLoginComplete = () => {
    setCurrentView('dashboard');
  };

  const handleOnboardingComplete = () => {
    fetchUserProfile(); // Refetch profile and navigate to dashboard
  };

  const handleShowProfile = () => {
    setCurrentView('profile');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };


  // Show loading spinner while checking auth state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
          <p className="text-xs text-muted-foreground mt-2">
            {authLoading ? 'Authenticating...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  // Render based on current view
  switch (currentView) {
    case 'landing':
      return <LandingPage onGetStarted={handleGetStarted} onLogin={handleLogin} onSignup={handleSignup} />;
    
    case 'role-selection':
      return (
        <RoleSelection
          onSignup={handleSignup}
          onLogin={handleLoginOptions}
          onBack={() => setCurrentView('landing')}
        />
      );
    
    case 'admin-signup':
      return <SimpleAdminSignup onComplete={handleAdminSignupComplete} onBack={() => setCurrentView('role-selection')} />;
    
    case 'admin-login':
      return <AdminLogin onComplete={handleAdminSignupComplete} onBack={() => setCurrentView('login-options')} />;
    
    case 'login-options':
      return (
        <LoginOptions
          onAdminLogin={handleAdminLogin}
          onManagerLogin={handleManagerLogin}
          onEmployeeLogin={handleEmployeeLogin}
          onBack={() => setCurrentView('role-selection')}
        />
      );
    
    case 'company-onboarding':
      return <CompanyOnboarding onComplete={handleCompanyOnboardingComplete} onBack={() => setCurrentView('admin-signup')} />;
    
    case 'manager-login':
      return <ManagerLogin onComplete={handleManagerLoginComplete} onBack={() => setCurrentView('login-options')} />;
    
    case 'employee-login':
      return <EmployeeLogin onComplete={handleEmployeeLoginComplete} onBack={() => setCurrentView('login-options')} />;
    
    case 'auth':
      return (
        <>
          <LandingPage onGetStarted={handleGetStarted} onLogin={handleLogin} onSignup={handleSignup} />
          <AuthModal 
            isOpen={true} 
            onClose={() => setCurrentView('landing')} 
          />
        </>
      );
    
    case 'onboarding':
      return <OnboardingFlow onComplete={handleOnboardingComplete} />;
    
    case 'profile':
      return <ProfilePage onBack={handleBackToDashboard} />;
    
    case 'dashboard':
      return <Dashboard onShowProfile={handleShowProfile} />;
    
    default:
      return <LandingPage onGetStarted={handleGetStarted} onLogin={handleLogin} onSignup={handleSignup} />;
  }
};

export default Index;
