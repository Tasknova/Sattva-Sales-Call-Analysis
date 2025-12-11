import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import CallHistoryManager from "@/components/CallHistoryManager";
import AdminReportsPage from "@/components/AdminReportsPage";
import ClientsPage from "@/components/ClientsPage";
import JobsPage from "@/components/JobsPage";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useClients, useJobs, useBulkAssignClients, useManagerClientAssignments, useUnassignClientFromManager } from "@/hooks/useSupabaseData";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { 
  Building, 
  Users, 
  UserPlus, 
  Phone, 
  TrendingUp, 
  Settings, 
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  LogOut,
  User,
  Mail,
  PhoneCall,
  Calendar,
  Shield,
  AlertTriangle,
  Filter,
  Save,
  X,
  RefreshCw,
  Edit2,
  History,
  BarChart3,
  Clock,
  Upload,
  FileText,
  ArrowLeft,
  CheckCircle,
  UserCog,
  Briefcase,
  ChevronRight,
  Download
} from "lucide-react";

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: string;
  phone?: string;
  profile?: { full_name: string; email: string; department?: string; password?: string } | null;
}

interface Manager extends User {
  employees: User[];
}

interface UserCredentials {
  email: string;
  password: string;
  role: string;
  name: string;
}

// Department options for managers
const DEPARTMENT_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'support', label: 'Customer Support' },
  { value: 'operations', label: 'Operations' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'other', label: 'Other' }
];

