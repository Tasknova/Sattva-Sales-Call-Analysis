// Updated ManagerDashboard - Fixed data fetching and employee creation
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import CallHistoryManager from "@/components/CallHistoryManager";
import ManagerProfilePage from "@/components/ManagerProfilePage";
import ManagerReportsPage from "@/components/ManagerReportsPage";
import ClientsPage from "@/components/ClientsPage";
import JobsPage from "@/components/JobsPage";
import EmployeeProductivityPage from "@/components/EmployeeProductivityPage";
import AddLeadModal from "@/components/AddLeadModal";
import EditLeadModal from "@/components/EditLeadModal";
import { useLeads, useClients } from "@/hooks/useSupabaseData";
import { ScatterChart, Scatter, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as ChartTooltip, Legend } from "recharts";
import { 
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
  BarChart3,
  PhoneCall,
  User,
  LogOut,
  Upload,
  Play,
  Download,
  History,
  FileText,
  UserCog,
  Building,
  AlertTriangle,
  Calendar,
  Briefcase,
  Filter
} from "lucide-react";

interface Employee {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  user?: {
    id: string;
    email: string;
    user_metadata: any;
  };
}

interface Lead {
  id: string;
  name: string;
  email: string;
  contact: string;
  company?: string;
  status: string;
  assigned_to?: string;
  created_at: string;
  description?: string;
  openings?: number;
}

interface Call {
  id: string;
  lead_id: string;
  employee_id: string;
  recording_url: string;
  status: 'completed' | 'in_progress' | 'failed';
  outcome?: string;
  created_at: string;
}

interface CallOutcome {
  id: string;
  lead_id: string;
  employee_id: string;
  outcome: string;
  call_date: string;
  created_at: string;
}

interface Analysis {
  id: string;
  recording_id: string;
  sentiment_score: number;
  engagement_score: number;
  confidence_score_executive: number;
  confidence_score_person: number;
  detailed_call_analysis: any;
  created_at: string;
}

