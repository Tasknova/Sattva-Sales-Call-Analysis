import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/components/Dashboard";
import ProfilePage from "@/components/ProfilePage";
import AdminLogin from "@/components/auth/AdminLogin";
import LoginOptions from "@/components/auth/LoginOptions";
import ManagerLogin from "@/components/auth/ManagerLogin";
import EmployeeLogin from "@/components/auth/EmployeeLogin";

type ViewType = 'admin-login' | 'login-options' | 'manager-login' | 'employee-login' | 'dashboard' | 'profile';

const Index = () => {
  const { user, userRole, company, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('login-options');
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

    // Don't interfere with login screens - let user navigate between them
    const loginScreens: ViewType[] = ['login-options', 'admin-login', 'manager-login', 'employee-login'];
    if (!user && loginScreens.includes(currentView)) {
      console.log('User on login screen, staying on current view');
      return;
    }

    if (!user) {
      console.log('No user, going to login options');
      setCurrentView('login-options');
      return;
    }

    // Don't change view if already on dashboard or profile - prevents back button issues
    if (currentView === 'dashboard' || currentView === 'profile') {
      console.log('Already on dashboard/profile, not changing view');
      return;
    }

    // User is authenticated, redirect to dashboard
    if (userRole) {
      console.log('User authenticated with role, going to dashboard');
      setCurrentView('dashboard');
    } else {
      console.log('User authenticated but no role found');
      // Stay on current view (likely a login screen)
    }
  }, [user, userRole, company, authLoading, currentView]);

  const handleAdminLogin = () => {
    setCurrentView('admin-login');
  };

  const handleManagerLogin = () => {
    setCurrentView('manager-login');
  };

  const handleEmployeeLogin = () => {
    setCurrentView('employee-login');
  };

  const handleLoginComplete = () => {
    setCurrentView('dashboard');
  };

  const handleShowProfile = () => {
    setCurrentView('profile');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };


  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render based on current view
  switch (currentView) {
    case 'admin-login':
      return <AdminLogin onComplete={handleLoginComplete} onBack={() => setCurrentView('login-options')} />;
    
    case 'login-options':
      return (
        <LoginOptions
          onAdminLogin={handleAdminLogin}
          onManagerLogin={handleManagerLogin}
          onEmployeeLogin={handleEmployeeLogin}
          onBack={() => setCurrentView('login-options')}
        />
      );
    
    case 'manager-login':
      return <ManagerLogin onComplete={handleLoginComplete} onBack={() => setCurrentView('login-options')} />;
    
    case 'employee-login':
      return <EmployeeLogin onComplete={handleLoginComplete} onBack={() => setCurrentView('login-options')} />;
    
    case 'profile':
      return <ProfilePage onBack={handleBackToDashboard} />;
    
    case 'dashboard':
      return <Dashboard onShowProfile={handleShowProfile} />;
    
    default:
      return (
        <LoginOptions
          onAdminLogin={handleAdminLogin}
          onManagerLogin={handleManagerLogin}
          onEmployeeLogin={handleEmployeeLogin}
          onBack={() => setCurrentView('login-options')}
        />
      );
  }
};

export default Index;