export default function AdminDashboard() {
  const { user, userRole, company, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Session timeout: 30 minutes for admin
  useSessionTimeout({ timeoutMinutes: 30, warningMinutes: 5 });
  
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadGroups, setLeadGroups] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [dailyProductivity, setDailyProductivity] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');
  const [isViewingGroupPage, setIsViewingGroupPage] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddLeadGroupModalOpen, setIsAddLeadGroupModalOpen] = useState(false);
  const [isEditLeadGroupModalOpen, setIsEditLeadGroupModalOpen] = useState(false);
  const [isViewLeadGroupModalOpen, setIsViewLeadGroupModalOpen] = useState(false);
  const [isDeleteLeadGroupModalOpen, setIsDeleteLeadGroupModalOpen] = useState(false);
  const [selectedLeadGroup, setSelectedLeadGroup] = useState<any>(null);
  const [isUploadCSVModalOpen, setIsUploadCSVModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLeads, setCsvLeads] = useState<any[]>([]);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvGroupOption, setCsvGroupOption] = useState<'none' | 'existing' | 'new'>('none');
  const [csvSelectedGroupId, setCsvSelectedGroupId] = useState<string>('');
  const [csvNewGroupName, setCsvNewGroupName] = useState<string>('');
  const [csvAssignedTo, setCsvAssignedTo] = useState<string>('unassigned');
  const [isViewLeadModalOpen, setIsViewLeadModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [isDeleteLeadModalOpen, setIsDeleteLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [isBulkGroupModalOpen, setIsBulkGroupModalOpen] = useState(false);
  const [bulkAssignManagerId, setBulkAssignManagerId] = useState<string>('');
  const [bulkGroupOption, setBulkGroupOption] = useState<'existing' | 'new'>('existing');
  const [bulkSelectedGroupId, setBulkSelectedGroupId] = useState<string>('');
  const [bulkNewGroupName, setBulkNewGroupName] = useState<string>('');
  const [leadsSection, setLeadsSection] = useState<'leads' | 'groups'>('leads');
  const [addUserType, setAddUserType] = useState<'manager' | 'employee'>('manager');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [analysisSearchTerm, setAnalysisSearchTerm] = useState("");
  const [selectedAnalysisEmployee, setSelectedAnalysisEmployee] = useState<string>("all");
  const [selectedClosureProbability, setSelectedClosureProbability] = useState<string>("all");
  const [selectedManagerFilterLeads, setSelectedManagerFilterLeads] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<UserCredentials | null>(null);
  const [copiedItems, setCopiedItems] = useState<{
    email: boolean;
    password: boolean;
  }>({ email: false, password: false });
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string>('all');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [showUserDetailsPassword, setShowUserDetailsPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
  });
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    industry: '',
  });
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [phoneAssignments, setPhoneAssignments] = useState<any[]>([]);
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "manager" as "manager" | "employee",
    managerId: "",
    department: "",
    phone: "",
  });
  const [customDepartment, setCustomDepartment] = useState("");
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    contact: "",
    description: "",
    assignedTo: "",
    groupId: "",
  });
  const [newLeadGroup, setNewLeadGroup] = useState({
    groupName: "",
    assignedTo: "",
  });

  const [editUser, setEditUser] = useState({
    id: "",
    email: "",
    password: "",
    fullName: "",
    role: "manager" as "manager" | "employee",
    managerId: "",
    department: "",
    phone: "",
    is_active: true,
  });

  const [newEmployee, setNewEmployee] = useState({
    email: "",
    password: "",
    fullName: "",
    managerId: "",
    phone: "",
  });

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const { data: clients } = useClients();
  const { data: jobs } = useJobs();
  const bulkAssignClients = useBulkAssignClients();
  const { data: managerClientAssignments } = useManagerClientAssignments();
  const unassignClient = useUnassignClientFromManager();

  // Settings state
  const [companySettings, setCompanySettings] = useState({
    caller_id: "09513886363",
    from_numbers: ["7887766008"],
  });
  const [newFromNumber, setNewFromNumber] = useState("");

  // Fetch company data
  const fetchCompanyData = async () => {
    if (!userRole?.company_id) return;

    try {
      const { data: companies, error } = await supabase
        .rpc('get_company_by_id', {
          p_company_id: userRole.company_id
        });

      if (error) {
        console.error('Error fetching company:', error);
        return;
      }

      if (companies && companies.length > 0) {
        console.log('Fetched company data:', companies[0]);
        setCompanyProfile(companies[0]);
        setCompanyData({
          name: companies[0].name || '',
          email: companies[0].email || '',
          industry: companies[0].industry || '',
        });
      }
    } catch (error) {
      console.error('Error in fetchCompanyData:', error);
    }
  };

  // Fetch phone number assignments
  const fetchPhoneAssignments = async () => {
    if (!userRole?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select(`
          *,
          employees:employee_id(id, full_name, user_id),
          managers:manager_id(id, full_name)
        `)
        .eq('company_id', userRole.company_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching phone assignments:', error);
        return;
      }

      console.log('Fetched phone assignments:', data);
      setPhoneAssignments(data || []);
      
      // Also update companySettings.from_numbers for backward compatibility
      setCompanySettings(prev => ({
        ...prev,
        from_numbers: (data || []).map(d => d.phone_number)
      }));
    } catch (error) {
      console.error('Error in fetchPhoneAssignments:', error);
    }
  };

  // Fetch admin profile from admins table
  const fetchAdminProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching admin profile:', error);
        return;
      }

      if (data) {
        console.log('Fetched admin profile:', data);
        setAdminProfile(data);
        setProfileData({
          full_name: data.full_name || '',
          email: data.email || '',
        });
      }
    } catch (error) {
      console.error('Error in fetchAdminProfile:', error);
    }
  };

  useEffect(() => {
    if (userRole && company) {
      fetchUsers();
      fetchCompanySettings();
      fetchAdminProfile();
      fetchCompanyData();
      fetchPhoneAssignments();
    }
  }, [userRole, company]);

  // Initialize profile and company data
  useEffect(() => {
    if (adminProfile) {
      setProfileData({
        full_name: adminProfile.full_name || '',
        email: adminProfile.email || '',
      });
    }
    if (companyProfile) {
      setCompanyData({
        name: companyProfile.name || '',
        email: companyProfile.email || '',
        industry: companyProfile.industry || '',
      });
    }
  }, [adminProfile, companyProfile]);

  // Track addUserType changes
  useEffect(() => {
    console.log('addUserType changed to:', addUserType);
  }, [addUserType]);

  // Reset form when modal opens
  useEffect(() => {
    if (isAddUserModalOpen) {
      setNewUser({
        email: "",
        password: "",
        fullName: "",
        role: addUserType || "manager",
        managerId: "",
        department: "",
      });
      setShowPassword(false);
      console.log('Modal opened, addUserType should be:', addUserType);
    }
  }, [isAddUserModalOpen, addUserType]);

  const fetchUsers = async () => {
    if (!userRole?.company_id) return;

    try {
      setLoading(true);
      console.log('Fetching users for company:', userRole.company_id);

      // Fetch managers from managers table
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('*')
        .eq('company_id', userRole.company_id)
        .eq('is_active', true);

      if (managersError) {
        console.error('Error fetching managers:', managersError);
        throw managersError;
      }
      
      console.log('Fetched managers data:', managersData);
      console.log('Manager passwords:', managersData?.map(m => ({ name: m.full_name, password: m.password })));

      // Fetch employees from employees table
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          *,
          manager:managers!manager_id(full_name, department)
        `)
        .eq('company_id', userRole.company_id)
        .eq('is_active', true);

      if (employeesError) throw employeesError;

      console.log('Managers found:', managersData);
      console.log('Employees found:', employeesData);
      console.log('Employee passwords:', employeesData?.map(e => ({ name: e.full_name, password: e.password })));

      // Transform managers data to match expected format
      const managersWithEmployees = managersData?.map(manager => {
        console.log('Transforming manager:', manager.full_name, 'Password:', manager.password);
        return {
          id: manager.id,
          user_id: manager.user_id,
          company_id: manager.company_id,
          role: 'manager',
          manager_id: null,
          is_active: manager.is_active,
          created_at: manager.created_at,
          updated_at: manager.updated_at,
          profile: {
            full_name: manager.full_name,
            email: manager.email,
            department: manager.department,
            password: manager.password
          },
          employees: employeesData?.filter(emp => emp.manager_id === manager.id) || []
        };
      }) || [];

      // Transform employees data to match expected format
      const employeesWithProfiles = employeesData?.map(employee => {
        console.log('Transforming employee:', employee.full_name, 'Password:', employee.password);
        return {
          id: employee.id,
          user_id: employee.user_id,
          company_id: employee.company_id,
          role: 'employee',
          manager_id: employee.manager_id,
          is_active: employee.is_active,
          created_at: employee.created_at,
          updated_at: employee.updated_at,
          profile: {
            full_name: employee.full_name,
            email: employee.email,
            department: null,
            password: employee.password
          }
        };
      }) || [];

      setManagers(managersWithEmployees);
      setEmployees(employeesWithProfiles);

      // Fetch all leads for this company
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('company_id', userRole.company_id);

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
      } else {
        // Create lookup maps for faster access (O(1) instead of O(n) queries)
        const managersByUserId = new Map(managersData?.map(m => [m.user_id, { full_name: m.full_name, email: m.email }]) || []);
        const managersById = new Map(managersData?.map(m => [m.id, { full_name: m.full_name, email: m.email }]) || []);
        const employeesByUserId = new Map(employeesData?.map(e => [e.user_id, { full_name: e.full_name, email: e.email }]) || []);
        const employeesById = new Map(employeesData?.map(e => [e.id, { full_name: e.full_name, email: e.email }]) || []);

        // Process leads using lookup maps (much faster than individual queries)
        const leadsWithAssignments = (leadsData || []).map((lead) => {
            let assignedEmployee = null;
            let assignedManager = null;

            // Check if assigned_to exists
            if (lead.assigned_to) {
              // Check in managers first (by ID)
              assignedManager = managersById.get(lead.assigned_to);
              
              if (!assignedManager) {
                // Check employees by user_id or id
                assignedEmployee = employeesByUserId.get(lead.assigned_to) || employeesById.get(lead.assigned_to);
              }
            }

            // Check if user_id exists (manager or creator) - only if not already assigned
            if (lead.user_id && !assignedEmployee && !assignedManager) {
              // Check in managers by user_id
              assignedManager = managersByUserId.get(lead.user_id);
              
              if (!assignedManager) {
                // Check in employees by user_id
                assignedEmployee = employeesByUserId.get(lead.user_id);
              }
            }

            return {
              ...lead,
              assigned_employee: assignedEmployee,
              assigned_manager: assignedManager,
            };
          });

        setLeads(leadsWithAssignments);
        console.log('Fetched leads:', leadsWithAssignments);
      }

      // Fetch all lead groups for this company
      const { data: leadGroupsData, error: leadGroupsError } = await supabase
        .from('lead_groups')
        .select('*')
        .eq('company_id', userRole.company_id)
        .order('created_at', { ascending: false });

      if (leadGroupsError) {
        console.error('Error fetching lead groups:', leadGroupsError);
      } else {
        setLeadGroups(leadGroupsData || []);
        console.log('Fetched lead groups:', leadGroupsData);
      }

      // Fetch all calls for this company
      const { data: callsData, error: callsError } = await supabase
        .from('call_history')
        .select('*, leads(name, email, contact), employees(full_name, email)')
        .eq('company_id', userRole.company_id)
        .order('created_at', { ascending: false });

      if (callsError) {
        console.error('Error fetching calls:', callsError);
      } else {
        setCalls(callsData || []);
        console.log('Fetched calls:', callsData);
      }

      // Fetch employee daily productivity data
      const { data: productivityData, error: productivityError } = await supabase
        .from('employee_daily_productivity')
        .select('*')
        .eq('company_id', userRole.company_id)
        .order('date', { ascending: false });

      if (productivityError) {
        console.error('Error fetching productivity data:', productivityError);
      } else {
        setDailyProductivity(productivityData || []);
        console.log('Fetched daily productivity:', productivityData);
      }

      // Fetch all analyses for this company (via user_id from employees)
      const employeeUserIds = employeesData?.map(emp => emp.user_id) || [];
      const { data: rawAnalysesData, error: analysesError } = await supabase
        .from('analyses')
        .select(`*, recordings ( id, file_name, recording_url, status, call_history_id )`)
        .in('user_id', employeeUserIds);

      let analysesData = rawAnalysesData as any[] | null;

      if (!analysesError && analysesData && analysesData.length > 0) {
        const callHistoryIds = Array.from(new Set(
          analysesData.map((a: any) => a.recordings?.call_history_id).filter(Boolean)
        ));

        if (callHistoryIds.length > 0) {
          const { data: callsData, error: callsErr } = await supabase
            .from('call_history')
            .select('id, call_date, outcome, lead_id, employee_id, leads(name, email, contact), employees(full_name)')
            .in('id', callHistoryIds as any[]);

          const callHistoryMap = !callsErr && callsData ? Object.fromEntries(callsData.map((c: any) => [c.id, c])) : {};

          analysesData = analysesData.map((a: any) => ({
            ...a,
            recordings: {
              ...a.recordings,
              call_history: a.recordings?.call_history_id ? callHistoryMap[a.recordings.call_history_id] : undefined,
            }
          }));
        }
      }

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
      } else {
        setAnalyses(analysesData || []);
        console.log('Fetched analyses:', analysesData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    if (!userRole?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', userRole.company_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching company settings:', error);
        return;
      }

      if (data) {
        setCompanySettings({
          caller_id: data.caller_id || "09513886363",
          from_numbers: data.from_numbers || ["7887766008"],
        });
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const updateCompanySettings = async () => {
    if (!userRole?.company_id) return;

    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          company_id: userRole.company_id,
          caller_id: companySettings.caller_id,
          from_numbers: companySettings.from_numbers,
        }, {
          onConflict: 'company_id'
        });

      if (error) throw error;
      toast({
        title: 'Settings Updated',
        description: 'Company settings have been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating company settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const addFromNumber = async () => {
    const trimmedNumber = newFromNumber.trim();
    
    if (!trimmedNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number.',
        variant: 'destructive',
      });
      return;
    }

    // Validate phone number is exactly 10 digits
    const digitsOnly = trimmedNumber.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Phone number must be exactly 10 digits.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!bulkAssignManagerId || bulkAssignManagerId === 'none') {
      toast({
        title: 'Error',
        description: 'Please select an employee to assign this phone number.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!userRole?.company_id) return;

    try {
      // Check if number already exists
      const { data: existing, error: checkError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('company_id', userRole.company_id)
        .eq('phone_number', trimmedNumber);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        toast({
          title: 'Number Already Exists',
          description: `The phone number "${trimmedNumber}" is already assigned.`,
          variant: 'destructive',
        });
        return;
      }

      // Get employee details
      const employee = employees.find(emp => emp.id === bulkAssignManagerId);
      if (!employee) {
        toast({
          title: 'Error',
          description: 'Employee not found.',
          variant: 'destructive',
        });
        return;
      }

      console.log('📝 Assigning phone number to employee:', {
        employeeId: bulkAssignManagerId,
        employeeName: employee.profile?.full_name,
        phoneNumber: trimmedNumber,
        managerId: selectedManagerFilter === 'none' ? null : selectedManagerFilter
      });

      // Insert phone number assignment
      const { data: insertedData, error: insertError } = await supabase
        .from('phone_numbers')
        .insert({
          company_id: userRole.company_id,
          phone_number: trimmedNumber,
          manager_id: selectedManagerFilter === 'none' ? null : selectedManagerFilter,
          employee_id: bulkAssignManagerId,
          is_active: true
        })
        .select();

      console.log('📞 Insert result:', { insertedData, insertError });

      if (insertError) throw insertError;

      // Update employee's assigned_phone_number field
      const { error: updateError } = await supabase
        .from('employees')
        .update({ assigned_phone_number: trimmedNumber })
        .eq('id', bulkAssignManagerId);

      if (updateError) {
        console.error('Error updating employee phone:', updateError);
      } else {
        console.log('✅ Updated employee assigned_phone_number field');
      }

      toast({
        title: 'Success',
        description: `Phone number assigned to ${employee.profile?.full_name || 'employee'} successfully!`,
      });

      // Reset form
      setNewFromNumber("");
      setSelectedManagerFilter('none');
      setBulkAssignManagerId('');
      
      // Refresh phone assignments
      await fetchPhoneAssignments();
    } catch (error: any) {
      console.error('Error assigning phone number:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign phone number.',
        variant: 'destructive',
      });
    }
  };

  const removeFromNumber = async (phoneAssignmentId: string) => {
    try {
      // Get the assignment to remove employee's assigned number
      const assignment = phoneAssignments.find(a => a.id === phoneAssignmentId);
      
      if (assignment?.employee_id) {
        // Clear employee's assigned_phone_number
        await supabase
          .from('employees')
          .update({ assigned_phone_number: null })
          .eq('id', assignment.employee_id);
      }

      // Delete the phone assignment
      const { error } = await supabase
        .from('phone_numbers')
        .delete()
        .eq('id', phoneAssignmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Phone number assignment removed successfully!',
      });

      // Refresh phone assignments
      await fetchPhoneAssignments();
    } catch (error: any) {
      console.error('Error removing phone assignment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove phone assignment.',
        variant: 'destructive',
      });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      // Validate email uniqueness within the SAME role only
      const emailToCheck = newUser.email.toLowerCase().trim();
      
      if (addUserType === 'manager') {
        // Check if email already exists as MANAGER
        const { data: existingManagers } = await supabase
          .from('managers')
          .select('email, full_name')
          .eq('company_id', userRole.company_id)
          .eq('email', emailToCheck)
          .eq('is_active', true);

        if (existingManagers && existingManagers.length > 0) {
          toast({
            title: 'Email Already Exists',
            description: `A manager with email ${newUser.email} already exists in your company.`,
            variant: 'destructive',
          });
          return;
        }
      } else if (addUserType === 'employee') {
        // Check if email already exists as EMPLOYEE
        const { data: existingEmployees } = await supabase
          .from('employees')
          .select('email, full_name')
          .eq('company_id', userRole.company_id)
          .eq('email', emailToCheck)
          .eq('is_active', true);

        if (existingEmployees && existingEmployees.length > 0) {
          toast({
            title: 'Email Already Exists',
            description: `An employee with email ${newUser.email} already exists in your company.`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Note: Additional validation for admin emails will happen at the database level via triggers

      const demoUserId = crypto.randomUUID();
      
      console.log('Creating user with ID:', demoUserId);

      if (addUserType === 'manager') {
        // Use custom department if "other" is selected, otherwise use the selected department
        const finalDepartment = newUser.department === 'other' ? customDepartment : newUser.department;
        
        // Create manager
        const { error: managerError } = await supabase
          .from('managers')
          .insert({
            user_id: demoUserId,
            company_id: userRole.company_id,
            full_name: newUser.fullName,
            email: emailToCheck,
            department: finalDepartment,
            phone: newUser.phone,
            password: newUser.password,
            is_active: true,
          });

        if (managerError) {
          // Check if it's a unique constraint violation
          if (managerError.code === '23505') {
            toast({
              title: 'Email Already Exists',
              description: `A manager with email ${newUser.email} already exists in your company.`,
              variant: 'destructive',
            });
            return;
          }
          throw managerError;
        }

        // Create user role for manager
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: demoUserId,
            company_id: userRole.company_id,
            role: 'manager',
            manager_id: null,
            is_active: true,
          });

        if (roleError) throw roleError;

      } else if (addUserType === 'employee') {
        // Create employee
        const { error: employeeError } = await supabase
          .from('employees')
          .insert({
            user_id: demoUserId,
            company_id: userRole.company_id,
            manager_id: newUser.managerId,
            full_name: newUser.fullName,
            email: newUser.email,
            phone: newUser.phone,
            password: newUser.password,
            is_active: true,
          });

        if (employeeError) throw employeeError;

        // Create user role for employee
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: demoUserId,
            company_id: userRole.company_id,
            role: 'employee',
            manager_id: newUser.managerId,
            is_active: true,
          });

        if (roleError) throw roleError;
      }

      // If manager and clients selected, assign them
      if (addUserType === 'manager' && selectedClientIds.length > 0) {
        try {
          // Get the manager ID from the newly created manager
          const { data: newManager } = await supabase
            .from('managers')
            .select('id')
            .eq('user_id', demoUserId)
            .single();

          if (newManager) {
            await bulkAssignClients.mutateAsync({
              manager_id: newManager.id,
              client_ids: selectedClientIds
            });
            toast({
              title: 'Clients Assigned',
              description: `${selectedClientIds.length} client(s) assigned to ${newUser.fullName}.`,
            });
          }
        } catch (error) {
          console.error('Error assigning clients:', error);
          toast({
            title: 'Warning',
            description: 'Manager created but failed to assign clients.',
            variant: 'destructive',
          });
        }
      }

      // Show credentials modal
      setGeneratedCredentials({
        email: newUser.email,
        password: newUser.password,
        role: addUserType,
        name: newUser.fullName,
      });
      setCopiedItems({ email: false, password: false });
      setIsCredentialsModalOpen(true);

      // Reset form and close modal
      setNewUser({
        email: "",
        password: "",
        fullName: "",
        role: "manager",
        managerId: "",
        department: "",
        phone: "",
      });
      setCustomDepartment("");
      setSelectedClientIds([]);
      setShowPassword(false);
      setIsAddUserModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      setIsUpdating(true);

      if (editUser.role === 'manager') {
        const { error } = await supabase
          .from('managers')
          .update({
            full_name: editUser.fullName,
            email: editUser.email,
            department: editUser.department,
            phone: editUser.phone,
            is_active: editUser.is_active,
            ...(editUser.password && { password: editUser.password }),
          })
          .eq('id', selectedUser.id);

        if (error) throw error;
        
        // Update client assignments for managers in HR companies
        if (company?.industry?.toLowerCase() === 'hr') {
          // Get current assignments
          const { data: currentAssignments } = await supabase
            .from('manager_client_assignments')
            .select('client_id')
            .eq('manager_id', selectedUser.id)
            .eq('is_active', true);
          
          const currentClientIds = currentAssignments?.map(a => a.client_id) || [];
          
          // Find clients to add and remove
          const clientsToAdd = selectedClientIds.filter(id => !currentClientIds.includes(id));
          const clientsToRemove = currentClientIds.filter(id => !selectedClientIds.includes(id));
          
          // Add new assignments
          if (clientsToAdd.length > 0) {
            const newAssignments = clientsToAdd.map(client_id => ({
              manager_id: selectedUser.id,
              client_id,
              assigned_by: user?.id,
              assigned_at: new Date().toISOString()
            }));
            
            const { error: addError } = await supabase
              .from('manager_client_assignments')
              .insert(newAssignments);
            
            if (addError) throw addError;
          }
          
          // Remove old assignments
          if (clientsToRemove.length > 0) {
            const { error: removeError } = await supabase
              .from('manager_client_assignments')
              .delete()
              .eq('manager_id', selectedUser.id)
              .in('client_id', clientsToRemove);
            
            if (removeError) throw removeError;
          }
        }
      } else {
        const { error } = await supabase
          .from('employees')
          .update({
            full_name: editUser.fullName,
            email: editUser.email,
            phone: editUser.phone,
            manager_id: editUser.managerId,
            is_active: editUser.is_active,
            ...(editUser.password && { password: editUser.password }),
          })
          .eq('id', selectedUser.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'User updated successfully!',
      });

      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.role === 'manager') {
        // Check if this manager has any employees assigned
        const { data: assignedEmployees, error: checkError } = await supabase
          .from('employees')
          .select('id, full_name, email')
          .eq('manager_id', selectedUser.id)
          .eq('is_active', true);

        if (checkError) throw checkError;

        if (assignedEmployees && assignedEmployees.length > 0) {
          toast({
            title: 'Cannot Delete Manager',
            description: `This manager has ${assignedEmployees.length} employee(s) assigned. Please reassign or remove the employees first.`,
            variant: 'destructive',
          });
          return;
        }

        // Check if manager has any leads assigned
        const { data: assignedLeads, error: leadsCheckError } = await supabase
          .from('leads')
          .select('id')
          .eq('assigned_to', selectedUser.id);

        if (leadsCheckError) throw leadsCheckError;

        // If there are assigned leads, set them to null
        if (assignedLeads && assignedLeads.length > 0) {
          await supabase
            .from('leads')
            .update({ assigned_to: null })
            .eq('assigned_to', selectedUser.id);
        }

        // Delete manager_client_assignments
        await supabase
          .from('manager_client_assignments')
          .delete()
          .eq('manager_id', selectedUser.id);

        // Delete the manager record
        const { error } = await supabase
          .from('managers')
          .delete()
          .eq('id', selectedUser.id);

        if (error) throw error;

        // Also delete the user_role if it exists
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.user_id)
          .eq('company_id', userRole?.company_id);

      } else {
        // Delete the employee record
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', selectedUser.id);

        if (error) throw error;

        // Also delete the user_role if it exists
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.user_id)
          .eq('company_id', userRole?.company_id);
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully!',
      });

      setIsDeleteUserModalOpen(false);
      
      // Optimized: Remove deleted user from state instead of refetching everything
      if (selectedUser.role === 'manager') {
        setManagers(prev => prev.filter(m => m.id !== selectedUser.id));
      } else {
        setEmployees(prev => prev.filter(e => e.id !== selectedUser.id));
        // Also update managers' employee lists
        setManagers(prev => prev.map(m => ({
          ...m,
          employees: m.employees.filter(e => e.id !== selectedUser.id)
        })));
      }
      
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewUser = (user: User) => {
    console.log('Viewing user:', user);
    console.log('User profile:', user.profile);
    console.log('User password from profile:', user.profile?.password);
    console.log('User password direct:', user.password);
    setSelectedUser(user);
    setShowUserDetailsPassword(false); // Reset password visibility
    setIsViewUserModalOpen(true);
  };

  const handleEditUserClick = async (user: User) => {
    setSelectedUser(user);
    setEditUser({
      id: user.id,
      email: user.profile?.email || user.email,
      password: "",
      fullName: user.profile?.full_name || user.full_name,
      role: user.role as "manager" | "employee",
      managerId: user.manager_id || "",
      department: user.profile?.department || user.department || "",
      phone: user.phone || "",
      is_active: user.is_active,
    });
    
    // Load current client assignments for managers
    if (user.role === 'manager') {
      try {
        const { data: assignments, error } = await supabase
          .from('manager_client_assignments')
          .select('client_id')
          .eq('manager_id', user.id)
          .eq('is_active', true);
        
        if (!error && assignments) {
          setSelectedClientIds(assignments.map(a => a.client_id));
        }
      } catch (error) {
        console.error('Error loading client assignments:', error);
      }
    } else {
      setSelectedClientIds([]);
    }
    
    setIsEditUserModalOpen(true);
  };

  const handleDeleteUserClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserModalOpen(true);
  };

  const handleShowCredentials = (user: User) => {
    setSelectedUser(user);
    setGeneratedCredentials({
      email: user.profile?.email || user.email,
      password: user.profile?.password || user.password || "Not available",
      role: user.role,
      name: user.profile?.full_name || user.full_name,
    });
    setCopiedItems({ email: false, password: false });
    setIsCredentialsModalOpen(true);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      // Check if email already exists as EMPLOYEE only (same person can be both manager and employee)
      const { data: existingUsers, error: checkError } = await supabase
        .from('employees')
        .select('email, full_name')
        .eq('company_id', userRole.company_id)
        .eq('email', newEmployee.email.toLowerCase().trim())
        .eq('is_active', true);

      if (checkError) {
        console.error('Error checking email:', checkError);
      }

      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: 'Email Already Exists',
          description: `An employee with email ${newEmployee.email} already exists in your company.`,
          variant: 'destructive',
        });
        return;
      }

      // Note: Additional validation for admin emails will happen at the database level via triggers

      const demoUserId = crypto.randomUUID();
      
      console.log('Creating employee with ID:', demoUserId);

      // Create employee
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: demoUserId,
          company_id: userRole.company_id,
          manager_id: newEmployee.managerId,
          full_name: newEmployee.fullName,
          email: newEmployee.email.toLowerCase().trim(),
          phone: newEmployee.phone,
          password: newEmployee.password,
          is_active: true,
        });

      if (employeeError) {
        // Check if it's a unique constraint violation
        if (employeeError.code === '23505') {
          toast({
            title: 'Email Already Exists',
            description: `An employee with email ${newEmployee.email} already exists in your company.`,
            variant: 'destructive',
          });
          return;
        }
        throw employeeError;
      }

      // Create user role for employee
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: demoUserId,
          company_id: userRole.company_id,
          role: 'employee',
          manager_id: newEmployee.managerId,
          is_active: true,
        });

      if (roleError) throw roleError;

      toast({
        title: 'Employee Created',
        description: `${newEmployee.fullName} has been successfully added as an employee.`,
      });

      // Show credentials modal
      setGeneratedCredentials({
        email: newEmployee.email,
        password: newEmployee.password,
        role: 'employee',
        name: newEmployee.fullName,
      });
      setCopiedItems({ email: false, password: false });
      setIsCredentialsModalOpen(true);

      // Reset form and close modal
      setNewEmployee({
        email: "",
        password: "",
        fullName: "",
        managerId: "",
        phone: "",
      });
      setShowEmployeePassword(false);
      setIsAddEmployeeModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create employee. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredManagers = managers.filter(manager => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      manager.profile?.full_name?.toLowerCase().includes(search) ||
      manager.profile?.email?.toLowerCase().includes(search) ||
      manager.profile?.department?.toLowerCase().includes(search) ||
      manager.user_id?.toLowerCase().includes(search)
    );
    const matchesDepartment = selectedDepartmentFilter === 'all' || manager.profile?.department === selectedDepartmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const filteredEmployees = employees.filter(employee => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      employee.profile?.full_name?.toLowerCase().includes(search) ||
      employee.profile?.email?.toLowerCase().includes(search) ||
      employee.profile?.department?.toLowerCase().includes(search) ||
      employee.user_id?.toLowerCase().includes(search)
    );
    const matchesManager = selectedManagerFilter === 'all' || employee.manager_id === selectedManagerFilter;
    return matchesSearch && matchesManager;
  });

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [type]: true }));
      toast({
        title: 'Copied!',
        description: `${type === 'email' ? 'Email' : 'Password'} copied to clipboard.`,
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = () => {
    setIsSignOutDialogOpen(true);
  };

  const confirmSignOut = async () => {
    try {
      console.log('Starting sign out process...');
      await signOut();
      toast({
        title: 'Success',
        description: 'Signed out successfully.',
      });
      setIsSignOutDialogOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
      setIsSignOutDialogOpen(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      // Determine user_id based on group or direct assignment
      let assignedUserId = null;
      let leadStatus = 'unassigned';
      
      if (newLead.groupId && newLead.groupId !== "none") {
        // If a group is selected, get the manager assigned to that group
        const selectedGroup = leadGroups.find(g => g.id === newLead.groupId);
        if (!selectedGroup?.assigned_to) {
          toast({
            title: 'Error',
            description: 'This lead group is not assigned to any manager yet. Please assign the group to a manager first or select a different group.',
            variant: 'destructive',
          });
          return;
        }
        // Get the manager's user_id from the assigned_to (which is manager.id)
        const assignedManager = managers.find(m => m.id === selectedGroup.assigned_to);
        if (assignedManager) {
          assignedUserId = assignedManager.user_id;
          leadStatus = 'assigned';
        } else {
          toast({
            title: 'Error',
            description: 'Could not find the manager assigned to this group. Please try again.',
            variant: 'destructive',
          });
          return;
        }
      } else if (newLead.assignedTo && newLead.assignedTo !== "unassigned") {
        // Direct assignment to a manager
        assignedUserId = newLead.assignedTo;
        leadStatus = 'assigned';
      }

      // Validate that user_id is set (required by database constraint)
      if (!assignedUserId) {
        toast({
          title: 'Error',
          description: 'Please assign the lead to a manager or select a group with an assigned manager.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('leads')
        .insert({
          name: newLead.name,
          email: newLead.email,
          contact: newLead.contact,
          description: newLead.description || null,
          assigned_to: null, // Only employees should be in assigned_to
          user_id: assignedUserId, // Admin assigns to manager (via group or direct)
          company_id: userRole.company_id,
          status: leadStatus,
          group_id: newLead.groupId || null, // Add group assignment
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead added successfully!',
      });

      // Reset form and close modal
      setNewLead({
        name: "",
        email: "",
        contact: "",
        description: "",
        assignedTo: "",
        groupId: "",
      });
      setIsAddLeadModalOpen(false);
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    setIsViewLeadModalOpen(true);
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setIsEditLeadModalOpen(true);
  };

  const handleDeleteLead = (lead: any) => {
    setLeadToDelete(lead);
    setIsDeleteLeadModalOpen(true);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead deleted successfully!',
      });

      setIsDeleteLeadModalOpen(false);
      setLeadToDelete(null);
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Bulk Delete Handlers
  const handleToggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const handleSelectAllLeads = (checked: boolean) => {
    if (checked) {
      const allLeadIds = new Set(leads.map(lead => lead.id));
      setSelectedLeadIds(allLeadIds);
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.size === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;

    try {
      const idsToDelete = Array.from(selectedLeadIds);
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Successfully deleted ${idsToDelete.length} lead${idsToDelete.length > 1 ? 's' : ''}.`,
      });

      setIsBulkDeleteModalOpen(false);
      setSelectedLeadIds(new Set());
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error bulk deleting leads:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete leads. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAssign = () => {
    if (selectedLeadIds.size === 0) return;
    setIsBulkAssignModalOpen(true);
  };

  const confirmBulkAssign = async () => {
    if (selectedLeadIds.size === 0 || !bulkAssignManagerId) return;

    try {
      const idsToAssign = Array.from(selectedLeadIds);
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: bulkAssignManagerId })
        .in('id', idsToAssign);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${idsToAssign.length} lead(s) assigned successfully.`,
      });

      setSelectedLeadIds(new Set());
      setBulkAssignManagerId('');
      setIsBulkAssignModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error assigning leads:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign leads.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkGroup = () => {
    if (selectedLeadIds.size === 0) return;
    setIsBulkGroupModalOpen(true);
  };

  const confirmBulkGroup = async () => {
    if (selectedLeadIds.size === 0) return;

    try {
      const idsToGroup = Array.from(selectedLeadIds);
      let groupId = bulkSelectedGroupId;

      // Create new group if needed
      if (bulkGroupOption === 'new' && bulkNewGroupName.trim()) {
        const { data: newGroup, error: groupError } = await supabase
          .from('lead_groups')
          .insert({
            name: bulkNewGroupName.trim(),
            company_id: userRole?.company_id,
          })
          .select()
          .single();

        if (groupError) throw groupError;
        groupId = newGroup.id;
      }

      if (!groupId) {
        throw new Error('Please select or create a group');
      }

      // Update leads with group_id
      const { error } = await supabase
        .from('leads')
        .update({ group_id: groupId })
        .in('id', idsToGroup);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${idsToGroup.length} lead(s) added to group successfully.`,
      });

      setSelectedLeadIds(new Set());
      setBulkGroupOption('existing');
      setBulkSelectedGroupId('');
      setBulkNewGroupName('');
      setIsBulkGroupModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding leads to group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add leads to group.',
        variant: 'destructive',
      });
    }
  };

  // Lead Group Handlers
  const handleViewLeadGroup = (group: any) => {
    setSelectedLeadGroup(group);
    setIsViewingGroupPage(true);
  };

  const handleEditLeadGroup = (group: any) => {
    setSelectedLeadGroup(group);
    setIsEditLeadGroupModalOpen(true);
  };

  const handleDeleteLeadGroup = (group: any) => {
    setSelectedLeadGroup(group);
    setIsDeleteLeadGroupModalOpen(true);
  };

  const confirmDeleteLeadGroup = async () => {
    if (!selectedLeadGroup) return;

    try {
      // First, delete all leads in this group
      const { data: leadsInGroup, error: fetchError } = await supabase
        .from('leads')
        .select('id')
        .eq('group_id', selectedLeadGroup.id);

      if (fetchError) throw fetchError;

      const leadsCount = leadsInGroup?.length || 0;

      if (leadsCount > 0) {
        const { error: deleteLeadsError } = await supabase
          .from('leads')
          .delete()
          .eq('group_id', selectedLeadGroup.id);

        if (deleteLeadsError) throw deleteLeadsError;
      }

      // Then delete the group itself
      const { error: deleteGroupError } = await supabase
        .from('lead_groups')
        .delete()
        .eq('id', selectedLeadGroup.id);

      if (deleteGroupError) throw deleteGroupError;

      toast({
        title: 'Success',
        description: `Lead group deleted successfully! ${leadsCount > 0 ? `${leadsCount} lead${leadsCount > 1 ? 's' : ''} also deleted.` : ''}`,
      });

      setIsDeleteLeadGroupModalOpen(false);
      setSelectedLeadGroup(null);
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting lead group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lead group. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Download Sample CSV
  const downloadSampleCSV = () => {
    const sampleData = [
      ['name', 'email', 'contact', 'company', 'description'],
      ['John Doe', 'john.doe@example.com', '9876543210', 'ABC Corp', 'Interested in software development position'],
      ['Jane Smith', 'jane.smith@example.com', '9876543211', 'XYZ Ltd', 'Looking for senior developer role'],
      ['Mike Johnson', 'mike.j@example.com', '9876543212', 'Tech Solutions', 'Experienced in React and Node.js']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_leads.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Upload Handlers
  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      parseCSVFile(file);
    }
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: 'Error',
          description: 'CSV file is empty or invalid.',
          variant: 'destructive',
        });
        return;
      }

      // Parse CSV (skip header if present)
      const parsedLeads: any[] = [];
      const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma, handling quoted values
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
        
        if (values.length >= 3) {
          parsedLeads.push({
            name: values[0],
            email: values[1],
            contact: values[2],
            description: values[3] || ''
          });
        }
      }

      if (parsedLeads.length === 0) {
        toast({
          title: 'Error',
          description: 'No valid leads found in CSV file. Please check the format.',
          variant: 'destructive',
        });
        return;
      }

      setCsvLeads(parsedLeads);
      toast({
        title: 'Success',
        description: `Found ${parsedLeads.length} leads in CSV file.`,
      });
    };
    reader.readAsText(file);
  };

  const handleCSVUpload = async () => {
    if (!userRole?.company_id || csvLeads.length === 0) return;

    try {
      setIsUploadingCSV(true);

      let groupIdToUse = null;

      // Handle group creation/selection
      if (csvGroupOption === 'new' && csvNewGroupName.trim()) {
        // Create new group
        const { data: newGroup, error: groupError } = await supabase
          .from('lead_groups')
          .insert({
            user_id: user?.id,
            group_name: csvNewGroupName.trim(),
            company_id: userRole.company_id,
            assigned_to: csvAssignedTo === 'unassigned' ? null : managers.find(m => m.user_id === csvAssignedTo)?.id || null,
          })
          .select()
          .single();

        if (groupError) throw groupError;
        groupIdToUse = newGroup.id;

        toast({
          title: 'Group Created',
          description: `Lead group "${csvNewGroupName}" created successfully.`,
        });
      } else if (csvGroupOption === 'existing' && csvSelectedGroupId) {
        groupIdToUse = csvSelectedGroupId;
      }

      // Determine user_id for leads
      let assignedUserId = null;
      let leadStatus = 'unassigned';

      if (csvGroupOption === 'new' && csvAssignedTo && csvAssignedTo !== 'unassigned') {
        // For newly created group, use the assigned manager directly
        assignedUserId = csvAssignedTo;
        leadStatus = 'assigned';
      } else if (csvGroupOption === 'existing' && groupIdToUse) {
        // For existing group, get the manager assigned to that group
        const selectedGroup = leadGroups.find(g => g.id === groupIdToUse);
        if (selectedGroup?.assigned_to) {
          const assignedManager = managers.find(m => m.id === selectedGroup.assigned_to);
          if (assignedManager) {
            assignedUserId = assignedManager.user_id;
            leadStatus = 'assigned';
          }
        }
      } else if (csvGroupOption === 'none' && csvAssignedTo && csvAssignedTo !== 'unassigned') {
        // Direct assignment without group
        assignedUserId = csvAssignedTo;
        leadStatus = 'assigned';
      }

      // Prepare leads for insertion
      const leadsToInsert = csvLeads.map(lead => ({
        name: lead.name,
        email: lead.email,
        contact: lead.contact,
        description: lead.description || null,
        assigned_to: null,
        user_id: assignedUserId,
        company_id: userRole.company_id,
        status: leadStatus,
        group_id: groupIdToUse,
      }));

      const { data, error } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select();

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `Successfully uploaded ${data?.length || csvLeads.length} leads from CSV.`,
      });

      // Reset and close
      setCsvFile(null);
      setCsvLeads([]);
      setCsvGroupOption('none');
      setCsvSelectedGroupId('');
      setCsvNewGroupName('');
      setCsvAssignedTo('unassigned');
      setIsUploadCSVModalOpen(false);
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload leads. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // Admin uses custom auth, not Supabase Auth
      // Update admin data in the admins table using RPC
      const { error: updateError } = await supabase.rpc('update_admin_profile', {
        p_user_id: user.id,
        p_full_name: profileData.full_name
      });

      if (updateError) {
        console.error('Error updating admin profile:', updateError);
        throw updateError;
      }

      // Update local admin profile state
      setAdminProfile(prev => prev ? {
        ...prev,
        full_name: profileData.full_name
      } : null);

      // Update localStorage session
      const customSession = localStorage.getItem('custom_auth_session');
      if (customSession) {
        try {
          const sessionData = JSON.parse(customSession);
          sessionData.user.user_metadata.full_name = profileData.full_name;
          localStorage.setItem('custom_auth_session', JSON.stringify(sessionData));
          console.log('Updated admin session in localStorage');
        } catch (e) {
          console.error('Error updating localStorage:', e);
        }
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });

      setIsEditingProfile(false);
      
      // Refresh admin profile data
      await fetchAdminProfile();

      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!userRole?.company_id) return;

    try {
      setIsUpdating(true);

      // Use RPC function to update company (bypasses RLS)
      const { error } = await supabase.rpc('update_company_info', {
        p_company_id: userRole.company_id,
        p_name: companyData.name,
        p_email: companyData.email,
        p_industry: companyData.industry
      });

      if (error) {
        console.error('Error updating company:', error);
        throw error;
      }

      // Update localStorage session with new company data
      const customSession = localStorage.getItem('custom_auth_session');
      if (customSession) {
        try {
          const sessionData = JSON.parse(customSession);
          if (sessionData.company) {
            sessionData.company.name = companyData.name;
            sessionData.company.email = companyData.email;
            sessionData.company.industry = companyData.industry;
            localStorage.setItem('custom_auth_session', JSON.stringify(sessionData));
            console.log('Updated company in localStorage');
          }
        } catch (e) {
          console.error('Error updating localStorage:', e);
        }
      }

      toast({
        title: 'Success',
        description: 'Company information updated successfully!',
      });

      setIsEditingCompany(false);
      
      // Refresh company data
      await fetchCompanyData();
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update company information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

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
      setIsUpdating(true);
      
      // Admin uses custom auth, update password in database using RPC
      const { error } = await supabase.rpc('update_admin_password', {
        p_user_id: user.id,
        p_new_password: passwordData.new_password
      });

      if (error) {
        console.error('Error updating password:', error);
        throw error;
      }

      setPasswordData({
        new_password: '',
        confirm_password: '',
      });
      setIsPasswordEditing(false);
      
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
    } finally {
      setIsUpdating(false);
    }
  };


  // Filter analyses
  const filteredAnalyses = analyses.filter(analysis => {
    const leadName = analysis.recordings?.call_history?.leads?.name?.toLowerCase() || '';
    const employeeName = analysis.recordings?.call_history?.employees?.full_name || '';
    const employeeId = analysis.user_id || '';
    
    const matchesSearch = analysisSearchTerm === "" || leadName.includes(analysisSearchTerm.toLowerCase());
    const matchesEmployee = selectedAnalysisEmployee === "all" || employeeId === selectedAnalysisEmployee;
    
    let matchesProbability = selectedClosureProbability === "all";
    if (selectedClosureProbability === "high") {
      matchesProbability = (analysis.closure_probability || 0) >= 70;
    } else if (selectedClosureProbability === "medium") {
      matchesProbability = (analysis.closure_probability || 0) >= 40 && (analysis.closure_probability || 0) < 70;
    } else if (selectedClosureProbability === "low") {
      matchesProbability = (analysis.closure_probability || 0) < 40;
    }
    
    return matchesSearch && matchesEmployee && matchesProbability;
  });

  // Set first manager as selected by default
  useEffect(() => {
    if (managers.length > 0 && !selectedManager) {
      setSelectedManager(managers[0]);
    }
  }, [managers, selectedManager]);

  // Filter data based on date range - using useMemo for reactivity
  const dateFilteredCalls = useMemo(() => {
    const now = new Date();
    const currentTime = now.getTime();
    
    const filtered = calls.filter(call => {
      if (!call.created_at) return false;
      const date = new Date(call.created_at);
      const callTime = date.getTime();
      
      if (dateFilter === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return callTime >= todayStart.getTime() && callTime <= todayEnd.getTime();
      } else if (dateFilter === 'week') {
        // Get Monday of current week as start
        const weekStart = new Date(now);
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days to Monday
        weekStart.setDate(now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        // Get Friday of current week as end
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 4); // Friday is 4 days after Monday
        weekEnd.setHours(23, 59, 59, 999);
        
        return callTime >= weekStart.getTime() && callTime <= weekEnd.getTime();
      } else if (dateFilter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        // Don't include future dates beyond current time
        return callTime >= monthStart.getTime() && callTime <= currentTime;
      } else if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        const start = new Date(customDateRange.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customDateRange.endDate);
        end.setHours(23, 59, 59, 999);
        return callTime >= start.getTime() && callTime <= end.getTime();
      }
      return true; // Default: show all data
    });
    
    return filtered;
  }, [calls, dateFilter, customDateRange.startDate, customDateRange.endDate]);

  const dateFilteredAnalyses = useMemo(() => {
    const now = new Date();
    const currentTime = now.getTime();
    
    return analyses.filter(analysis => {
      const createdAt = analysis.created_at || analysis.recordings?.call_history?.created_at;
      if (!createdAt) return false;
      
      const date = new Date(createdAt);
      const analysisTime = date.getTime();
      
      if (dateFilter === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return analysisTime >= todayStart.getTime() && analysisTime <= todayEnd.getTime();
      } else if (dateFilter === 'week') {
        // Get Monday of current week as start
        const weekStart = new Date(now);
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days to Monday
        weekStart.setDate(now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        // Get Friday of current week as end
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 4); // Friday is 4 days after Monday
        weekEnd.setHours(23, 59, 59, 999);
        
        return analysisTime >= weekStart.getTime() && analysisTime <= weekEnd.getTime();
      } else if (dateFilter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        // Don't include future dates beyond current time
        return analysisTime >= monthStart.getTime() && analysisTime <= currentTime;
      } else if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        const start = new Date(customDateRange.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customDateRange.endDate);
        end.setHours(23, 59, 59, 999);
        return analysisTime >= start.getTime() && analysisTime <= end.getTime();
      }
      return true;
    });
  }, [analyses, dateFilter, customDateRange.startDate, customDateRange.endDate]);

  const dateFilteredDailyProductivity = useMemo(() => {
    const now = new Date();
    const currentTime = now.getTime();
    
    return dailyProductivity.filter(p => {
      if (!p.date) return false;
      const date = new Date(p.date);
      const prodTime = date.getTime();
      
      if (dateFilter === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return prodTime >= todayStart.getTime() && prodTime <= todayEnd.getTime();
      } else if (dateFilter === 'week') {
        // Get Monday of current week as start
        const weekStart = new Date(now);
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days to Monday
        weekStart.setDate(now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        // Get Friday of current week as end
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 4); // Friday is 4 days after Monday
        weekEnd.setHours(23, 59, 59, 999);
        
        return prodTime >= weekStart.getTime() && prodTime <= weekEnd.getTime();
      } else if (dateFilter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        // Don't include future dates beyond current time
        return prodTime >= monthStart.getTime() && prodTime <= currentTime;
      } else if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        const start = new Date(customDateRange.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customDateRange.endDate);
        end.setHours(23, 59, 59, 999);
        return prodTime >= start.getTime() && prodTime <= end.getTime();
      }
      return true;
    });
  }, [dailyProductivity, dateFilter, customDateRange.startDate, customDateRange.endDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate manager stats
  const getManagerStats = (manager: Manager) => {
    const managerEmployees = employees.filter(e => e.manager_id === manager.id);
    const totalCalls = dateFilteredCalls.filter(c => 
      managerEmployees.some(e => e.user_id === c.employee_id)
    ).length;
    
    // Only include calls with duration >= 30 seconds for average calculation
    const relevantCalls = dateFilteredCalls
      .filter(c => 
        managerEmployees.some(e => e.user_id === c.employee_id) && 
        (c.exotel_duration || 0) >= 30
      );
    
    const totalCallDurations = relevantCalls.reduce((sum, call) => sum + (call.exotel_duration || 0), 0);
    
    const avgDuration = relevantCalls.length > 0 ? totalCallDurations / relevantCalls.length : 0;
    const avgMinutes = Math.floor(avgDuration / 60);
    const avgSeconds = Math.floor(avgDuration % 60);

    // Calculate closure probability from analyses
    const managerAnalyses = dateFilteredAnalyses.filter(a => 
      managerEmployees.some(e => e.user_id === a.user_id)
    );
    const avgClosureProbability = managerAnalyses.length > 0 
      ? managerAnalyses.reduce((sum, a) => sum + (a.closure_probability || 0), 0) / managerAnalyses.length
      : 0;

    return {
      calls: totalCalls,
      avgCallDuration: `${avgMinutes}m ${avgSeconds}s`,
      closureProbability: Math.round(avgClosureProbability),
      employeeCount: managerEmployees.length
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            <Badge className="bg-blue-500 text-white">
              <Shield className="h-3 w-3 mr-1" />
              ADMIN
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.user_metadata?.full_name || 'Aarav Varma'}</span>
              <span className="text-muted-foreground">•</span>
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{company?.name || 'Tasknova'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-56 border-r bg-white p-4">
          <nav className="space-y-1">
            <Button 
              variant={activeSidebarItem === 'overview' ? 'default' : 'ghost'} 
              className="w-full justify-start text-sm"
              onClick={() => setActiveSidebarItem('overview')}
            >
              <Building className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button 
              variant={activeSidebarItem === 'managers' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('managers')}
            >
              <Users className="h-4 w-4" />
              Managers
            </Button>
            <Button 
              variant={activeSidebarItem === 'employees' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('employees')}
            >
              <UserPlus className="h-4 w-4" />
              Employees
            </Button>
            <Button 
              variant={activeSidebarItem === 'leads' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('leads')}
            >
              <Phone className="h-4 w-4" />
              Leads
            </Button>
            
            {/* HR-specific navigation */}
            {company?.industry?.toLowerCase() === 'hr' && (
              <>
                <Button 
                  variant={activeSidebarItem === 'clients' ? 'accent' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveSidebarItem('clients')}
                >
                  <Building className="h-4 w-4" />
                  Clients
                </Button>
                <Button 
                  variant={activeSidebarItem === 'jobs' ? 'accent' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveSidebarItem('jobs')}
                >
                  <Briefcase className="h-4 w-4" />
                  Jobs
                </Button>
              </>
            )}
            
            <Button 
              variant={activeSidebarItem === 'call-history' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('call-history')}
            >
              <History className="h-4 w-4" />
              Call History
            </Button>
            <Button 
              variant={activeSidebarItem === 'analysis' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('analysis')}
            >
              <BarChart3 className="h-4 w-4" />
              Analysis
            </Button>
            <Button 
              variant={activeSidebarItem === 'reports' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('reports')}
            >
              <FileText className="h-4 w-4" />
              Reports
            </Button>
            <Button 
              variant={activeSidebarItem === 'settings' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('settings')}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button 
              variant={activeSidebarItem === 'profile' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('profile')}
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          {activeSidebarItem === 'overview' && (
            <div className="space-y-6">
              {/* Date Filter */}
              <Card className="bg-white shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Date Range:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={dateFilter === 'today' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          console.log('Setting date filter to: today');
                          setDateFilter('today');
                          setShowCustomDatePicker(false);
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant={dateFilter === 'week' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          console.log('Setting date filter to: week');
                          setDateFilter('week');
                          setShowCustomDatePicker(false);
                        }}
                      >
                        This Week
                      </Button>
                      <Button
                        variant={dateFilter === 'month' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          console.log('Setting date filter to: month');
                          setDateFilter('month');
                          setShowCustomDatePicker(false);
                        }}
                      >
                        This Month
                      </Button>
                      <Button
                        variant={dateFilter === 'custom' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setDateFilter('custom');
                          setShowCustomDatePicker(!showCustomDatePicker);
                        }}
                      >
                        Custom Range
                      </Button>
                    </div>
                  </div>
                  
                  {/* Custom Date Range Picker */}
                  {showCustomDatePicker && dateFilter === 'custom' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor="startDate" className="text-sm mb-1 block">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={customDateRange.startDate}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="endDate" className="text-sm mb-1 block">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={customDateRange.endDate}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full"
                          />
                        </div>
                        <Button
                          size="sm"
                          className="mt-6"
                          onClick={() => {
                            if (customDateRange.startDate && customDateRange.endDate) {
                              toast({
                                title: "Date range applied",
                                description: `Showing data from ${new Date(customDateRange.startDate).toLocaleDateString()} to ${new Date(customDateRange.endDate).toLocaleDateString()}`
                              });
                            } else {
                              toast({
                                title: "Invalid date range",
                                description: "Please select both start and end dates",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Managers</CardTitle>
                    <Users className="h-5 w-5 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{managers.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
                    <UserPlus className="h-5 w-5 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{employees.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
                    <Phone className="h-5 w-5 text-pink-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{leads.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Calls</CardTitle>
                    <PhoneCall className="h-5 w-5 text-violet-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{dateFilteredCalls.length < 1000 ? dateFilteredCalls.length : `${(dateFilteredCalls.length / 1000).toFixed(1)}k`}</div>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs font-medium text-green-500">Good</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Success Rate</CardTitle>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">
                      {dateFilteredCalls.length > 0 
                        ? Math.round((dateFilteredAnalyses.filter(a => (a.closure_probability || 0) >= 70).length / dateFilteredAnalyses.length) * 100) || 0
                        : 0}%
                    </div>
                    <p className="text-xs text-gray-600 mt-1">High probability closures</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Avg Call Duration</CardTitle>
                    <Clock className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-700">
                      {(() => {
                        const relevantCalls = dateFilteredCalls.filter(c => (c.exotel_duration || 0) >= 30);
                        if (relevantCalls.length > 0) {
                          const totalDuration = relevantCalls.reduce((sum, c) => sum + (c.exotel_duration || 0), 0);
                          const avgSeconds = Math.floor(totalDuration / relevantCalls.length);
                          const minutes = Math.floor(avgSeconds / 60);
                          const seconds = avgSeconds % 60;
                          return `${minutes}m ${seconds}s`;
                        }
                        return '0m 0s';
                      })()}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Calls ≥30 seconds only</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Active Clients</CardTitle>
                    <Building className="h-5 w-5 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-700">{clients?.length || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">Organizations served</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Total Jobs</CardTitle>
                    <Briefcase className="h-5 w-5 text-cyan-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyan-700">{jobs?.length || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">Job postings</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Lead Groups</CardTitle>
                    <Users className="h-5 w-5 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-700">{leadGroups.length}</div>
                    <p className="text-xs text-gray-600 mt-1">Organized groups</p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Manager Leaderboard */}
                <div className="col-span-3 space-y-4">
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Manager Leaderboard</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {managers.map((manager) => {
                        const stats = getManagerStats(manager);
                        const isSelected = selectedManager?.id === manager.id;
                        return (
                          <button
                            key={manager.id}
                            onClick={() => setSelectedManager(manager)}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              isSelected 
                                ? 'bg-blue-50 border border-blue-200' 
                                : 'bg-white border border-gray-100 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-500" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{manager.profile?.full_name}</p>
                                <p className="text-xs text-gray-500 truncate">{manager.profile?.email}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Call Outcome Distribution */}
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold">Call Outcomes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{
                        completed_relevant: { label: "Completed (Relevant)", color: "#22c55e" },
                        completed_irrelevant: { label: "Completed (Irrelevant)", color: "#86efac" },
                        busy: { label: "Busy", color: "#f59e0b" },
                        no_answer: { label: "No Answer", color: "#6366f1" },
                        failed: { label: "Failed", color: "#ef4444" },
                      }} className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Completed (Relevant)', value: dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30).length, fill: '#22c55e' },
                                { name: 'Completed (Irrelevant)', value: dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30).length, fill: '#86efac' },
                                { name: 'Busy', value: dateFilteredCalls.filter(c => c.outcome === 'busy').length, fill: '#f59e0b' },
                                { name: 'No Answer', value: dateFilteredCalls.filter(c => c.outcome === 'no-answer').length, fill: '#6366f1' },
                                { name: 'Failed', value: dateFilteredCalls.filter(c => c.outcome === 'failed').length, fill: '#ef4444' },
                              ].filter(d => d.value > 0)}
                              cx="35%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                              label={(entry) => `${entry.value}`}
                            >
                              {[
                                { name: 'Completed (Relevant)', value: dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30).length, fill: '#22c55e' },
                                { name: 'Completed (Irrelevant)', value: dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30).length, fill: '#86efac' },
                                { name: 'Busy', value: dateFilteredCalls.filter(c => c.outcome === 'busy').length, fill: '#f59e0b' },
                                { name: 'No Answer', value: dateFilteredCalls.filter(c => c.outcome === 'no-answer').length, fill: '#6366f1' },
                                { name: 'Failed', value: dateFilteredCalls.filter(c => c.outcome === 'failed').length, fill: '#ef4444' },
                              ].filter(d => d.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="mt-3 space-y-1 text-xs">
                        {dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30).length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-gray-600">Completed - Relevant ≥30s ({dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30).length})</span>
                          </div>
                        )}
                        {dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30).length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-300"></div>
                            <span className="text-gray-600">Completed - Irrelevant &lt;30s ({dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30).length})</span>
                          </div>
                        )}
                        {dateFilteredCalls.filter(c => c.outcome === 'busy').length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-gray-600">Busy ({dateFilteredCalls.filter(c => c.outcome === 'busy').length})</span>
                          </div>
                        )}
                        {dateFilteredCalls.filter(c => c.outcome === 'no-answer').length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                            <span className="text-gray-600">No Answer ({dateFilteredCalls.filter(c => c.outcome === 'no-answer').length})</span>
                          </div>
                        )}
                        {dateFilteredCalls.filter(c => c.outcome === 'failed').length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-gray-600">Failed ({dateFilteredCalls.filter(c => c.outcome === 'failed').length})</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Closure Probability Distribution */}
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold">Closure Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">High (70%+)</span>
                            <span className="text-xs font-bold text-green-600">
                              {dateFilteredAnalyses.filter(a => (a.closure_probability || 0) >= 70).length}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${dateFilteredAnalyses.length > 0 ? (dateFilteredAnalyses.filter(a => (a.closure_probability || 0) >= 70).length / dateFilteredAnalyses.length) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Medium (40-69%)</span>
                            <span className="text-xs font-bold text-amber-600">
                              {dateFilteredAnalyses.filter(a => (a.closure_probability || 0) >= 40 && (a.closure_probability || 0) < 70).length}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-amber-500 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${dateFilteredAnalyses.length > 0 ? (dateFilteredAnalyses.filter(a => (a.closure_probability || 0) >= 40 && (a.closure_probability || 0) < 70).length / dateFilteredAnalyses.length) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Low (&lt;40%)</span>
                            <span className="text-xs font-bold text-red-600">
                              {dateFilteredAnalyses.filter(a => (a.closure_probability || 0) < 40).length}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${dateFilteredAnalyses.length > 0 ? (dateFilteredAnalyses.filter(a => (a.closure_probability || 0) < 40).length / dateFilteredAnalyses.length) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Middle Column - Selected Manager Details + Teams */}
                <div className="col-span-6 space-y-6">
                  {/* Selected Manager Card */}
                  {selectedManager && (
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <User className="h-6 w-6" />
                          <div className="flex-1">
                            <CardTitle className="text-white">{selectedManager.profile?.full_name || 'Manager 2'}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-blue-100 text-xs mb-1">Calls</p>
                            <p className="text-2xl font-bold">{getManagerStats(selectedManager).calls}</p>
                          </div>
                          <div>
                            <p className="text-blue-100 text-xs mb-1">Avg Call Duration</p>
                            <p className="text-2xl font-bold">{getManagerStats(selectedManager).avgCallDuration}</p>
                          </div>
                          <div>
                            <p className="text-blue-100 text-xs mb-1">Closure Probability</p>
                            <p className="text-2xl font-bold">{getManagerStats(selectedManager).closureProbability}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recruitment Metrics Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Recruitment Overview</h3>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      {/* Active Clients */}
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-sm font-semibold text-gray-700">Active Clients</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-700 mb-1">
                            {clients?.filter((c: any) => c.is_active).length || 0}
                          </div>
                          <p className="text-xs text-gray-600">Organizations</p>
                        </CardContent>
                      </Card>

                      {/* Active Openings */}
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-sm font-semibold text-gray-700">Total Openings</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-700 mb-1">
                            {jobs?.reduce((sum: number, j: any) => 
                              sum + (j.positions_available || 0), 0) || 0}
                          </div>
                          <p className="text-xs text-gray-600">Available positions</p>
                        </CardContent>
                      </Card>

                      {/* Filled Positions */}
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-purple-600" />
                            <CardTitle className="text-sm font-semibold text-gray-700">Filled</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-purple-700 mb-1">
                            {dateFilteredCalls.filter(c => c.outcome === 'converted').length}
                          </div>
                          <p className="text-xs text-gray-600">Closures</p>
                        </CardContent>
                      </Card>

                      {/* Remaining Openings */}
                      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-600" />
                            <CardTitle className="text-sm font-semibold text-gray-700">Remaining</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-amber-700 mb-1">
                            {(() => {
                              const totalOpenings = jobs?.reduce((sum: number, j: any) => 
                                sum + (j.positions_available || 0), 0) || 0;
                              const filled = dateFilteredCalls.filter(c => c.outcome === 'converted').length;
                              return Math.max(0, totalOpenings - filled);
                            })()}
                          </div>
                          <p className="text-xs text-gray-600">To be filled</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Weekly Call Trend with Profile Downloads Comparison */}
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Calls vs Profile Downloads by Day</CardTitle>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-blue-500"></div>
                            <span className="text-gray-600">Calls</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-purple-500"></div>
                            <span className="text-gray-600">Profiles</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{
                        calls: { label: "Calls", color: "#3b82f6" },
                        profiles: { label: "Profile Downloads", color: "#8b5cf6" }
                      }} className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(() => {
                            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            const dayData = dayNames.map((day, index) => {
                              // Get profiles downloaded from employee_daily_productivity table
                              const dayProfiles = dateFilteredDailyProductivity.filter(p => {
                                const productivityDate = new Date(p.date);
                                return productivityDate.getDay() === index;
                              });
                              
                              const totalProfiles = dayProfiles.reduce((sum, p) => sum + (p.profiles_downloaded || 0), 0);
                              
                              return {
                                day: day.substring(0, 3),
                                calls: dateFilteredCalls.filter(c => {
                                  const callDate = new Date(c.created_at);
                                  return callDate.getDay() === index;
                                }).length,
                                profiles: totalProfiles
                              };
                            });
                            return dayData;
                          })()} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="day" 
                              tick={{ fontSize: 12 }}
                              axisLine={{ stroke: '#d1d5db' }}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              axisLine={{ stroke: '#d1d5db' }}
                            />
                            <ChartTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                                      <p className="font-semibold text-sm mb-2">{payload[0].payload.day}</p>
                                      <div className="space-y-1">
                                        <p className="text-xs flex items-center gap-2">
                                          <span className="w-3 h-3 rounded bg-blue-500"></span>
                                          <span>Calls: <strong>{payload[0].value}</strong></span>
                                        </p>
                                        <p className="text-xs flex items-center gap-2">
                                          <span className="w-3 h-3 rounded bg-purple-500"></span>
                                          <span>Profiles: <strong>{payload[1].value}</strong></span>
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="calls" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="profiles" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Total Calls (Selected Period)</p>
                          <p className="text-2xl font-bold text-blue-600">{dateFilteredCalls.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Total Profiles Downloaded</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {dateFilteredDailyProductivity.reduce((sum, p) => sum + (p.profiles_downloaded || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Alerts and More Stats */}
                <div className="col-span-3 space-y-4">
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dateFilteredCalls.filter(c => c.outcome === 'follow_up').slice(0, 3).map((call, index) => {
                        const lead = leads.find(l => l.id === call.lead_id);
                        const client = clients?.find((c: any) => c.id === lead?.client_id);
                        return (
                          <div key={call.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{lead?.name || 'Unknown Lead'}</p>
                                <p className="text-xs text-gray-600 truncate">{client?.name || 'No client'}</p>
                                <p className="text-xs text-amber-600 mt-1">Requires follow-up</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {dateFilteredCalls.filter(c => c.outcome === 'follow_up').length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p className="text-sm">All caught up!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dateFilteredCalls.slice(0, 5).map((call) => {
                        const lead = leads.find(l => l.id === call.lead_id);
                        const employee = employees.find(e => e.user_id === call.employee_id);
                        const timeAgo = (() => {
                          const diff = Date.now() - new Date(call.created_at).getTime();
                          const minutes = Math.floor(diff / 60000);
                          const hours = Math.floor(minutes / 60);
                          const days = Math.floor(hours / 24);
                          if (days > 0) return `${days}d ago`;
                          if (hours > 0) return `${hours}h ago`;
                          return `${minutes}m ago`;
                        })();
                        
                        return (
                          <div key={call.id} className="flex items-start gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              call.outcome === 'completed' ? 'bg-green-500' :
                              call.outcome === 'follow_up' ? 'bg-amber-500' :
                              call.outcome === 'converted' ? 'bg-purple-500' :
                              call.outcome === 'not_interested' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 font-medium truncate">
                                {employee?.profile?.full_name || 'Employee'} called {lead?.name || 'lead'}
                              </p>
                              <p className="text-gray-500">{timeAgo}</p>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>


                </div>
              </div>

              {/* Top Performers - Full Width */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Top Performers This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4">
                    {employees.slice(0, 5).map((employee, index) => {
                      const employeeCalls = dateFilteredCalls.filter(c => c.employee_id === employee.user_id);
                      const employeeAnalyses = dateFilteredAnalyses.filter(a => a.user_id === employee.user_id);
                      const avgClosure = employeeAnalyses.length > 0 
                        ? Math.round(employeeAnalyses.reduce((sum, a) => sum + (a.closure_probability || 0), 0) / employeeAnalyses.length)
                        : 0;
                      const manager = managers.find(m => m.id === employee.manager_id);
                      
                      return (
                        <div key={employee.id} className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-all">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-lg mb-3 mx-auto">
                            {index + 1}
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-sm mb-1 truncate">{employee.profile?.full_name || employee.email}</p>
                            <p className="text-xs text-gray-600 mb-3 truncate">Under {manager?.profile?.full_name || 'N/A'}</p>
                            <div className="pt-3 border-t border-blue-200">
                              <p className="text-2xl font-bold text-blue-600 mb-1">{employeeCalls.length}</p>
                              <p className="text-xs text-gray-500 mb-2">Total Calls</p>
                              <p className="text-lg font-semibold text-green-600">{avgClosure}%</p>
                              <p className="text-xs text-gray-500">Avg Closure</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSidebarItem === 'managers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Managers</h2>
                  <p className="text-muted-foreground">Manage your team leaders and their responsibilities.</p>
                </div>
                <Button onClick={() => {
                  console.log('Setting addUserType to manager');
                  setAddUserType('manager');
                  setShowPassword(false);
                  // Use setTimeout to ensure state is updated before opening modal
                  setTimeout(() => {
                    console.log('Opening modal with addUserType:', 'manager');
                    setIsAddUserModalOpen(true);
                  }, 100); // Increased timeout to ensure state update
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Manager
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search managers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-64">
                  <Select value={selectedDepartmentFilter} onValueChange={setSelectedDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {DEPARTMENT_OPTIONS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {managers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No managers found</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsAddUserModalOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Manager
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredManagers.map((manager) => (
                    <div key={manager.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}</h4>
                          <p className="text-sm text-muted-foreground">{manager.profile?.email || `ID: ${manager.user_id}`}</p>
                          {!manager.profile?.full_name && (
                            <p className="text-xs text-orange-600">Profile data missing - please update user</p>
                          )}
                          {manager.profile?.department && (
                            <p className="text-xs text-blue-600 font-medium">{manager.profile.department}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {manager.employees.length} employee{manager.employees.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Manager</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(manager)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserClick(manager)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowCredentials(manager)}>
                              <Shield className="h-4 w-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUserClick(manager)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSidebarItem === 'employees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Employees</h2>
                  <p className="text-muted-foreground">Manage your team members and their assignments.</p>
                </div>
                <Button onClick={() => {
                  console.log('Opening separate employee modal');
                  console.log('Setting isAddEmployeeModalOpen to true');
                  setIsAddEmployeeModalOpen(true);
                  console.log('Employee modal should now be open');
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>
              
              {/* Search and Filter */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-64">
                  <Label htmlFor="managerFilter">Filter by Manager</Label>
                  <Select value={selectedManagerFilter} onValueChange={setSelectedManagerFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All managers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All managers</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No employees found</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => {
                      console.log('Add First Employee clicked - opening separate modal');
                      setIsAddEmployeeModalOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Employee
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEmployees.map((employee) => (
                    <div key={employee.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{employee.profile?.full_name || `Employee ${employee.user_id.slice(0, 8)}`}</h4>
                          <p className="text-sm text-muted-foreground">{employee.profile?.email || `ID: ${employee.user_id}`}</p>
                          {!employee.profile?.full_name && (
                            <p className="text-xs text-orange-600">Profile data missing - please update user</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Managed by: {managers.find(m => m.id === employee.manager_id)?.profile?.full_name || 
                                       managers.find(m => m.id === employee.manager_id)?.user_id?.slice(0, 8) || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Employee</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(employee)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserClick(employee)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowCredentials(employee)}>
                              <Shield className="h-4 w-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUserClick(employee)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {activeSidebarItem === 'leads' && !isViewingGroupPage && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Lead Management</h2>
                  <p className="text-muted-foreground">Track and manage your company's leads.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAddLeadGroupModalOpen(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Add Lead Group
                  </Button>
                  <Button variant="outline" onClick={() => setIsUploadCSVModalOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                <Button onClick={() => setIsAddLeadModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
                </div>
              </div>
              
              {/* Tabs for Leads and Lead Groups */}
              <Tabs value={leadsSection} onValueChange={(value) => setLeadsSection(value as 'leads' | 'groups')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="leads">All Leads</TabsTrigger>
                  <TabsTrigger value="groups">Lead Groups</TabsTrigger>
                </TabsList>
                
                <TabsContent value="leads" className="space-y-6">
              {/* Lead Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.length}</div>
                    <p className="text-xs text-muted-foreground">
                      All time leads
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.filter(lead => lead.status === 'active' || lead.status === 'assigned').length}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Converted</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.filter(lead => lead.status === 'converted').length}</div>
                    <p className="text-xs text-muted-foreground">
                      Successfully converted
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {leads.length > 0 ? Math.round((leads.filter(lead => lead.status === 'converted').length / leads.length) * 100) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lead to customer rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* All Leads Section - Now on Top */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                        All Leads ({leads.length})
                  </CardTitle>
                  <CardDescription>
                        Complete list of all leads in your system
                        {selectedLeadIds.size > 0 && (
                          <span className="ml-2 text-blue-600 font-medium">
                            • {selectedLeadIds.size} selected
                          </span>
                        )}
                  </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedLeadIds.size > 0 && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleBulkAssign}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Assign to Manager
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleBulkGroup}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Add to Group
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={handleBulkDelete}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete {selectedLeadIds.size}
                          </Button>
                        </>
                      )}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search leads..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      {company?.industry?.toLowerCase() === 'hr' && (
                        <>
                          <Select
                            value={selectedClientFilter}
                            onValueChange={setSelectedClientFilter}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Filter by Client" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Clients</SelectItem>
                              {Array.from(new Set(leads.filter(l => l.client_id).map(l => l.client_id))).map((clientId) => {
                                const client = clients?.find(c => c.id === clientId);
                                return client ? (
                                  <SelectItem key={clientId} value={clientId}>
                                    {client.name}
                                  </SelectItem>
                                ) : null;
                              })}
                            </SelectContent>
                          </Select>
                          <Select
                            value={selectedJobFilter}
                            onValueChange={setSelectedJobFilter}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Filter by Job" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Jobs</SelectItem>
                              {Array.from(new Set(leads.filter(l => l.job_id).map(l => l.job_id))).filter(Boolean).map((jobId) => {
                                const job = jobs?.find(j => j.id === jobId);
                                const jobTitle = job?.title || jobId;
                                return (
                                  <SelectItem key={jobId} value={jobId}>
                                    {jobTitle}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                      <Select
                        value={selectedEmployeeFilter}
                        onValueChange={setSelectedEmployeeFilter}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by Employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Employees</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.profile?.full_name || employee.full_name || employee.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedManagerFilterLeads}
                        onValueChange={setSelectedManagerFilterLeads}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by Manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Managers</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.profile?.full_name || manager.full_name || manager.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {leads.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No leads found</p>
                      <Button className="mt-4" onClick={() => setIsAddLeadModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Lead
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Select All Checkbox */}
                      {leads.length > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border-2 border-dashed">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.size === leads.length && leads.length > 0}
                            onChange={(e) => handleSelectAllLeads(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                          />
                          <Label className="text-sm font-medium cursor-pointer" onClick={() => handleSelectAllLeads(selectedLeadIds.size !== leads.length)}>
                            Select All ({leads.length} leads)
                          </Label>
                          {selectedLeadIds.size > 0 && selectedLeadIds.size < leads.length && (
                            <span className="text-xs text-muted-foreground">
                              ({selectedLeadIds.size} of {leads.length} selected)
                            </span>
                          )}
                        </div>
                      )}
                      {leads
                        .filter(lead => {
                          const matchesSearch = 
                            lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lead.contact?.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesClient = selectedClientFilter === 'all' || lead.client_id === selectedClientFilter;
                          const matchesJob = selectedJobFilter === 'all' || lead.job_id === selectedJobFilter;
                          const matchesEmployee = selectedEmployeeFilter === 'all' || 
                            (selectedEmployeeFilter === 'unassigned' && !lead.assigned_to) ||
                            lead.assigned_to === selectedEmployeeFilter ||
                            employees.find(emp => emp.id === selectedEmployeeFilter)?.user_id === lead.assigned_to;
                          const matchesManager = selectedManagerFilterLeads === 'all' ||
                            lead.user_id === managers.find(m => m.id === selectedManagerFilterLeads)?.user_id;
                          return matchesSearch && matchesClient && matchesJob && matchesEmployee && matchesManager;
                        })
                        .map((lead) => (
                        <div key={lead.id} className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${selectedLeadIds.has(lead.id) ? 'bg-blue-50 border-blue-300' : ''}`}>
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.has(lead.id)}
                              onChange={() => handleToggleLeadSelection(lead.id)}
                              className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                            />
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{lead.name}</h4>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                              <p className="text-sm text-muted-foreground">{lead.contact}</p>
                              {company?.industry?.toLowerCase() === 'hr' && (
                                <div className="flex gap-2 mt-1">
                                  {lead.clients && (
                                    <Badge variant="outline" className="text-xs">
                                      <Building className="h-3 w-3 mr-1" />
                                      {lead.clients.name}
                                    </Badge>
                                  )}
                                  {lead.jobs && (
                                    <Badge variant="outline" className="text-xs">
                                      <Briefcase className="h-3 w-3 mr-1" />
                                      {lead.jobs.title}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {lead.assigned_employee ? (
                                <p className="text-xs text-green-600">Assigned to Employee: {lead.assigned_employee.full_name}</p>
                              ) : lead.assigned_manager ? (
                                <p className="text-xs text-blue-600">Assigned to Manager: {lead.assigned_manager.full_name}</p>
                              ) : (
                                <p className="text-xs text-orange-600">Unassigned</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{lead.status}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteLead(lead)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                      {leads.filter(lead => 
                        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.contact?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length === 0 && searchTerm && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No leads found matching your search.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
                </TabsContent>

                <TabsContent value="groups" className="space-y-6">
                  {/* Lead Groups Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Lead Groups
                      </CardTitle>
                      <CardDescription>
                        Organize your leads into groups for better management
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {leadGroups.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No lead groups found</p>
                          <Button className="mt-4" onClick={() => setIsAddLeadGroupModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Lead Group
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {leadGroups.map((group) => (
                            <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <h3 className="font-medium">{group.group_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Created {new Date(group.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {leads.filter(lead => lead.group_id === group.id).length} leads
                                </p>
                                {group.assigned_to && (
                                  <p className="text-sm text-blue-600 font-medium">
                                    Assigned to: {managers.find(m => m.id === group.assigned_to)?.profile?.full_name || 'Manager'}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewLeadGroup(group)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleEditLeadGroup(group)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteLeadGroup(group)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Lead Group Full Page View */}
          {activeSidebarItem === 'leads' && isViewingGroupPage && selectedLeadGroup && (
            <div className="space-y-6">
              {/* Header with Back Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewingGroupPage(false);
                      setSelectedLeadGroup(null);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Lead Groups
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedLeadGroup.group_name}</h2>
                    <p className="text-muted-foreground">Manage all leads in this group</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEditLeadGroup(selectedLeadGroup)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Group
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteLeadGroup(selectedLeadGroup)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Group
                  </Button>
                </div>
              </div>

              {/* Group Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {leads.filter(lead => lead.group_id === selectedLeadGroup.id).length}
                    </div>
                    <p className="text-xs text-muted-foreground">In this group</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Assigned To</CardTitle>
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {selectedLeadGroup.assigned_to ? 
                        managers.find(m => m.id === selectedLeadGroup.assigned_to)?.profile?.full_name || 'Manager' :
                        'Unassigned'}
                    </div>
                    <p className="text-xs text-muted-foreground">Manager</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {leads.filter(lead => lead.group_id === selectedLeadGroup.id && (lead.status === 'active' || lead.status === 'assigned')).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Active leads</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Converted</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {leads.filter(lead => lead.group_id === selectedLeadGroup.id && lead.status === 'converted').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Successful conversions</p>
                  </CardContent>
                </Card>
              </div>

              {/* All Leads in Group */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Leads in Group</CardTitle>
                      <CardDescription>
                        View, edit, or delete leads in this group
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      // Pre-populate the group ID when adding from group page
                      setNewLead(prev => ({ ...prev, groupId: selectedLeadGroup.id }));
                      setIsAddLeadModalOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lead to Group
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads in group..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {leads.filter(lead => lead.group_id === selectedLeadGroup.id).length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No leads in this group yet</p>
                      <Button className="mt-4" onClick={() => {
                        // Pre-populate the group ID when adding from group page
                        setNewLead(prev => ({ ...prev, groupId: selectedLeadGroup.id }));
                        setIsAddLeadModalOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Lead
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leads
                        .filter(lead => 
                          lead.group_id === selectedLeadGroup.id &&
                          (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.contact?.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((lead) => (
                          <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-medium text-lg">{lead.name}</h4>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {lead.email}
                                    </span>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {lead.contact}
                                    </span>
                                  </div>
                                  {lead.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{lead.description}</p>
                                  )}
                                  {lead.user_id && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Assigned to: {managers.find(m => m.user_id === lead.user_id)?.profile?.full_name || 'Manager'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                lead.status === 'converted' ? 'default' :
                                lead.status === 'assigned' ? 'secondary' :
                                lead.status === 'active' ? 'outline' : 'destructive'
                              }>
                                {lead.status}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLead(lead)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditLead(lead)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteLead(lead)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      {leads.filter(lead => 
                        lead.group_id === selectedLeadGroup.id &&
                        (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.contact?.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).length === 0 && searchTerm && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No leads found matching your search.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSidebarItem === 'call-history' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Call History</h2>
                <p className="text-muted-foreground">View all calls made by your team members.</p>
              </div>
              <CallHistoryManager 
                companyId={userRole?.company_id || ''} 
                managerId={null} // null means show all calls for the company
              />
            </div>
          )}

          {activeSidebarItem === 'analysis' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Call Analysis</h2>
                <p className="text-muted-foreground">View all call analyses from your company.</p>
              </div>
              
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative md:col-span-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by lead name..."
                        value={analysisSearchTerm}
                        onChange={(e) => setAnalysisSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Employee Filter */}
                    <select
                      value={selectedAnalysisEmployee}
                      onChange={(e) => setSelectedAnalysisEmployee(e.target.value)}
                      className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="all">All Employees</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>

                    {/* Closure Probability Filter */}
                    <select
                      value={selectedClosureProbability}
                      onChange={(e) => setSelectedClosureProbability(e.target.value)}
                      className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="all">All Probabilities</option>
                      <option value="high">High (&gt;=70%)</option>
                      <option value="medium">Medium (40-69%)</option>
                      <option value="low">Low (&lt;40%)</option>
                    </select>

                    {/* Results Count */}
                    <div className="flex items-center justify-center text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
                      <strong className="mr-1">{filteredAnalyses.length}</strong> analysis{filteredAnalyses.length !== 1 ? 'es' : ''} found
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Analyses</CardTitle>
                  <CardDescription>
                    Click any analysis to view detailed insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredAnalyses.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No analyses found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredAnalyses.map((analysis) => (
                        <div 
                          key={analysis.id} 
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => window.open(`/analysis/${analysis.id}`, '_blank')}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">
                                  Call with {analysis.recordings?.call_history?.leads?.name || 'Unknown Lead'}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {analysis.recordings?.call_history?.employees?.full_name || 'Unknown Employee'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(analysis.created_at).toLocaleDateString()}
                              </p>
                              {analysis.closure_probability && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      analysis.closure_probability >= 70 ? 'bg-green-50 text-green-700 border-green-300' :
                                      analysis.closure_probability >= 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                                      'bg-red-50 text-red-700 border-red-300'
                                    }`}
                                  >
                                    Closure: {analysis.closure_probability}%
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <Eye className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSidebarItem === 'reports' && (
            <AdminReportsPage />
          )}

          {activeSidebarItem === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Phone Number Management</h2>
                  <p className="text-muted-foreground">Assign phone numbers to employees for Exotel calling</p>
                </div>
              </div>
              
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Phone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-purple-900">Phone Number Assignments</CardTitle>
                      <CardDescription className="mt-0.5">
                        Each phone number is assigned to one employee for making calls
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Phone Number Assignment Rules:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Each phone number can only be assigned to ONE employee</li>
                        <li>Select a manager first, then choose an employee under that manager</li>
                        <li>Employees can only use their assigned phone number for calling</li>
                      </ul>
                    </div>
                  </div>

                  {/* Add New Phone Number Assignment */}
                  <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-gray-50 to-white">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Plus className="h-5 w-5 text-purple-600" />
                      Add New Phone Number
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-phone-number">Phone Number</Label>
                        <Input
                          id="new-phone-number"
                          value={newFromNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                            if (value.length <= 10) { // Max 10 digits
                              setNewFromNumber(value);
                            }
                          }}
                          placeholder="Enter 10-digit phone number"
                          className="border-purple-200 focus:border-purple-400"
                          maxLength={10}
                        />
                        {newFromNumber && newFromNumber.length < 10 && (
                          <p className="text-xs text-red-600">
                            {10 - newFromNumber.length} more digit{10 - newFromNumber.length !== 1 ? 's' : ''} required
                          </p>
                        )}
                        {newFromNumber && newFromNumber.length === 10 && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Valid phone number
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="assign-manager">Manager</Label>
                        <Select
                          value={selectedManagerFilter}
                          onValueChange={(value) => {
                            setSelectedManagerFilter(value);
                            setBulkAssignManagerId(''); // Reset employee selection
                          }}
                        >
                          <SelectTrigger className="border-purple-200 focus:border-purple-400">
                            <SelectValue placeholder="Select Manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select a Manager</SelectItem>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.profile?.full_name || 'Unnamed Manager'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="assign-employee">Employee</Label>
                        <Select
                          value={bulkAssignManagerId}
                          onValueChange={setBulkAssignManagerId}
                          disabled={!selectedManagerFilter || selectedManagerFilter === 'none'}
                        >
                          <SelectTrigger className="border-purple-200 focus:border-purple-400">
                            <SelectValue placeholder="Select Employee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select an Employee</SelectItem>
                            {employees
                              .filter(emp => emp.manager_id === selectedManagerFilter)
                              .map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.profile?.full_name || 'Unnamed Employee'}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={addFromNumber}
                        disabled={!newFromNumber.trim() || !bulkAssignManagerId || bulkAssignManagerId === 'none'}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Phone Number
                      </Button>
                    </div>
                  </div>

                  {/* Display Current Phone Numbers */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">Assigned Phone Numbers ({phoneAssignments.length})</Label>
                      <Badge className="bg-purple-100 text-purple-700">
                        {phoneAssignments.length} Active
                      </Badge>
                    </div>
                    {phoneAssignments.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No phone numbers assigned yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add your first phone number above</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {phoneAssignments.map((assignment) => (
                          <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Phone className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-mono font-semibold text-lg">{assignment.phone_number}</p>
                                <p className="text-sm text-gray-500">
                                  Assigned to: {assignment.employees?.full_name || 'Unassigned'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {assignment.managers?.full_name && (
                                  <Badge variant="outline" className="text-green-700 border-green-300">
                                    <UserCog className="h-3 w-3 mr-1" />
                                    {assignment.managers.full_name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromNumber(assignment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSidebarItem === 'clients' && (
            <ClientsPage />
          )}

          {activeSidebarItem === 'jobs' && (
            <JobsPage />
          )}

          {activeSidebarItem === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Admin Profile</h2>
                  <p className="text-muted-foreground">Manage your admin account settings and information</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          Personal Information
                        </CardTitle>
                        <CardDescription className="mt-1.5">
                          Your basic account information
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="border-blue-200 hover:bg-blue-50"
                      >
                        {isEditingProfile ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        Full Name
                      </Label>
                      {isEditingProfile ? (
                        <Input
                          value={profileData.full_name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Enter full name"
                          className="border-blue-200 focus:border-blue-400"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{adminProfile?.full_name || user?.user_metadata?.full_name || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        Email Address
                      </Label>
                      <p className="text-lg font-medium text-gray-900">{adminProfile?.email || user?.email || 'Not provided'}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Email cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        Role
                      </Label>
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 text-sm">Administrator</Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        Company
                      </Label>
                      <p className="text-lg font-medium text-gray-900">{company?.name || 'Not provided'}</p>
                    </div>
                    {isEditingProfile && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingProfile(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Company Information */}
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-green-900">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Building className="h-5 w-5 text-green-600" />
                          </div>
                          Company Information
                        </CardTitle>
                        <CardDescription className="mt-1.5">
                          Your company details
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingCompany(!isEditingCompany)}
                        className="border-green-200 hover:bg-green-50"
                      >
                        {isEditingCompany ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Building className="h-4 w-4 text-green-600" />
                        Company Name
                      </Label>
                      {isEditingCompany ? (
                        <Input
                          value={companyData.name}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter company name"
                          className="border-green-200 focus:border-green-400"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{companyProfile?.name || company?.name || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-green-600" />
                        Company Email
                      </Label>
                      {isEditingCompany ? (
                        <Input
                          type="email"
                          value={companyData.email}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter company email"
                          className="border-green-200 focus:border-green-400"
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-900">{companyProfile?.email || company?.email || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-green-600" />
                        Industry
                      </Label>
                      {isEditingCompany ? (
                        <Input
                          value={companyData.industry}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, industry: e.target.value }))}
                          placeholder="Enter industry"
                          className="border-green-200 focus:border-green-400"
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-900">{companyProfile?.industry || company?.industry || 'Not specified'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        Created Date
                      </Label>
                      <p className="text-lg font-medium text-gray-900">{companyProfile?.created_at ? new Date(companyProfile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : (company?.created_at ? new Date(company.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not available')}</p>
                    </div>
                    {isEditingCompany && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingCompany(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveCompany}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Account Statistics */}
              <Card className="border-none shadow-lg lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-purple-900">Account Statistics</CardTitle>
                      <CardDescription className="mt-0.5">Overview of your admin account activity</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <UserCog className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-blue-700">{managers.length}</div>
                      </div>
                      <div className="text-sm font-medium text-blue-800">Managers Created</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{employees.length}</div>
                      </div>
                      <div className="text-sm font-medium text-green-800">Employees Created</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500 rounded-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-purple-700">{leads.length}</div>
                      </div>
                      <div className="text-sm font-medium text-purple-800">Leads Added</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{calls.length}</div>
                      </div>
                      <div className="text-sm font-medium text-orange-800">Total Calls</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Password Management */}
              <Card className="border-none shadow-lg lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-red-900">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Shield className="h-5 w-5 text-red-600" />
                      </div>
                      Password Management
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      Update your account password
                    </CardDescription>
                  </div>
                  {!isPasswordEditing ? (
                    <Button onClick={() => setIsPasswordEditing(true)} size="sm" variant="outline" className="border-red-200 hover:bg-red-50">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handlePasswordChange} size="sm" disabled={isUpdating} className="bg-red-600 hover:bg-red-700">
                        {isUpdating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Update
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsPasswordEditing(false);
                          setPasswordData({
                            new_password: '',
                            confirm_password: '',
                          });
                        }} 
                        size="sm"
                        className="border-red-200 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardHeader>
                {isPasswordEditing && (
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="new_password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-red-600" />
                        New Password
                      </Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                        placeholder="Enter new password (min 6 characters)"
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-red-600" />
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                        placeholder="Confirm new password"
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">Password must be at least 6 characters long. Make sure both passwords match.</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Credentials Modal */}
      <Dialog open={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              User Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Here are the login credentials for the new {generatedCredentials?.role}:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Login Credentials</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-green-800">Name:</label>
                  <p className="text-green-700">{generatedCredentials?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Email:</label>
                  <div className="flex items-center gap-2">
                    <p className="text-green-700 font-mono flex-1">{generatedCredentials?.email}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials?.email || '', 'email')}
                      className="h-8 w-8 p-0"
                    >
                      {copiedItems.email ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Password:</label>
                  <div className="flex items-center gap-2">
                    <p className="text-green-700 font-mono flex-1">{generatedCredentials?.password}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials?.password || '', 'password')}
                      className="h-8 w-8 p-0"
                    >
                      {copiedItems.password ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Role:</label>
                  <p className="text-green-700 capitalize">{generatedCredentials?.role}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Please save these credentials. The {generatedCredentials?.role} will need them to log in.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsCredentialsModalOpen(false)}>
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen} key={addUserType}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New {addUserType === 'manager' ? 'Manager' : 'Employee'}</DialogTitle>
            <DialogDescription>
              Create a new {addUserType} for your company.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            {addUserType === 'manager' && (
              <>
                <div>
                  {console.log('Rendering manager department field, addUserType:', addUserType)}
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={newUser.department}
                    onValueChange={(value) => {
                      setNewUser(prev => ({ ...prev, department: value }));
                      if (value !== 'other') {
                        setCustomDepartment('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_OPTIONS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newUser.department === 'other' && (
                  <div>
                    <Label htmlFor="customDepartment">Specify Department *</Label>
                    <Input
                      id="customDepartment"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      placeholder="Enter department name"
                      required
                    />
                  </div>
                )}
                {/* Client Selection for Manager */}
                {company?.industry?.toLowerCase() === 'hr' && (
                  <div className="space-y-2">
                    <Label>Assign Clients (Optional)</Label>
                    {clients && clients.length > 0 ? (
                      <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {clients.map((client) => (
                        <div key={client.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`client-${client.id}`}
                            checked={selectedClientIds.includes(client.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClientIds(prev => [...prev, client.id]);
                              } else {
                                setSelectedClientIds(prev => prev.filter(id => id !== client.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`client-${client.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {client.name} {client.industry && `(${client.industry})`}
                          </label>
                        </div>
                      ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground border rounded-md p-3">
                        No clients available. Add clients first from the Clients section.
                      </p>
                    )}
                    {selectedClientIds.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedClientIds.length} client(s) selected
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            {addUserType === 'employee' && (
              <div>
                {console.log('Rendering employee manager selection, addUserType:', addUserType)}
                <Label htmlFor="managerId">Manager *</Label>
                <Select
                  value={newUser.managerId}
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, managerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                    <SelectContent>
                      {console.log('Rendering manager dropdown, managers:', managers)}
                      {managers.length === 0 ? (
                        <SelectItem value="no-managers" disabled>
                          No managers available - create a manager first
                        </SelectItem>
                      ) : (
                        managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                </Select>
                {managers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You need to create a manager first before adding employees.
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddUserModalOpen(false);
                setCustomDepartment("");
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newUser.fullName || !newUser.email || !newUser.password || (addUserType === 'manager' && (!newUser.department || (newUser.department === 'other' && !customDepartment))) || (addUserType === 'employee' && !newUser.managerId)}>
                Create {addUserType === 'manager' ? 'Manager' : 'Employee'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Employee Modal - Separate Form */}
      <Dialog open={isAddEmployeeModalOpen} onOpenChange={setIsAddEmployeeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee - SEPARATE FORM</DialogTitle>
            <DialogDescription>
              Create a new employee for your company.
            </DialogDescription>
            {console.log('Employee modal is open:', isAddEmployeeModalOpen)}
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <Label htmlFor="employeeFullName">Full Name *</Label>
              <Input
                id="employeeFullName"
                value={newEmployee.fullName}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="employeeEmail">Email *</Label>
              <Input
                id="employeeEmail"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="employeePassword">Password *</Label>
              <div className="relative">
                <Input
                  id="employeePassword"
                  type={showEmployeePassword ? "text" : "password"}
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                >
                  {showEmployeePassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="employeePhone">Phone</Label>
              <Input
                id="employeePhone"
                value={newEmployee.phone || ""}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="employeeManagerId">Manager *</Label>
              <Select
                value={newEmployee.managerId}
                onValueChange={(value) => setNewEmployee(prev => ({ ...prev, managerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.length === 0 ? (
                    <SelectItem value="no-managers" disabled>
                      No managers available - create a manager first
                    </SelectItem>
                  ) : (
                    managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {managers.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  You need to create a manager first before adding employees.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddEmployeeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newEmployee.fullName || !newEmployee.email || !newEmployee.password || !newEmployee.managerId}>
                Create Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Modal */}
      <Dialog open={isViewUserModalOpen} onOpenChange={setIsViewUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Details
            </DialogTitle>
            <DialogDescription>
              Complete information about {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-medium">{selectedUser.profile?.full_name || selectedUser.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-lg">{selectedUser.profile?.email || selectedUser.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Password</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded border">
                        {showUserDetailsPassword ? (selectedUser.profile?.password || selectedUser.password || 'Not available') : '••••••••'}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowUserDetailsPassword(!showUserDetailsPassword)}
                        className="h-8"
                      >
                        {showUserDetailsPassword ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {showUserDetailsPassword ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                    <Badge variant="secondary" className="capitalize">{selectedUser.role}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={selectedUser.is_active ? "default" : "destructive"}>
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  {(selectedUser.department || selectedUser.profile?.department) && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                      <p className="text-lg">{selectedUser.profile?.department || selectedUser.department}</p>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-lg">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p className="text-lg">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-lg">{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              {selectedUser.role === 'manager' && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Team Members</Label>
                  <p className="text-lg">{managers.find(m => m.id === selectedUser.id)?.employees.length || 0} employees</p>
                </div>
              )}
              {selectedUser.role === 'employee' && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Manager</Label>
                  <p className="text-lg">
                    {managers.find(m => m.id === selectedUser.manager_id)?.profile?.full_name || 'Unassigned'}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsViewUserModalOpen(false);
              setShowUserDetailsPassword(false);
            }}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewUserModalOpen(false);
              setShowUserDetailsPassword(false);
              handleEditUserClick(selectedUser!);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update information for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFullName">Full Name *</Label>
                <Input
                  id="editFullName"
                  value={editUser.fullName}
                  onChange={(e) => setEditUser(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder={selectedUser?.profile?.full_name || selectedUser?.full_name || "Enter full name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={selectedUser?.profile?.email || selectedUser?.email || "Enter email address"}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={editUser.phone}
                  onChange={(e) => setEditUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={selectedUser?.phone || "Enter phone number"}
                />
              </div>
              <div>
                <Label htmlFor="editPassword">New Password (optional)</Label>
                <div className="relative">
                  <Input
                    id="editPassword"
                    type={showPassword ? "text" : "password"}
                    value={editUser.password}
                    onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave blank to keep current password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {editUser.role === 'manager' && (
              <>
                <div>
                  <Label htmlFor="editDepartment">Department *</Label>
                  <Input
                    id="editDepartment"
                    value={editUser.department}
                    onChange={(e) => setEditUser(prev => ({ ...prev, department: e.target.value }))}
                    placeholder={selectedUser?.profile?.department || selectedUser?.department || "Enter department name"}
                    required
                  />
                </div>
                
                {/* Client Selection for Manager */}
                {company?.industry?.toLowerCase() === 'hr' && (
                  <div className="space-y-2">
                    <Label>Assigned Clients</Label>
                    {clients && clients.length > 0 ? (
                      <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                        {clients.map((client) => (
                          <div key={client.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-client-${client.id}`}
                              checked={selectedClientIds.includes(client.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedClientIds(prev => [...prev, client.id]);
                                } else {
                                  setSelectedClientIds(prev => prev.filter(id => id !== client.id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`edit-client-${client.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {client.name} {client.industry && `(${client.industry})`}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground border rounded-md p-3">
                        No clients available. Add clients first from the Clients section.
                      </p>
                    )}
                    {selectedClientIds.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedClientIds.length} client(s) selected
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {editUser.role === 'employee' && (
              <div>
                <Label htmlFor="editManagerId">Manager *</Label>
                <Select
                  value={editUser.managerId}
                  onValueChange={(value) => setEditUser(prev => ({ ...prev, managerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editUser.is_active}
                onChange={(e) => setEditUser(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="editIsActive">Active User</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating || !editUser.fullName || !editUser.email}>
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update User
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={isDeleteUserModalOpen} onOpenChange={setIsDeleteUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.full_name}? This action will permanently remove them from the database and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser?.role === 'manager' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> If this manager has employees assigned, you must reassign or remove those employees first before deleting the manager.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lead Modal */}
      <Dialog open={isAddLeadModalOpen} onOpenChange={setIsAddLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Add a new lead and assign it to a manager.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLead} className="space-y-4">
            <div>
              <Label htmlFor="leadName">Name *</Label>
              <Input
                id="leadName"
                value={newLead.name}
                onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter lead name"
                required
              />
            </div>
            <div>
              <Label htmlFor="leadEmail">Email *</Label>
              <Input
                id="leadEmail"
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="leadContact">Contact *</Label>
              <Input
                id="leadContact"
                value={newLead.contact}
                onChange={(e) => setNewLead(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="Enter contact number"
                required
              />
            </div>
            <div>
              <Label htmlFor="leadDescription">Description</Label>
              <Textarea
                id="leadDescription"
                value={newLead.description}
                onChange={(e) => setNewLead(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
            {/* Show group selection only if not viewing from a specific group page */}
            {isViewingGroupPage && selectedLeadGroup ? (
              <div>
                <Label>Lead Group</Label>
                <div className="p-2 bg-muted rounded-md border">
                  <p className="text-sm font-medium">{selectedLeadGroup.group_name}</p>
                  <p className="text-xs text-muted-foreground">Adding lead to this group</p>
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="groupId">Lead Group</Label>
                <Select value={newLead.groupId || "none"} onValueChange={(value) => setNewLead(prev => ({ ...prev, groupId: value === "none" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {leadGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.group_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {newLead.groupId && newLead.groupId !== "none" ? (
              (() => {
                const selectedGroup = leadGroups.find(g => g.id === newLead.groupId);
                const hasManagerAssigned = selectedGroup?.assigned_to;
                const assignedManager = hasManagerAssigned ? managers.find(m => m.id === selectedGroup.assigned_to) : null;
                
                return hasManagerAssigned ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This lead will be assigned based on the group's assignment to a manager.
                      <span className="block mt-1">
                        Group assigned to: <strong>{assignedManager?.profile?.full_name || 'Manager'}</strong>
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>⚠️ Warning:</strong> This lead group is not assigned to any manager yet.
                      <span className="block mt-1">
                        Please edit the group and assign it to a manager before adding leads to it.
                      </span>
                    </p>
                  </div>
                );
              })()
            ) : (
              <div>
                <Label htmlFor="assignedTo">Assign to Manager</Label>
                <Select value={newLead.assignedTo} onValueChange={(value) => setNewLead(prev => ({ ...prev, assignedTo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No assignment</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.user_id} value={manager.user_id}>
                        {manager.profile?.full_name || manager.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddLeadModalOpen(false);
                // Reset form when canceling
                setNewLead({
                  name: "",
                  email: "",
                  contact: "",
                  description: "",
                  assignedTo: "",
                  groupId: "",
                });
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={
                !newLead.name || 
                !newLead.email || 
                !newLead.contact ||
                // Disable if group is selected but not assigned to a manager
                (newLead.groupId && newLead.groupId !== "none" && !leadGroups.find(g => g.id === newLead.groupId)?.assigned_to) ||
                // Disable if neither group nor direct assignment is made
                (!newLead.groupId || newLead.groupId === "none") && (!newLead.assignedTo || newLead.assignedTo === "unassigned")
              }>
                Add Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Lead Group Modal */}
      <Dialog open={isAddLeadGroupModalOpen} onOpenChange={setIsAddLeadGroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead Group</DialogTitle>
            <DialogDescription>
              Create a new lead group to organize your leads.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!userRole?.company_id) return;

            try {
              const { error } = await supabase
                .from('lead_groups')
                .insert({
                  user_id: user?.id,
                  group_name: newLeadGroup.groupName,
                  company_id: userRole.company_id,
                  assigned_to: newLeadGroup.assignedTo === "unassigned" ? null : newLeadGroup.assignedTo || null,
                });

              if (error) throw error;

              toast({
                title: 'Success',
                description: 'Lead group created successfully!',
              });

              setNewLeadGroup({
                groupName: '',
                assignedTo: '',
              });
              setIsAddLeadGroupModalOpen(false);
              fetchUsers(); // Refresh data
            } catch (error: any) {
              console.error('Error adding lead group:', error);
              toast({
                title: 'Error',
                description: error.message || 'Failed to create lead group. Please try again.',
                variant: 'destructive',
              });
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={newLeadGroup.groupName}
                  onChange={(e) => setNewLeadGroup(prev => ({ ...prev, groupName: e.target.value }))}
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="assignedTo">Assign to Manager (Optional)</Label>
                <Select
                  value={newLeadGroup.assignedTo}
                  onValueChange={(value) => setNewLeadGroup(prev => ({ ...prev, assignedTo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddLeadGroupModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newLeadGroup.groupName}>
                Create Group
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Group Modal */}
      <Dialog open={isEditLeadGroupModalOpen} onOpenChange={setIsEditLeadGroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead Group</DialogTitle>
            <DialogDescription>
              Update the lead group details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedLeadGroup) return;

            try {
              const { error } = await supabase
                .from('lead_groups')
                .update({
                  group_name: selectedLeadGroup.group_name,
                  assigned_to: selectedLeadGroup.assigned_to === "unassigned" ? null : selectedLeadGroup.assigned_to || null,
                })
                .eq('id', selectedLeadGroup.id);

              if (error) throw error;

              toast({
                title: 'Success',
                description: 'Lead group updated successfully!',
              });

              setIsEditLeadGroupModalOpen(false);
              setSelectedLeadGroup(null);
              fetchUsers(); // Refresh data
            } catch (error: any) {
              console.error('Error updating lead group:', error);
              toast({
                title: 'Error',
                description: error.message || 'Failed to update lead group. Please try again.',
                variant: 'destructive',
              });
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editGroupName">Group Name</Label>
                <Input
                  id="editGroupName"
                  value={selectedLeadGroup?.group_name || ''}
                  onChange={(e) => setSelectedLeadGroup(prev => prev ? { ...prev, group_name: e.target.value } : null)}
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editAssignedTo">Assign to Manager (Optional)</Label>
                <Select
                  value={selectedLeadGroup?.assigned_to || 'unassigned'}
                  onValueChange={(value) => setSelectedLeadGroup(prev => prev ? { ...prev, assigned_to: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditLeadGroupModalOpen(false);
                setSelectedLeadGroup(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedLeadGroup?.group_name}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Lead Group Modal */}
      <Dialog open={isViewLeadGroupModalOpen} onOpenChange={setIsViewLeadGroupModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Lead Group: {selectedLeadGroup?.group_name}</DialogTitle>
            <DialogDescription>
              View all leads in this group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-muted-foreground">Group Name</Label>
                <p className="font-medium">{selectedLeadGroup?.group_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Leads</Label>
                <p className="font-medium">{leads.filter(lead => lead.group_id === selectedLeadGroup?.id).length}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="font-medium">{selectedLeadGroup?.created_at ? new Date(selectedLeadGroup.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Assigned To</Label>
                <p className="font-medium">
                  {selectedLeadGroup?.assigned_to ? 
                    managers.find(m => m.id === selectedLeadGroup.assigned_to)?.profile?.full_name || 'Manager' :
                    'Unassigned'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Leads in this Group</h3>
              {leads.filter(lead => lead.group_id === selectedLeadGroup?.id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leads in this group yet
                </div>
              ) : (
                <div className="space-y-2">
                  {leads.filter(lead => lead.group_id === selectedLeadGroup?.id).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                        <p className="text-sm text-muted-foreground">{lead.contact}</p>
                      </div>
                      <Badge variant={
                        lead.status === 'converted' ? 'default' :
                        lead.status === 'assigned' ? 'secondary' :
                        lead.status === 'active' ? 'outline' : 'destructive'
                      }>
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" onClick={() => {
              setIsViewLeadGroupModalOpen(false);
              setSelectedLeadGroup(null);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Group Confirmation Modal */}
      <Dialog open={isDeleteLeadGroupModalOpen} onOpenChange={setIsDeleteLeadGroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Lead Group
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedLeadGroup?.group_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLeadGroup && (
              <>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-900 mb-2">
                    ⚠️ Warning: Cascading Delete
                  </p>
                  <p className="text-sm text-red-800">
                    Deleting this group will also <strong>permanently delete all {leads.filter(l => l.group_id === selectedLeadGroup.id).length} lead{leads.filter(l => l.group_id === selectedLeadGroup.id).length !== 1 ? 's' : ''}</strong> in this group.
                  </p>
                </div>
                {leads.filter(l => l.group_id === selectedLeadGroup.id).length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg max-h-48 overflow-y-auto">
                    <p className="text-xs font-semibold text-amber-900 mb-2">Leads to be deleted:</p>
                    <div className="space-y-1">
                      {leads.filter(l => l.group_id === selectedLeadGroup.id).slice(0, 5).map(lead => (
                        <div key={lead.id} className="text-xs bg-white p-2 rounded border">
                          • {lead.name} - {lead.email}
                        </div>
                      ))}
                      {leads.filter(l => l.group_id === selectedLeadGroup.id).length > 5 && (
                        <p className="text-xs text-amber-700 pt-1">
                          ...and {leads.filter(l => l.group_id === selectedLeadGroup.id).length - 5} more leads
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setIsDeleteLeadGroupModalOpen(false);
              setSelectedLeadGroup(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteLeadGroup}>
              Yes, Delete Group & All Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Confirmation Modal */}
      <Dialog open={isDeleteLeadModalOpen} onOpenChange={setIsDeleteLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Lead
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{leadToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {leadToDelete && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm"><span className="font-medium">Name:</span> {leadToDelete.name}</p>
                <p className="text-sm"><span className="font-medium">Email:</span> {leadToDelete.email}</p>
                <p className="text-sm"><span className="font-medium">Contact:</span> {leadToDelete.contact}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setIsDeleteLeadModalOpen(false);
              setLeadToDelete(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteLead}>
              Yes, Delete Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Multiple Leads
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-2">
                You are about to delete:
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {Array.from(selectedLeadIds).slice(0, 10).map(leadId => {
                  const lead = leads.find(l => l.id === leadId);
                  return lead ? (
                    <div key={leadId} className="text-xs bg-white p-2 rounded border">
                      <p><strong>{lead.name}</strong> - {lead.email}</p>
                    </div>
                  ) : null;
                })}
                {selectedLeadIds.size > 10 && (
                  <p className="text-xs text-red-700 pt-2">
                    ...and {selectedLeadIds.size - 10} more leads
                  </p>
                )}
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> This will permanently delete all selected leads and cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setIsBulkDeleteModalOpen(false);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Yes, Delete {selectedLeadIds.size} Lead{selectedLeadIds.size > 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign to Manager Modal */}
      <Dialog open={isBulkAssignModalOpen} onOpenChange={(open) => {
        setIsBulkAssignModalOpen(open);
        if (!open) {
          setBulkAssignManagerId('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Leads to Manager</DialogTitle>
            <DialogDescription>
              Select a manager to assign {selectedLeadIds.size} selected lead{selectedLeadIds.size > 1 ? 's' : ''} to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-manager">Select Manager</Label>
              <Select
                value={bulkAssignManagerId}
                onValueChange={setBulkAssignManagerId}
              >
                <SelectTrigger id="bulk-manager">
                  <SelectValue placeholder="Choose a manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.profile?.full_name || manager.full_name || manager.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? 's' : ''} will be assigned to the selected manager.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsBulkAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmBulkAssign}
              disabled={!bulkAssignManagerId}
            >
              Assign Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Add to Group Modal */}
      <Dialog open={isBulkGroupModalOpen} onOpenChange={(open) => {
        setIsBulkGroupModalOpen(open);
        if (!open) {
          setBulkGroupOption('existing');
          setBulkSelectedGroupId('');
          setBulkNewGroupName('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Leads to Group</DialogTitle>
            <DialogDescription>
              Add {selectedLeadIds.size} selected lead{selectedLeadIds.size > 1 ? 's' : ''} to an existing group or create a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Option</Label>
              <Select
                value={bulkGroupOption}
                onValueChange={(value) => setBulkGroupOption(value as 'existing' | 'new')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Add to Existing Group</SelectItem>
                  <SelectItem value="new">Create New Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkGroupOption === 'existing' ? (
              <div>
                <Label htmlFor="bulk-group">Select Group</Label>
                <Select
                  value={bulkSelectedGroupId}
                  onValueChange={setBulkSelectedGroupId}
                >
                  <SelectTrigger id="bulk-group">
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="bulk-new-group">New Group Name</Label>
                <Input
                  id="bulk-new-group"
                  value={bulkNewGroupName}
                  onChange={(e) => setBulkNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? 's' : ''} will be added to {bulkGroupOption === 'new' ? 'a new' : 'the selected'} group.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsBulkGroupModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmBulkGroup}
              disabled={
                (bulkGroupOption === 'existing' && !bulkSelectedGroupId) ||
                (bulkGroupOption === 'new' && !bulkNewGroupName.trim())
              }
            >
              Add to Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload CSV Modal */}
      <Dialog open={isUploadCSVModalOpen} onOpenChange={(open) => {
        setIsUploadCSVModalOpen(open);
        if (!open) {
          // Reset when closing
          setCsvFile(null);
          setCsvLeads([]);
          setCsvGroupOption('none');
          setCsvSelectedGroupId('');
          setCsvNewGroupName('');
          setCsvAssignedTo('unassigned');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload CSV File</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple leads at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Sample CSV Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Need a template?</h4>
                  <p className="text-xs text-blue-700 mb-2">
                    Download our sample CSV file to see the required format with example data.
                  </p>
                  <p className="text-xs text-blue-600 font-mono">
                    Required columns: name, email, contact, company, description
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleCSV}
                  className="ml-4 bg-white hover:bg-blue-50 border-blue-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Sample CSV
                </Button>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {csvFile ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-600">✓ File selected: {csvFile.name}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCsvFile(null);
                      setCsvLeads([]);
                    }}
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-2">Click to browse and select a CSV file</p>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="csv-upload"
                    onChange={handleCSVFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('csv-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </>
              )}
            </div>

            {csvLeads.length > 0 && (
              <>
                <div className="border rounded-lg p-4 bg-green-50">
                  <h4 className="font-semibold text-sm mb-2 text-green-800">
                    Preview: {csvLeads.length} leads found
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {csvLeads.slice(0, 5).map((lead, index) => (
                      <div key={index} className="text-xs p-2 bg-white rounded border">
                        <p><strong>Name:</strong> {lead.name}</p>
                        <p><strong>Email:</strong> {lead.email}</p>
                        <p><strong>Contact:</strong> {lead.contact}</p>
                        {lead.description && <p><strong>Description:</strong> {lead.description}</p>}
                      </div>
                    ))}
                    {csvLeads.length > 5 && (
                      <p className="text-xs text-gray-600 text-center pt-2">
                        ...and {csvLeads.length - 5} more leads
                      </p>
                    )}
                  </div>
                </div>

                {/* Lead Group Options */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Lead Group (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-3">Organize these leads into a group</p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="csv-group-none"
                          name="csv-group"
                          value="none"
                          checked={csvGroupOption === 'none'}
                          onChange={() => setCsvGroupOption('none')}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="csv-group-none" className="font-normal cursor-pointer">
                          No group
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="csv-group-existing"
                          name="csv-group"
                          value="existing"
                          checked={csvGroupOption === 'existing'}
                          onChange={() => setCsvGroupOption('existing')}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="csv-group-existing" className="font-normal cursor-pointer">
                          Add to existing group
                        </Label>
                      </div>
                      {csvGroupOption === 'existing' && (
                        <div className="ml-6">
                          <Select value={csvSelectedGroupId} onValueChange={setCsvSelectedGroupId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a group" />
                            </SelectTrigger>
                            <SelectContent>
                              {leadGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.group_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="csv-group-new"
                          name="csv-group"
                          value="new"
                          checked={csvGroupOption === 'new'}
                          onChange={() => setCsvGroupOption('new')}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="csv-group-new" className="font-normal cursor-pointer">
                          Create new group
                        </Label>
                      </div>
                      {csvGroupOption === 'new' && (
                        <div className="ml-6">
                          <Input
                            placeholder="Enter new group name"
                            value={csvNewGroupName}
                            onChange={(e) => setCsvNewGroupName(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assignment Options */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <Label htmlFor="csv-assign" className="text-sm font-semibold">Assign To Manager</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      {csvGroupOption === 'new' 
                        ? 'Assign the new group to a manager' 
                        : csvGroupOption === 'existing'
                        ? 'Note: Leads will be assigned based on the selected group\'s manager'
                        : 'Directly assign these leads to a manager'}
                    </p>
                    {(csvGroupOption === 'none' || csvGroupOption === 'new') && (
                      <Select value={csvAssignedTo} onValueChange={setCsvAssignedTo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.user_id} value={manager.user_id}>
                              {manager.profile?.full_name || manager.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {csvGroupOption === 'existing' && csvSelectedGroupId && (
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-800">
                          {leadGroups.find(g => g.id === csvSelectedGroupId)?.assigned_to ? (
                            <>
                              <strong>Assigned to:</strong> {managers.find(m => m.id === leadGroups.find(g => g.id === csvSelectedGroupId)?.assigned_to)?.profile?.full_name || 'Manager'}
                            </>
                          ) : (
                            <span className="text-amber-700">⚠️ This group has no manager assigned yet</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">Required CSV Format:</p>
              <p className="text-blue-800">Name, Email, Contact, Description (optional)</p>
              <p className="mt-2 text-blue-800"><strong>Example:</strong></p>
              <code className="text-xs block bg-white p-2 rounded mt-1 text-blue-900">
                John Doe, john@example.com, +1234567890, Interested in premium plan<br/>
                Jane Smith, jane@example.com, +0987654321, Follow up next week
              </code>
              <p className="mt-2 text-xs text-blue-700">
                ℹ️ First row can be headers (Name, Email, Contact, Description) or data - both formats supported
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsUploadCSVModalOpen(false);
                setCsvFile(null);
                setCsvLeads([]);
                setCsvGroupOption('none');
                setCsvSelectedGroupId('');
                setCsvNewGroupName('');
                setCsvAssignedTo('unassigned');
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleCSVUpload}
              disabled={csvLeads.length === 0 || isUploadingCSV}
            >
              {isUploadingCSV ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {csvLeads.length} Leads
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Lead Modal */}
      <Dialog open={isViewLeadModalOpen} onOpenChange={setIsViewLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              View details for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-sm font-medium">{selectedLead.name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm font-medium">{selectedLead.email}</p>
              </div>
              <div>
                <Label>Contact</Label>
                <p className="text-sm font-medium">{selectedLead.contact}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm font-medium">{selectedLead.description || 'No description'}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant="secondary">{selectedLead.status}</Badge>
              </div>
              <div>
                <Label>Assignment</Label>
                {selectedLead.assigned_employee ? (
                  <p className="text-sm text-green-600">Assigned to Employee: {selectedLead.assigned_employee.full_name}</p>
                ) : selectedLead.assigned_manager ? (
                  <p className="text-sm text-blue-600">Assigned to Manager: {selectedLead.assigned_manager.full_name}</p>
                ) : (
                  <p className="text-sm text-orange-600">Unassigned</p>
                )}
              </div>
              <div>
                <Label>Created</Label>
                <p className="text-sm font-medium">{new Date(selectedLead.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsViewLeadModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewLeadModalOpen(false);
              handleEditLead(selectedLead);
            }}>
              Edit Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Modal */}
      <Dialog open={isEditLeadModalOpen} onOpenChange={setIsEditLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update details for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const { error } = await supabase
                  .from('leads')
                  .update({
                    name: selectedLead.name,
                    email: selectedLead.email,
                    contact: selectedLead.contact,
                    description: selectedLead.description,
                    user_id: selectedLead.user_id,
                    status: selectedLead.user_id ? 'assigned' : 'unassigned',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', selectedLead.id);

                if (error) throw error;

                toast({
                  title: 'Success',
                  description: 'Lead updated successfully!',
                });

                setIsEditLeadModalOpen(false);
                fetchUsers(); // Refresh data
              } catch (error: any) {
                console.error('Error updating lead:', error);
                toast({
                  title: 'Error',
                  description: error.message || 'Failed to update lead. Please try again.',
                  variant: 'destructive',
                });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedLead.name}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedLead.email}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contact">Contact</Label>
                  <Input
                    id="edit-contact"
                    value={selectedLead.contact}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, contact: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedLead.description || ''}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter lead description"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-assignment">Assignment</Label>
                  <Select value={selectedLead.user_id || "unassigned"} onValueChange={(value) => setSelectedLead(prev => ({ ...prev, user_id: value === "unassigned" ? null : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">No assignment</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.user_id} value={manager.user_id}>
                          {manager.profile?.full_name || manager.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditLeadModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Lead
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Sign Out
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Are you sure you want to sign out? You will need to log in again to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSignOutDialogOpen(false)}
              className="font-medium"
            >
              No, Stay
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmSignOut}
              className="font-medium"
            >
              Yes, Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


