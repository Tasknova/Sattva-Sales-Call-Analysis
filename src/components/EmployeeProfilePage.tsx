import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit2, Save, X, User, Mail, Phone, Lock } from 'lucide-react';

interface EmployeeProfilePageProps {
  onBack: () => void;
}

interface EmployeeProfile {
  id: string;
  full_name: string;
  email: string;
  contact_number?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function EmployeeProfilePage({ onBack }: EmployeeProfilePageProps) {
  const { user, userRole, signOut, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    contact_number: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [user, userRole]);

  const fetchProfile = async () => {
    if (!user || !userRole) return;

    try {
      // Fetch employee profile from employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (employeeError) {
        console.error('Error fetching employee profile:', employeeError);
        return;
      }

      if (employeeData) {
        setProfile(employeeData);
        setFormData({
          full_name: employeeData.full_name || '',
          contact_number: employeeData.contact_number || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !userRole) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          full_name: formData.full_name,
          contact_number: formData.contact_number,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update local profile state
      setProfile(prev => prev ? {
        ...prev,
        full_name: formData.full_name,
        contact_number: formData.contact_number,
        updated_at: new Date().toISOString(),
      } : null);
      
      // Update localStorage session to reflect new name
      const customSession = localStorage.getItem('custom_auth_session');
      if (customSession) {
        try {
          const sessionData = JSON.parse(customSession);
          sessionData.user.user_metadata.full_name = formData.full_name;
          localStorage.setItem('custom_auth_session', JSON.stringify(sessionData));
          console.log('Updated session in localStorage with new name');
        } catch (e) {
          console.error('Error updating localStorage session:', e);
        }
      }
      
      // Refresh user data in AuthContext to update the header
      if (refreshUserData) {
        await refreshUserData();
      }
      
      setEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    if (!passwordData.current_password) {
      toast({
        title: 'Error',
        description: 'Please enter your current password.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Verify current password first
      const { data: employeeData, error: verifyError } = await supabase
        .from('employees')
        .select('password')
        .eq('user_id', user.id)
        .single();

      if (verifyError || !employeeData) {
        throw new Error('Failed to verify current password');
      }

      if (employeeData.password !== passwordData.current_password) {
        toast({
          title: 'Error',
          description: 'Current password is incorrect.',
          variant: 'destructive',
        });
        return;
      }

      // Update password in employees table
      const { error } = await supabase
        .from('employees')
        .update({
          password: passwordData.new_password,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setPasswordEditing(false);
      
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage 
                    src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
                    alt="Profile picture"
                    className="object-cover"
                  />
                  <AvatarFallback className="text-lg">
                    {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 
                     user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">
                  {profile?.full_name || user?.user_metadata?.full_name || 'Employee'}
                </CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.full_name || 'Name not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.contact_number || 'Contact not set'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Manage your personal details
                  </CardDescription>
                </div>
                {!editing ? (
                  <Button onClick={() => setEditing(true)} size="sm">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditing(false)} 
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      disabled={!editing}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_number">Contact Number</Label>
                    <Input
                      id="contact_number"
                      type="tel"
                      value={formData.contact_number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                        if (value.length <= 10) {
                          setFormData(prev => ({ ...prev, contact_number: value }));
                        }
                      }}
                      disabled={!editing}
                      placeholder="Enter 10-digit contact number"
                      maxLength={10}
                      pattern="[0-9]{10}"
                    />
                    {editing && formData.contact_number && formData.contact_number.length !== 10 && (
                      <p className="text-xs text-red-500 mt-1">Contact number must be exactly 10 digits</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your account password
                  </CardDescription>
                </div>
                {!passwordEditing ? (
                  <Button onClick={() => setPasswordEditing(true)} size="sm" variant="outline">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handlePasswordChange} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setPasswordEditing(false);
                        setPasswordData({
                          current_password: '',
                          new_password: '',
                          confirm_password: '',
                        });
                      }} 
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>
              {passwordEditing && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