export default function ManagerDashboard() {
  const { user, userRole, company, signOut } = useAuth();
  const { toast } = useToast();
  
  // Session timeout: 30 minutes for manager
  useSessionTimeout({ timeoutMinutes: 30, warningMinutes: 5 });
  
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { data: allLeads, isLoading: leadsLoading } = useLeads(); // Use React Query hook
  const [assignedClients, setAssignedClients] = useState<any[]>([]); // Only clients assigned to this manager
  const [jobs, setJobs] = useState<any[]>([]);
  const [leadGroups, setLeadGroups] = useState<any[]>([]);
  const [clientOverviewFilter, setClientOverviewFilter] = useState<string>('all');
  const [calls, setCalls] = useState<Call[]>([]);
  const [callOutcomes, setCallOutcomes] = useState<CallOutcome[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [manager, setManager] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [leadsSection, setLeadsSection] = useState<'leads' | 'groups'>('leads');
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [isAssignLeadModalOpen, setIsAssignLeadModalOpen] = useState(false);
  const [isAddLeadGroupModalOpen, setIsAddLeadGroupModalOpen] = useState(false);
  const [isViewLeadGroupModalOpen, setIsViewLeadGroupModalOpen] = useState(false);
  const [isViewingGroupPage, setIsViewingGroupPage] = useState(false);
  const [selectedLeadGroup, setSelectedLeadGroup] = useState<any>(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [analysisSearchTerm, setAnalysisSearchTerm] = useState("");
  const [selectedAnalysisEmployee, setSelectedAnalysisEmployee] = useState<string>("all");
  const [selectedClosureProbability, setSelectedClosureProbability] = useState<string>("all");
  const [isDeleteLeadModalOpen, setIsDeleteLeadModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkAssignEmployeeModalOpen, setIsBulkAssignEmployeeModalOpen] = useState(false);
  const [bulkAssignEmployeeId, setBulkAssignEmployeeId] = useState<string>('');
  const [newLeadGroup, setNewLeadGroup] = useState({
    groupName: "",
    description: "",
  });
  
  // CSV Upload states
  const [isUploadCSVModalOpen, setIsUploadCSVModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLeads, setCsvLeads] = useState<any[]>([]);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvGroupOption, setCsvGroupOption] = useState<'none' | 'existing' | 'new'>('none');
  const [csvSelectedGroupId, setCsvSelectedGroupId] = useState<string>('');
  const [csvNewGroupName, setCsvNewGroupName] = useState<string>('');
  const [csvAssignedTo, setCsvAssignedTo] = useState<string>('unassigned');
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [createdEmployeeCredentials, setCreatedEmployeeCredentials] = useState<{email: string, password: string, fullName: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedItems, setCopiedItems] = useState<{
    email: boolean;
    password: boolean;
  }>({ email: false, password: false });
  const [newEmployee, setNewEmployee] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    contact: "",
    company: "",
    description: "",
    assignedTo: "",
    groupId: "",
  });

  useEffect(() => {
    if (userRole && company) {
      fetchData();
    }
  }, [userRole, company]);

  // Helper function to check if a date is within the selected range
  const isDateInRange = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Always compare using UTC date components to avoid timezone issues
    const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    
    switch (dateRangeFilter) {
      case 'today':
        return dateUTC === nowUTC;
      
      case 'yesterday':
        const yesterdayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1);
        return dateUTC === yesterdayUTC;
      
      case 'week':
        // Last 7 days including today
        const weekAgoUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6);
        return dateUTC >= weekAgoUTC && dateUTC <= nowUTC;
      
      case 'month':
        // Last 30 days including today
        const monthAgoUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29);
        return dateUTC >= monthAgoUTC && dateUTC <= nowUTC;
      
      case 'custom':
        if (!customStartDate || !customEndDate) return true;
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
        return dateUTC >= startUTC && dateUTC <= endUTC;
      
      default:
        return true;
    }
  };

  // Filter data based on date range for overview tab
  const dateFilteredCallOutcomes = callOutcomes.filter(outcome => isDateInRange(outcome.call_date || outcome.created_at));
  const dateFilteredCalls = calls.filter(call => isDateInRange(call.call_date || call.created_at));
  const dateFilteredAnalyses = analyses.filter(analysis => isDateInRange(analysis.created_at));

  const fetchData = async () => {
    if (!userRole?.company_id) return;

    try {
      setLoading(true);

      // First, get the manager's data
      const { data: managerData, error: managerError } = await supabase
        .from('managers')
        .select('*')
        .eq('user_id', userRole.user_id)
        .eq('company_id', userRole.company_id)
        .single();

      if (managerError) throw managerError;
      
      // Set manager data
      setManager(managerData);

      // Fetch clients assigned to this manager
      const { data: clientAssignmentsData, error: clientAssignmentsError } = await supabase
        .from('manager_client_assignments')
        .select('client_id, clients(*)')
        .eq('manager_id', managerData.id)
        .eq('is_active', true);

      if (clientAssignmentsError) {
        console.error('Client assignments error:', clientAssignmentsError);
        setAssignedClients([]);
      } else {
        const clients = clientAssignmentsData?.map(assignment => assignment.clients).filter(Boolean) || [];
        setAssignedClients(clients);
      }

      // Fetch jobs for assigned clients
      if (clientAssignmentsData && clientAssignmentsData.length > 0) {
        const clientIds = clientAssignmentsData.map(assignment => assignment.client_id);
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*, clients(*)')
          .in('client_id', clientIds)
          .eq('is_active', true);

        if (jobsError) {
          console.error('Jobs error:', jobsError);
          setJobs([]);
        } else {
          setJobs(jobsData || []);
        }
      } else {
        setJobs([]);
      }

      // Fetch employees under this manager (exclude the manager themselves)
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', userRole.company_id)
        .eq('manager_id', managerData.id)
        .eq('is_active', true)
        .neq('user_id', userRole.user_id);

      if (employeesError) throw employeesError;

      const formattedEmployees = employeesData?.map(emp => ({
        id: emp.id,
        user_id: emp.user_id,
        email: emp.email,
        full_name: emp.full_name,
        phone: emp.phone,
        is_active: emp.is_active,
        created_at: emp.created_at,
        updated_at: emp.updated_at
      })) || [];

      setEmployees(formattedEmployees);

      // Fetch lead groups assigned to this manager
      const { data: leadGroupsData, error: leadGroupsError } = await supabase
        .from('lead_groups')
        .select('*')
        .eq('assigned_to', managerData.id)
        .eq('company_id', userRole.company_id);

      if (leadGroupsError) {
        console.error('Lead groups error:', leadGroupsError);
        setLeadGroups([]);
      } else {
        setLeadGroups(leadGroupsData || []);
      }

      // Fetch call outcomes made by employees under this manager
      // NOTE: call_history.employee_id stores user_id, not employees.id
      console.log('Employee user_ids for call outcomes:', formattedEmployees.map(emp => emp.user_id));
      
      let callsData = [];
      let callsError = null;
      
      if (formattedEmployees.length > 0) {
        const employeeUserIds = formattedEmployees.map(emp => emp.user_id);
        console.log('Manager Dashboard - Fetching calls for employee user_ids:', employeeUserIds);
        const { data, error } = await supabase
          .from('call_history')
          .select('*, leads(name, email, contact), employees(full_name, email)')
          .in('employee_id', employeeUserIds)
          .eq('company_id', userRole.company_id)
          .order('created_at', { ascending: false });
        callsData = data;
        callsError = error;
        console.log('Manager Dashboard - Calls fetch result:', { data: callsData, error: callsError });
      } else {
        console.log('No employees found, skipping call outcomes fetch');
      }

      if (callsError) {
        console.error('Calls error:', callsError);
        setCalls([]);
      } else {
        setCalls(callsData || []);
      }

      // Fetch call outcomes
      let callOutcomesData = [];
      let callOutcomesError = null;
      
      if (formattedEmployees.length > 0) {
        const employeeIds = formattedEmployees.map(emp => emp.id);
        console.log('Manager Dashboard - Fetching call outcomes for employee ids:', employeeIds);
        const { data, error } = await supabase
          .from('call_outcomes')
          .select('*')
          .in('employee_id', employeeIds)
          .eq('company_id', userRole.company_id);
        callOutcomesData = data;
        callOutcomesError = error;
        console.log('Manager Dashboard - Call outcomes fetch result:', { data: callOutcomesData, error: callOutcomesError });
      }

      if (callOutcomesError) {
        console.error('Call outcomes error:', callOutcomesError);
        setCallOutcomes([]);
      } else {
        setCallOutcomes(callOutcomesData || []);
      }

      // Fetch analyses for recordings made by employees under this manager
      let analysesData = [];
      let analysesError = null;
      
      if (employeesData && employeesData.length > 0) {
        const employeeUserIds = employeesData.map(emp => emp.user_id);
        console.log('Manager Dashboard - Fetching analyses for employee user IDs:', employeeUserIds);
        const { data, error } = await supabase
          .from('analyses')
          .select(`*, recordings ( id, file_name, stored_file_url, status, call_history_id )`)
          .in('user_id', employeeUserIds);
        analysesData = data;
        analysesError = error;

        // Enrich analyses with call_history (and nested lead/employee info) by separate fetch
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

            analysesData = (analysesData as any[]).map((a: any) => ({
              ...a,
              recordings: {
                ...a.recordings,
                call_history: a.recordings?.call_history_id ? callHistoryMap[a.recordings.call_history_id] : undefined,
              }
            }));
          }
        }
        console.log('Manager Dashboard - Analyses fetch result:', { data: analysesData, error: analysesError });
      } else {
        console.log('Manager Dashboard - No employees found, skipping analyses fetch');
      }

      if (analysesError) {
        console.error('Analyses error:', analysesError);
        setAnalyses([]);
      } else {
        setAnalyses(analysesData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      console.log('Creating employee with new method (not Supabase Auth)');
      const demoUserId = crypto.randomUUID();
      
      // Get manager's table ID
      const { data: managerData, error: managerError } = await supabase
        .from('managers')
        .select('id')
        .eq('user_id', userRole.user_id)
        .eq('company_id', userRole.company_id)
        .single();

      if (managerError) throw managerError;

      // Create employee in employees table
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: demoUserId,
          company_id: userRole.company_id,
          manager_id: managerData.id,
          full_name: newEmployee.fullName,
        email: newEmployee.email,
          phone: newEmployee.phone || null,
        password: newEmployee.password,
          is_active: true,
      });

      if (employeeError) throw employeeError;

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: demoUserId,
          company_id: userRole.company_id,
          role: 'employee',
          manager_id: userRole.user_id,
          is_active: true,
        });

      if (roleError) throw roleError;

      // Store credentials to show to user
      setCreatedEmployeeCredentials({
        email: newEmployee.email,
        password: newEmployee.password,
        fullName: newEmployee.fullName
      });

      // Reset form and close modal
      setNewEmployee({
        email: "",
        password: "",
        fullName: "",
        phone: "",
      });
      setIsAddEmployeeModalOpen(false);
      setIsCredentialsModalOpen(true);
      fetchData();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create employee. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      // Determine assignment logic
      let assignedUserId = null;
      let assignedTo = null;

      if (newLead.groupId && newLead.groupId !== 'none') {
        // If group is selected, inherit assignment from group's existing leads
        const groupLeads = leads.filter(lead => lead.group_id === newLead.groupId);
        if (groupLeads.length > 0 && groupLeads[0].assigned_to) {
          assignedUserId = groupLeads[0].user_id;
          assignedTo = groupLeads[0].assigned_to;
        }
      } else {
        // Direct employee assignment
        if (newLead.assignedTo && newLead.assignedTo !== 'unassigned') {
          assignedUserId = newLead.assignedTo;
          assignedTo = newLead.assignedTo;
        }
      }

      const { error } = await supabase
        .from('leads')
        .insert({
          user_id: assignedUserId || userRole.user_id,
          company_id: userRole.company_id,
          name: newLead.name,
          email: newLead.email,
          contact: newLead.contact,
          description: newLead.description || null,
          assigned_to: assignedTo,
          group_id: newLead.groupId && newLead.groupId !== 'none' ? newLead.groupId : null,
          status: assignedTo ? 'assigned' : 'unassigned',
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
        company: "",
        description: "",
        assignedTo: "",
        groupId: "",
      });
      setIsAddLeadModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Lead Group Handlers
  const handleAddLeadGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      const { error } = await supabase
        .from('lead_groups')
        .insert({
          company_id: userRole.company_id,
          group_name: newLeadGroup.groupName,
          description: newLeadGroup.description || null,
          assigned_to: userRole.user_id, // Assign to current manager
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead group created successfully!',
      });

      // Reset form and close modal
      setNewLeadGroup({
        groupName: "",
        description: "",
      });
      setIsAddLeadGroupModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating lead group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lead group. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewLeadGroup = (group: any) => {
    setSelectedLeadGroup(group);
    setIsViewingGroupPage(true);
  };

  const handleAssignEntireGroupToEmployee = async (groupId: string, employeeUserId: string) => {
    try {
      // Get all leads in this group
      const groupLeads = leads.filter(lead => lead.group_id === groupId);
      
      if (groupLeads.length === 0) {
        toast({
          title: 'No Leads',
          description: 'This group has no leads to assign.',
          variant: 'destructive',
        });
        return;
      }

      // Update all leads in the group to be assigned to the employee
      const { error } = await supabase
        .from('leads')
        .update({ 
          assigned_to: employeeUserId,
          user_id: employeeUserId,
          status: 'assigned'
        })
        .eq('group_id', groupId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Assigned ${groupLeads.length} lead${groupLeads.length > 1 ? 's' : ''} to employee successfully!`,
      });

      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error assigning group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign group. Please try again.',
        variant: 'destructive',
      });
    }
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

      const parsedLeads: any[] = [];
      const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

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

      if (csvGroupOption === 'new' && csvNewGroupName.trim()) {
        const { data: newGroup, error: groupError } = await supabase
          .from('lead_groups')
          .insert({
            company_id: userRole.company_id,
            group_name: csvNewGroupName.trim(),
            assigned_to: user?.id,
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

      let assignedUserId = null;
      let leadStatus = 'unassigned';

      if (csvAssignedTo && csvAssignedTo !== 'unassigned') {
        assignedUserId = csvAssignedTo;
        leadStatus = 'assigned';
      }

      const leadsToInsert = csvLeads.map(lead => ({
        name: lead.name,
        email: lead.email,
        contact: lead.contact,
        description: lead.description || null,
        assigned_to: assignedUserId,
        user_id: user?.id,
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

      setCsvFile(null);
      setCsvLeads([]);
      setCsvGroupOption('none');
      setCsvSelectedGroupId('');
      setCsvNewGroupName('');
      setCsvAssignedTo('unassigned');
      setIsUploadCSVModalOpen(false);
      fetchData();
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

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete employee "${employeeName}"?\n\nThis action will permanently remove the employee from the database.`
    );
    
    if (!confirmed) return;

    try {
      // Delete the employee record permanently
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('user_id', employeeId);

      if (error) throw error;

      // Also delete the user_role if it exists
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', employeeId);

      toast({
        title: 'Success',
        description: 'Employee deleted successfully!',
      });

      // Optimized: Remove deleted employee from state instead of refetching everything
      setEmployees(prev => prev.filter(e => e.user_id !== employeeId));
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete employee. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter leads to show only those assigned to this manager
  // Check both user_id (creator), assigned_to (assigned manager), and assigned to manager's employees
  const employeeUserIds = employees.map(emp => emp.user_id);
  const employeeIds = employees.map(emp => emp.id);
  const leads = allLeads?.filter(lead => 
    lead.user_id === user?.id || 
    lead.assigned_to === manager?.id ||
    employeeIds.includes(lead.assigned_to || '') ||
    employeeUserIds.includes(lead.assigned_to || '')
  ) || [];

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditLeadModalOpen(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingLead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: editingLead.name,
          email: editingLead.email,
          contact: editingLead.contact,
          description: editingLead.description,
          assigned_to: editingLead.assigned_to === "unassigned" ? null : editingLead.assigned_to,
        })
        .eq('id', editingLead.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead updated successfully!',
      });

      setEditingLead(null);
      setIsEditLeadModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
    }
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
        .eq('id', leadToDelete.id || leadToDelete);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead deleted successfully!',
      });

      setIsDeleteLeadModalOpen(false);
      setLeadToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAssignLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setEditingLead(lead);
      setIsAssignLeadModalOpen(true);
    }
  };

  const confirmBulkAssignEmployee = async () => {
    if (!bulkAssignEmployeeId) {
      toast({
        title: "Error",
        description: "Please select an employee to assign leads to.",
        variant: "destructive",
      });
      return;
    }

    try {
      const leadIdsArray = Array.from(selectedLeadIds);
      
      // Update all selected leads with the employee ID
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: bulkAssignEmployeeId })
        .in('id', leadIdsArray);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${leadIdsArray.length} lead(s) assigned to employee successfully.`,
      });

      // Clear selection and close modal
      setSelectedLeadIds(new Set());
      setBulkAssignEmployeeId('');
      setIsBulkAssignEmployeeModalOpen(false);

      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Error assigning leads:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign leads to employee.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [type]: true }));
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [type]: false }));
      }, 2000);
      
      toast({
        title: 'Copied!',
        description: `${type === 'email' ? 'Email' : 'Password'} copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = () => {
    setIsSignOutDialogOpen(true);
  };

  const confirmSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      setIsSignOutDialogOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
      setIsSignOutDialogOpen(false);
    }
  };

  // Filter analyses
  const filteredAnalyses = analyses.filter(analysis => {
    const leadName = analysis.recordings?.call_history?.leads?.name?.toLowerCase() || '';
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/logo.png" 
              alt="Tasknova" 
              className="h-12 w-auto cursor-pointer hover:scale-110 transition-transform"
              onError={(e) => {
                e.currentTarget.src = "/logo2.png";
              }}
            />
            <div className="border-l-2 border-green-500/30 pl-4">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  Manager Dashboard
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-none font-semibold px-2.5 py-0.5 text-xs shadow-md">
                    <UserCog className="h-3 w-3 mr-1" />
                    MANAGER
                  </Badge>
                </h1>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="text-lg">👋</span>
                  <span className="font-semibold text-foreground">{manager?.full_name || 'Manager'}</span>
                </span>
                <span className="text-green-500">•</span>
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-medium">{company?.name}</span>
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2 font-medium border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card p-6">
          <nav className="space-y-2">
            <Button 
              variant={selectedTab === "overview" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("overview")}
            >
              <TrendingUp className="h-4 w-4" />
              Overview
            </Button>
            <Button 
              variant={selectedTab === "employees" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("employees")}
            >
              <Users className="h-4 w-4" />
              Employees
            </Button>
            <Button 
              variant={selectedTab === "productivity" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("productivity")}
            >
              <BarChart3 className="h-4 w-4" />
              Employee Productivity
            </Button>
            <Button 
              variant={selectedTab === "leads" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("leads")}
            >
              <Phone className="h-4 w-4" />
              Leads
            </Button>
            {company?.industry?.toLowerCase() === 'hr' && (
              <>
                <Button 
                  variant={selectedTab === "clients" ? "accent" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setSelectedTab("clients")}
                >
                  <Building className="h-4 w-4" />
                  Clients
                </Button>
                <Button 
                  variant={selectedTab === "jobs" ? "accent" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setSelectedTab("jobs")}
                >
                  <Briefcase className="h-4 w-4" />
                  Jobs
                </Button>
              </>
            )}
            <Button 
              variant={selectedTab === "call-history" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("call-history")}
            >
              <History className="h-4 w-4" />
              Call History
            </Button>
            <Button 
              variant={selectedTab === "analysis" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("analysis")}
            >
              <BarChart3 className="h-4 w-4" />
              Analysis
            </Button>
            <Button 
              variant={selectedTab === "reports" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("reports")}
            >
              <FileText className="h-4 w-4" />
              Reports
            </Button>
            <Button 
              variant={selectedTab === "profile" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("profile")}
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="productivity">Employee Productivity</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="call-history">Call History</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              {/* Date Range Filter */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <Label className="font-semibold">Time Period:</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant={dateRangeFilter === 'today' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRangeFilter('today')}
                      >
                        Today
                      </Button>
                      <Button 
                        variant={dateRangeFilter === 'yesterday' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRangeFilter('yesterday')}
                      >
                        Yesterday
                      </Button>
                      <Button 
                        variant={dateRangeFilter === 'week' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRangeFilter('week')}
                      >
                        This Week
                      </Button>
                      <Button 
                        variant={dateRangeFilter === 'month' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRangeFilter('month')}
                      >
                        This Month
                      </Button>
                      <Button 
                        variant={dateRangeFilter === 'custom' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRangeFilter('custom')}
                      >
                        Custom Range
                      </Button>
                    </div>
                    {dateRangeFilter === 'custom' && (
                      <div className="flex items-center gap-2">
                        <Input 
                          type="date" 
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-40"
                        />
                        <span>to</span>
                        <Input 
                          type="date" 
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-40"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Total Jobs */}
                <Card className="bg-blue-100">
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold">
                      {jobs.length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Total Jobs</p>
                  </CardContent>
                </Card>

                {/* High Closure Probability Candidates */}
                <Card className="bg-green-100">
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold">
                      {dateFilteredAnalyses.filter(a => (a.closure_probability || 0) >= 85).length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">High Closure (85%+)</p>
                  </CardContent>
                </Card>

                {/* High-Risk Candidates */}
                <Card className="bg-orange-100">
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold">
                      {dateFilteredAnalyses.filter(a => {
                        const risk = parseFloat(a.candidate_acceptance_risk) || 0;
                        return risk >= 40;
                      }).length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {company?.industry?.toLowerCase() === 'hr' ? 'High-Risk (40%+)' : 'High-Risk (40%+)'}
                    </p>
                  </CardContent>
                </Card>

                {/* Team Performance */}
                <Card className="bg-purple-100">
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold">
                      {analyses.length > 0
                        ? (analyses.reduce((sum, a) => sum + (a.recruiter_process_score || 0), 0) / analyses.length).toFixed(1)
                        : '0.0'}/10
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Team Performance</p>
                  </CardContent>
                </Card>

                {/* Missed Calls */}
                <Card className="bg-red-100">
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold">
                      {dateFilteredCallOutcomes.filter(c => c.outcome === 'no_answer').length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Missed Calls</p>
                  </CardContent>
                </Card>

                {/* Alerts & Actions */}
                <Card className="bg-yellow-100">
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold">
                      {dateFilteredAnalyses.filter(a => (a.closure_probability || 0) < 40).length + 
                       dateFilteredAnalyses.filter(a => {
                         const risk = a.candidate_acceptance_risk?.toLowerCase() || '';
                         return risk.includes('high') || risk.includes('critical');
                       }).length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Alerts & Actions</p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Client Overview Chart - Conversions by Day */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{company?.industry?.toLowerCase() === 'hr' ? 'Client Conversions' : 'Lead Conversions'}</CardTitle>
                      <CardDescription>Weekly conversion frequency by client</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={(() => {
                              // Get conversions grouped by day of week (weekdays only) for each client
                              const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                              const dataByDay = [];
                              
                              // Initialize weekdays with 0 conversions for each client
                              weekdayNames.forEach((day, index) => {
                                const dayData: any = { day };
                                
                                // For each client, count conversions on this day
                                assignedClients.forEach(client => {
                                  const clientLeadIds = allLeads?.filter(l => l.client_id === client.id).map(l => l.id) || [];
                                  const conversionsCount = dateFilteredCalls.filter(call => {
                                    if (call.outcome !== 'converted') return false;
                                    if (!clientLeadIds.includes(call.lead_id)) return false;
                                    
                                    const date = new Date(call.created_at);
                                    const dayOfWeek = date.getUTCDay();
                                    
                                    // Only include this weekday (index + 1 because Monday is day 1)
                                    return dayOfWeek === index + 1;
                                  }).length;
                                  
                                  dayData[client.name] = conversionsCount;
                                });
                                
                                dataByDay.push(dayData);
                              });
                              
                              return dataByDay;
                            })()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="day" 
                              label={{ value: 'Day of Week', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis 
                              label={{ value: 'Conversions', angle: -90, position: 'insideLeft' }}
                              allowDecimals={false}
                            />
                            <ChartTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 border rounded shadow-lg">
                                      <p className="font-medium mb-2">{payload[0].payload.day}</p>
                                      {payload.map((entry: any, index: number) => (
                                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                                          {entry.name}: {entry.value} conversion{entry.value !== 1 ? 's' : ''}
                                        </p>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            {assignedClients.map((client, index) => {
                              // Assign colors: orange for first client (TCS), green for second (Wipro), etc.
                              const colors = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444'];
                              const color = colors[index % colors.length];
                              
                              return (
                                <Line 
                                  key={client.id}
                                  type="monotone" 
                                  dataKey={client.name}
                                  stroke={color}
                                  strokeWidth={2}
                                  dot={{ fill: color, r: 6 }}
                                  activeDot={{ r: 8 }}
                                />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
                        {assignedClients.map((client, index) => {
                          const colors = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444'];
                          const color = colors[index % colors.length];
                          
                          return (
                            <div key={client.id} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                              <span className="text-sm">{client.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Candidate Status */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Candidate Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold">{new Set(dateFilteredCalls.map(c => c.lead_id)).size}</div>
                          <p className="text-sm text-muted-foreground mt-2">Total Candidates</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-gray-400">--</div>
                          <p className="text-sm text-muted-foreground mt-2">Converted</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-gray-400">--</div>
                          <p className="text-sm text-muted-foreground mt-2">Pending</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-gray-400">--</div>
                          <p className="text-sm text-muted-foreground mt-2">Rejected</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Calls Tracking */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Calls Tracking</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold">{dateFilteredCalls.length}</div>
                          <p className="text-sm text-muted-foreground mt-2">Total Calls</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-green-600">
                            {dateFilteredCalls.filter(c => c.outcome === 'completed').length}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">Contacted</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-blue-600">
                            {dateFilteredCalls.filter(c => c.outcome === 'no-answer').length}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">Follow-Ups</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-red-600">
                            {dateFilteredCalls.filter(c => c.outcome === 'Failed').length}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">Failed</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-orange-600">
                            {dateFilteredCalls.filter(c => c.outcome === 'busy').length}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">Busy</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Performance - Full Width */}
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2 font-medium">Team Member</th>
                            <th className="text-right py-2 px-2 font-medium">Total Calls</th>
                            <th className="text-right py-2 px-2 font-medium">Contacted</th>
                            <th className="text-right py-2 px-2 font-medium">Not Answered</th>
                            <th className="text-right py-2 px-2 font-medium">Failed</th>
                            <th className="text-right py-2 px-2 font-medium">Busy</th>
                            <th className="text-right py-2 px-2 font-medium">Total Duration</th>
                            <th className="text-right py-2 px-2 font-medium">Avg. Talk Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.filter(emp => emp.user_id !== userRole?.user_id).map((emp) => {
                            const empCalls = dateFilteredCalls.filter(c => c.employee_id === emp.user_id);
                            const contactedCalls = empCalls.filter(c => c.outcome === 'completed');
                            const notAnsweredCalls = empCalls.filter(c => c.outcome === 'no-answer');
                            const failedCalls = empCalls.filter(c => c.outcome === 'Failed');
                            const busyCalls = empCalls.filter(c => c.outcome === 'busy');
                            
                            // Calculate total duration (in seconds) using exotel_duration, excluding calls below 45 seconds
                            const validCalls = empCalls.filter(call => (call.exotel_duration || 0) >= 45);
                            const totalDuration = validCalls.reduce((sum, call) => sum + (call.exotel_duration || 0), 0);
                            // Format as HH:MM:SS
                            const hours = Math.floor(totalDuration / 3600);
                            const minutes = Math.floor((totalDuration % 3600) / 60);
                            const seconds = totalDuration % 60;
                            const formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                            
                            // Calculate average talk time (in seconds) only for calls >= 45 seconds
                            const avgTalkTime = validCalls.length > 0 ? Math.round(totalDuration / validCalls.length) : 0;
                            const avgMinutes = Math.floor(avgTalkTime / 60);
                            const avgSeconds = avgTalkTime % 60;
                            const formattedAvgTime = `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;
                            
                            return (
                              <tr key={emp.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-2">{emp.full_name}</td>
                                <td className="text-right py-3 px-2">{empCalls.length}</td>
                                <td className="text-right py-3 px-2 text-green-600">{contactedCalls.length}</td>
                                <td className="text-right py-3 px-2 text-blue-600">{notAnsweredCalls.length}</td>
                                <td className="text-right py-3 px-2 text-red-600">{failedCalls.length}</td>
                                <td className="text-right py-3 px-2 text-orange-600">{busyCalls.length}</td>
                                <td className="text-right py-3 px-2 font-medium">{formattedDuration}</td>
                                <td className="text-right py-3 px-2 font-medium">{formattedAvgTime}</td>
                              </tr>
                            );
                          })}
                          {employees.length > 0 && (() => {
                            const totalCalls = dateFilteredCalls.length;
                            const totalContacted = dateFilteredCalls.filter(c => c.outcome === 'completed').length;
                            const totalNotAnswered = dateFilteredCalls.filter(c => c.outcome === 'no-answer').length;
                            const totalFailed = dateFilteredCalls.filter(c => c.outcome === 'Failed').length;
                            const totalBusy = dateFilteredCalls.filter(c => c.outcome === 'busy').length;
                            
                            // Calculate total duration across all employees using exotel_duration, excluding calls below 45 seconds
                            const grandValidCalls = dateFilteredCalls.filter(call => (call.exotel_duration || 0) >= 45);
                            const grandTotalDuration = grandValidCalls.reduce((sum, call) => sum + (call.exotel_duration || 0), 0);
                            const grandHours = Math.floor(grandTotalDuration / 3600);
                            const grandMinutes = Math.floor((grandTotalDuration % 3600) / 60);
                            const grandSeconds = grandTotalDuration % 60;
                            const grandFormattedDuration = `${grandHours}:${grandMinutes.toString().padStart(2, '0')}:${grandSeconds.toString().padStart(2, '0')}`;
                            
                            // Calculate average talk time across all calls >= 45 seconds
                            const grandAvgTalkTime = grandValidCalls.length > 0 ? Math.round(grandTotalDuration / grandValidCalls.length) : 0;
                            const grandAvgMinutes = Math.floor(grandAvgTalkTime / 60);
                            const grandAvgSeconds = grandAvgTalkTime % 60;
                            const grandFormattedAvgTime = `${grandAvgMinutes}:${grandAvgSeconds.toString().padStart(2, '0')}`;
                            
                            return (
                              <tr className="border-t-2 font-bold bg-muted/30">
                                <td className="py-3 px-2">Total</td>
                                <td className="text-right py-3 px-2">{totalCalls}</td>
                                <td className="text-right py-3 px-2 text-green-600">{totalContacted}</td>
                                <td className="text-right py-3 px-2 text-blue-600">{totalNotAnswered}</td>
                                <td className="text-right py-3 px-2 text-red-600">{totalFailed}</td>
                                <td className="text-right py-3 px-2 text-orange-600">{totalBusy}</td>
                                <td className="text-right py-3 px-2">{grandFormattedDuration}</td>
                                <td className="text-right py-3 px-2">{grandFormattedAvgTime}</td>
                              </tr>
                            );
                          })()}
                          {employees.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                No team members found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="employees" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Employee Management</h2>
                  <p className="text-muted-foreground">Manage your team members</p>
                </div>
                <Button onClick={() => setIsAddEmployeeModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Team ({employees.length})</CardTitle>
                      <CardDescription>
                        Employees under your management
                      </CardDescription>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {employees.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No employees found</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setIsAddEmployeeModalOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add First Employee
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employees
                        .filter(employee => 
                          employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{employee.full_name}</h4>
                              <p className="text-sm text-muted-foreground">{employee.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Employee</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setEditingEmployee(employee);
                                setIsEditEmployeeModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteEmployee(employee.user_id, employee.full_name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {employees.filter(employee => 
                        employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length === 0 && searchTerm && (
                        <div className="text-center py-8">
                          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No employees found matching "{searchTerm}"</p>
                          <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Lead Management</h2>
                  <p className="text-muted-foreground">Manage and assign leads to your team</p>
                </div>
                <div className="flex gap-2">
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
              <Card>
                <CardHeader>
                  <CardTitle>All Leads ({leads.length})</CardTitle>
                  <CardDescription>
                    Leads assigned to your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search leads..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {selectedLeadIds.size > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">
                            {selectedLeadIds.size} selected
                          </Badge>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsBulkAssignEmployeeModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign to Employee
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLeadIds(new Set())}
                          >
                            Clear Selection
                          </Button>
                        </div>
                      )}
                    </div>
                    {company?.industry?.toLowerCase() === 'hr' && (
                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          value={selectedClientFilter}
                          onValueChange={setSelectedClientFilter}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by Client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Clients</SelectItem>
                            {Array.from(new Set(leads.filter(l => l.clients).map(l => l.clients?.id))).map((clientId) => {
                              const client = leads.find(l => l.clients?.id === clientId)?.clients;
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
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by Job" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Jobs</SelectItem>
                            {Array.from(new Set(leads.filter(l => l.jobs).map(l => l.jobs?.id))).map((jobId) => {
                              const job = leads.find(l => l.jobs?.id === jobId)?.jobs;
                              return job ? (
                                <SelectItem key={jobId} value={jobId}>
                                  {job.title}
                                </SelectItem>
                              ) : null;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
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
                            {employee.full_name || employee.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {leads.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No leads found</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setIsAddLeadModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Lead
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox
                          id="select-all"
                          checked={selectedLeadIds.size === leads.length && leads.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLeadIds(new Set(leads.map(l => l.id)));
                            } else {
                              setSelectedLeadIds(new Set());
                            }
                          }}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                          Select All
                        </label>
                      </div>
                      {leads
                        .filter(lead => {
                          const matchesSearch = 
                            lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lead.contact.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesClient = selectedClientFilter === 'all' || lead.client_id === selectedClientFilter;
                          const matchesJob = selectedJobFilter === 'all' || lead.job_id === selectedJobFilter;
                          const matchesEmployee = selectedEmployeeFilter === 'all' ||
                            (selectedEmployeeFilter === 'unassigned' && !lead.assigned_to) ||
                            lead.assigned_to === selectedEmployeeFilter ||
                            employees.find(emp => emp.id === selectedEmployeeFilter)?.user_id === lead.assigned_to;
                          return matchesSearch && matchesClient && matchesJob && matchesEmployee;
                        })
                        .map((lead) => {
                          const assignedEmployee = employees.find(emp => emp.user_id === lead.assigned_to || emp.id === lead.assigned_to);
                          const isAssigned = !!assignedEmployee;
                          
                          return (
                            <div 
                              key={lead.id} 
                              className={`flex items-center justify-between p-4 border rounded-lg ${
                                isAssigned 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-orange-50 border-orange-200'
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <Checkbox
                                  checked={selectedLeadIds.has(lead.id)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedLeadIds);
                                    if (checked) {
                                      newSet.add(lead.id);
                                    } else {
                                      newSet.delete(lead.id);
                                    }
                                    setSelectedLeadIds(newSet);
                                  }}
                                />
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isAssigned 
                                    ? 'bg-green-100' 
                                    : 'bg-orange-100'
                                }`}>
                                  <Phone className={`h-5 w-5 ${
                                    isAssigned 
                                      ? 'text-green-500' 
                                      : 'text-orange-500'
                                  }`} />
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
                                  {isAssigned ? (
                                    <p className="text-xs text-green-600 font-medium">✓ Assigned to: {assignedEmployee.full_name}</p>
                                  ) : (
                                    <p className="text-xs text-orange-600 font-medium">⚠ Unassigned</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={isAssigned ? "default" : "secondary"}
                                  className={isAssigned ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                                >
                                  {isAssigned ? "Assigned" : "Unassigned"}
                                </Badge>
                                {!isAssigned && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleAssignLead(lead.id)}
                                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                                  >
                                    Assign
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditLead(lead)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteLead(lead)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
                </TabsContent>

                {/* Lead Groups Section */}
                <TabsContent value="groups" className="space-y-6">
                  {isViewingGroupPage && selectedLeadGroup ? (
                    // Full Page View for Lead Group
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Button variant="ghost" onClick={() => setIsViewingGroupPage(false)} className="mb-2">
                            ← Back to Groups
                          </Button>
                          <h2 className="text-2xl font-bold">{selectedLeadGroup.group_name}</h2>
                          <p className="text-muted-foreground">Manage and assign leads in this group</p>
                        </div>
                      </div>

                      {/* Group Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {leads.filter(lead => lead.group_id === selectedLeadGroup.id).length}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                            <Users className="h-4 w-4 text-green-600" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                              {leads.filter(lead => lead.group_id === selectedLeadGroup.id && lead.assigned_to).length}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                              {leads.filter(lead => lead.group_id === selectedLeadGroup.id && !lead.assigned_to).length}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Created</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm font-medium">
                              {new Date(selectedLeadGroup.created_at).toLocaleDateString()}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Assign Entire Group */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Assign Entire Group</CardTitle>
                          <CardDescription>Assign all leads in this group to a single employee</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <Select
                              onValueChange={(value) => {
                                if (value && value !== 'select') {
                                  handleAssignEntireGroupToEmployee(selectedLeadGroup.id, value);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select an employee" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="select" disabled>Choose employee...</SelectItem>
                                {employees.map((employee) => (
                                  <SelectItem key={employee.user_id} value={employee.user_id}>
                                    {employee.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Leads List */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Leads in This Group</CardTitle>
                          <CardDescription>View and manage individual lead assignments</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {leads.filter(lead => lead.group_id === selectedLeadGroup.id).length === 0 ? (
                            <div className="text-center py-8">
                              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No leads in this group</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {leads.filter(lead => lead.group_id === selectedLeadGroup.id).map((lead) => {
                                const assignedEmployee = employees.find(emp => emp.user_id === lead.assigned_to || emp.id === lead.assigned_to);
                                
                                return (
                                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4 flex-1">
                                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Phone className="h-5 w-5 text-blue-500" />
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-medium">{lead.name}</h4>
                                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                                        <p className="text-sm text-muted-foreground">{lead.contact}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {assignedEmployee ? (
                                        <Badge variant="secondary">
                                          Assigned to: {assignedEmployee.full_name}
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-orange-600">
                                          Unassigned
                                        </Badge>
                                      )}
                                      <Select
                                        value={lead.assigned_to || ""}
                                        onValueChange={async (value) => {
                                          try {
                                            const { error } = await supabase
                                              .from('leads')
                                              .update({ 
                                                assigned_to: value,
                                                user_id: value,
                                                status: 'assigned' 
                                              })
                                              .eq('id', lead.id);

                                            if (error) throw error;

                                            toast({
                                              title: 'Success',
                                              description: 'Lead assigned successfully!',
                                            });

                                            fetchData();
                                          } catch (error: any) {
                                            toast({
                                              title: 'Error',
                                              description: error.message,
                                              variant: 'destructive',
                                            });
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="w-48">
                                          <SelectValue placeholder="Assign to..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {employees.map((employee) => (
                                            <SelectItem key={employee.user_id} value={employee.user_id}>
                                              {employee.full_name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    // List View of Groups
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Lead Groups
                            </CardTitle>
                            <CardDescription>
                              Create and manage lead groups for your team
                            </CardDescription>
                          </div>
                          <Button onClick={() => setIsAddLeadGroupModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Lead Group
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {leadGroups.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-2">No lead groups yet</p>
                            <p className="text-sm text-muted-foreground">Create your first lead group to organize your leads</p>
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
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleViewLeadGroup(group)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View & Assign
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>


            <TabsContent value="call-history" className="space-y-6">
              <CallHistoryManager 
                companyId={userRole?.company_id || ''} 
                managerId={manager?.id} 
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Call Analysis</h2>
                <p className="text-muted-foreground">View all call analyses from your team.</p>
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
                        <option key={employee.id} value={employee.user_id}>
                          {employee.full_name}
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
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <ManagerReportsPage />
            </TabsContent>

            {(() => {
              console.log('ManagerDashboard - company:', company);
              console.log('ManagerDashboard - manager:', manager);
              console.log('ManagerDashboard - manager?.id:', manager?.id);
              console.log('ManagerDashboard - company?.industry:', company?.industry);
              return null;
            })()}

            {company?.industry?.toLowerCase() === 'hr' && (
              <>
                <TabsContent value="clients" className="space-y-6">
                  <ClientsPage managerId={manager?.id} />
                </TabsContent>

                <TabsContent value="jobs" className="space-y-6">
                  <JobsPage managerId={manager?.id} />
                </TabsContent>

                <TabsContent value="productivity" className="space-y-6">
                  <EmployeeProductivityPage managerId={manager?.id} />
                </TabsContent>
              </>
            )}

            <TabsContent value="profile" className="space-y-6">
              <ManagerProfilePage onBack={() => setSelectedTab("overview")} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Add Employee Modal */}
      <Dialog open={isAddEmployeeModalOpen} onOpenChange={setIsAddEmployeeModalOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Create a new employee under your management.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={newEmployee.fullName}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
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
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddEmployeeModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!newEmployee.fullName || !newEmployee.email || !newEmployee.password}>
                      Create Employee
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

      {/* Add Lead Modal */}
      <AddLeadModal 
        isOpen={isAddLeadModalOpen} 
        onClose={() => {
          setIsAddLeadModalOpen(false);
          // React Query will auto-refresh via cache invalidation
        }}
        managerId={manager?.id} // Pass manager ID to filter clients
      />

      {/* Add Lead Group Modal */}
      <Dialog open={isAddLeadGroupModalOpen} onOpenChange={setIsAddLeadGroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead Group</DialogTitle>
            <DialogDescription>
              Create a new lead group to organize your leads.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLeadGroup} className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={newLeadGroup.groupName}
                onChange={(e) => setNewLeadGroup(prev => ({ ...prev, groupName: e.target.value }))}
                placeholder="Enter group name"
                required
              />
            </div>
            <div>
              <Label htmlFor="groupDescription">Description</Label>
              <Textarea
                id="groupDescription"
                value={newLeadGroup.description}
                onChange={(e) => setNewLeadGroup(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter group description (optional)"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddLeadGroupModalOpen(false);
                setNewLeadGroup({ groupName: "", description: "" });
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newLeadGroup.groupName}>
                Create Group
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal 
          lead={editingLead}
          isOpen={isEditLeadModalOpen} 
          onClose={() => {
            setIsEditLeadModalOpen(false);
            setEditingLead(null);
          }}
          managerId={manager?.id} // Pass manager ID to filter clients
        />
      )}

      {/* Assign Lead Modal */}
      <Dialog open={isAssignLeadModalOpen} onOpenChange={setIsAssignLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Lead</DialogTitle>
            <DialogDescription>
              Assign this lead to an employee.
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{editingLead.name}</h4>
                <p className="text-sm text-muted-foreground">{editingLead.email}</p>
                <p className="text-sm text-muted-foreground">{editingLead.contact}</p>
              </div>
              <div>
                <Label htmlFor="assignTo">Assign to Employee</Label>
                <Select 
                  value={editingLead.assigned_to || "unassigned"} 
                  onValueChange={(value) => setEditingLead(prev => prev ? { ...prev, assigned_to: value === "unassigned" ? null : value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No assignment</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.user_id} value={employee.user_id}>
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAssignLeadModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (!editingLead) return;
                    try {
                      const { error } = await supabase
                        .from('leads')
                        .update({
                          assigned_to: editingLead.assigned_to === "unassigned" ? null : editingLead.assigned_to,
                        })
                        .eq('id', editingLead.id);

                      if (error) throw error;

                      toast({
                        title: 'Success',
                        description: 'Lead assigned successfully!',
                      });

                      setEditingLead(null);
                      setIsAssignLeadModalOpen(false);
                      fetchData();
                    } catch (error: any) {
                      console.error('Error assigning lead:', error);
                      toast({
                        title: 'Error',
                        description: error.message || 'Failed to assign lead. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Assign Lead
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Assign to Employee Modal */}
      <Dialog open={isBulkAssignEmployeeModalOpen} onOpenChange={setIsBulkAssignEmployeeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Leads to Employee</DialogTitle>
            <DialogDescription>
              Assign {selectedLeadIds.size} selected lead(s) to an employee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkAssignEmployee">Select Employee</Label>
              <Select 
                value={bulkAssignEmployeeId} 
                onValueChange={setBulkAssignEmployeeId}
              >
                <SelectTrigger id="bulkAssignEmployee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name || employee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsBulkAssignEmployeeModalOpen(false);
                  setBulkAssignEmployeeId('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={confirmBulkAssignEmployee}>
                Assign Leads
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Credentials Modal */}
      <Dialog open={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Created Successfully!</DialogTitle>
            <DialogDescription>
              Here are the login credentials for the new employee. Please save these details.
            </DialogDescription>
          </DialogHeader>
          {createdEmployeeCredentials && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3">Employee Credentials</h4>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium text-green-700">Full Name:</Label>
                    <p className="text-green-800 font-medium">{createdEmployeeCredentials.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-green-700">Email:</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-green-800 font-medium flex-1">{createdEmployeeCredentials.email}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(createdEmployeeCredentials.email, 'email')}
                        className="h-8 w-8 p-0 hover:bg-green-100"
                      >
                        {copiedItems.email ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-green-700">Password:</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-green-800 font-medium font-mono bg-green-100 px-2 py-1 rounded flex-1">
                        {createdEmployeeCredentials.password}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(createdEmployeeCredentials.password, 'password')}
                        className="h-8 w-8 p-0 hover:bg-green-100"
                      >
                        {copiedItems.password ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Please share these credentials with the employee securely. 
                  They can use these to log in to their dashboard.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsCredentialsModalOpen(false)}>
                  Got it
                </Button>
              </div>
            </div>
          )}
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

      {/* View Lead Group Modal */}
      <Dialog open={isViewLeadGroupModalOpen} onOpenChange={setIsViewLeadGroupModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Lead Group: {selectedLeadGroup?.group_name}</DialogTitle>
            <DialogDescription>
              View all leads in this group and assign them to your employees
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
                <Label className="text-muted-foreground">Unassigned Leads</Label>
                <p className="font-medium text-orange-600">
                  {leads.filter(lead => lead.group_id === selectedLeadGroup?.id && !lead.assigned_to).length}
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
                  {leads.filter(lead => lead.group_id === selectedLeadGroup?.id).map((lead) => {
                    const assignedEmployee = employees.find(emp => emp.user_id === lead.assigned_to);
                    const isAssigned = !!assignedEmployee;
                    
                    return (
                      <div 
                        key={lead.id} 
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          isAssigned 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-orange-50 border-orange-200'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                          <p className="text-sm text-muted-foreground">{lead.contact}</p>
                          {isAssigned ? (
                            <p className="text-xs text-green-600 font-medium">✓ Assigned to: {assignedEmployee.full_name}</p>
                          ) : (
                            <p className="text-xs text-orange-600 font-medium">⚠ Unassigned</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            lead.status === 'converted' ? 'default' :
                            lead.status === 'assigned' ? 'secondary' :
                            lead.status === 'active' ? 'outline' : 'destructive'
                          }>
                            {lead.status}
                          </Badge>
                          {!isAssigned && employees.length > 0 && (
                            <Select
                              onValueChange={async (employeeUserId) => {
                                try {
                                  const { error } = await supabase
                                    .from('leads')
                                    .update({ 
                                      assigned_to: employeeUserId,
                                      status: 'assigned'
                                    })
                                    .eq('id', lead.id);

                                  if (error) throw error;

                                  toast({
                                    title: 'Success',
                                    description: 'Lead assigned successfully!',
                                  });

                                  fetchData(); // Refresh data
                                } catch (error: any) {
                                  console.error('Error assigning lead:', error);
                                  toast({
                                    title: 'Error',
                                    description: error.message || 'Failed to assign lead.',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Assign to..." />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map((emp) => (
                                  <SelectItem key={emp.user_id} value={emp.user_id}>
                                    {emp.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

      {/* Upload CSV Modal */}
      <Dialog open={isUploadCSVModalOpen} onOpenChange={(open) => {
        setIsUploadCSVModalOpen(open);
        if (!open) {
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
                    id="csv-upload-manager"
                    onChange={handleCSVFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('csv-upload-manager')?.click()}
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

                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <Label htmlFor="csv-assign" className="text-sm font-semibold">Assign To Employee</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      {csvGroupOption === 'new' 
                        ? 'Assign leads to an employee' 
                        : csvGroupOption === 'existing'
                        ? 'Assign these leads to an employee'
                        : 'Directly assign these leads to an employee'}
                    </p>
                    <Select value={csvAssignedTo} onValueChange={setCsvAssignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.user_id} value={emp.user_id}>
                            {emp.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
    </div>
  );
}
