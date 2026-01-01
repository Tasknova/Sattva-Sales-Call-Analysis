// Updated ManagerDashboard - Fixed data fetching and employee creation
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatNumber } from "@/lib/utils";
import { format } from "date-fns";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { ScatterChart, Scatter, BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as ChartTooltip, Legend } from "recharts";
import { 
  Users, 
  UserPlus, 
  UserCog,
  BarChart3,
  FileText,
  History,
  User,
  Upload,
  Download,
  RefreshCw,
  Phone,
  PhoneCall,
  TrendingUp, 
  Settings, 
  Plus,
  LogOut,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Eye,
  EyeOff,
  Copy,
  Check,
  Building,
  AlertTriangle,
  Briefcase,
  Filter,
  CheckCircle2
} from "lucide-react";
import { Headphones, Link as LinkIcon } from 'lucide-react';

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
  recording_id?: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  call_quality_score?: number;
  script_adherence?: number;
  compilience_expections_score?: number;
  closure_probability?: number;
  candidate_acceptance_risk?: string;
  recordings?: {
    id: string;
    file_name?: string;
    recording_url?: string;
    status?: string;
    call_history_id?: string;
    call_history?: any;
  };
}

export default function ManagerDashboard() {
  const { user, userRole, company, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
  const [selectedAnalysisStatus, setSelectedAnalysisStatus] = useState<string>('all');
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
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | 'yesterday' | 'thisWeek' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [callDateFilter, setCallDateFilter] = useState<string>('all');
  const [selectedCallDate, setSelectedCallDate] = useState<Date | undefined>(undefined);
  const [callOutcomeFilter, setCallOutcomeFilter] = useState<string>('all');
  const [callSearch, setCallSearch] = useState<string>('');
  const [callSortBy, setCallSortBy] = useState<'date' | 'duration' | 'agent'>('date');
  const [callSortOrder, setCallSortOrder] = useState<'desc' | 'asc'>('desc');
  const [callsChartEmployeeFilter, setCallsChartEmployeeFilter] = useState<string>('all');
  
  // Team Performance filters
  const [teamPerfDateFilter, setTeamPerfDateFilter] = useState<'today' | 'yesterday' | 'thisWeek' | 'week' | 'month' | 'custom'>('today');
  const [teamPerfCustomStartDate, setTeamPerfCustomStartDate] = useState<string>('');
  const [teamPerfCustomEndDate, setTeamPerfCustomEndDate] = useState<string>('');
  
  // Pagination state
  const [callHistoryPage, setCallHistoryPage] = useState(1);
  const [leadsPage, setLeadsPage] = useState(1);
  const [analysisPage, setAnalysisPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const [teamPerfEmployeeFilter, setTeamPerfEmployeeFilter] = useState<string>('all');
  const [teamPerfSortBy, setTeamPerfSortBy] = useState<'name' | 'totalCalls' | 'relevantCalls' | 'irrelevantCalls' | 'contacted' | 'notAnswered' | 'failed' | 'busy' | 'duration' | 'avgTime'>('totalCalls');
  const [teamPerfSortOrder, setTeamPerfSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCallForDetails, setSelectedCallForDetails] = useState<any>(null);
  const [isCallDetailsModalOpen, setIsCallDetailsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [createdEmployeeCredentials, setCreatedEmployeeCredentials] = useState<{email: string, password: string, fullName: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedItems, setCopiedItems] = useState<{
    email: boolean;
    password: boolean;
  }>({ email: false, password: false });
  // Reset call history page to 1 when filters change
  useEffect(() => {
    setCallHistoryPage(1);
  }, [callDateFilter, selectedEmployeeFilter, callOutcomeFilter, callSearch]);

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

  // Helper function to extract YYYY-MM-DD from any date string format
  const extractDateStr = (dateString: string): string => {
    if (!dateString) return '';
    // Handle: "2025-12-22T15:03:30" OR "2025-12-22 15:03:30+00"
    return dateString.substring(0, 10); // Just take first 10 chars: YYYY-MM-DD
  };

  // Helper function to get today's date as YYYY-MM-DD
  const getTodayStr = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to check if a date is within the selected range
  const isDateInRange = (dateString: string) => {
    if (!dateString) return false;
    
    const callDateStr = extractDateStr(dateString);
    const todayStr = getTodayStr();
    const now = new Date();
    
    // Get local date string in YYYY-MM-DD format
    const getLocalDateStr = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (dateRangeFilter) {
      case 'today':
        return callDateStr === todayStr;
      
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateStr(yesterday);
        return callDateStr === yesterdayStr;
      
      case 'thisWeek': {
        // Current week Monday to Saturday
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sun=6, Mon=0, Tue=1...
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysFromMonday);
        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5);
        const mondayStr = getLocalDateStr(monday);
        const saturdayStr = getLocalDateStr(saturday);
        return callDateStr >= mondayStr && callDateStr <= saturdayStr;
      }
      
      case 'week': {
        // Previous week Monday to Friday ONLY (compare local YYYY-MM-DD strings)
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        
        // Calculate this week's Monday at midnight
        const currentMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
        currentMonday.setDate(currentMonday.getDate() - daysFromMonday);
        currentMonday.setHours(0, 0, 0, 0);
        
        // Previous week Monday = current Monday - 7 days
        const previousMonday = new Date(currentMonday);
        previousMonday.setDate(currentMonday.getDate() - 7);
        previousMonday.setHours(0, 0, 0, 0);
        
        // Previous week Friday = previous Monday + 4 days
        const previousFriday = new Date(previousMonday);
        previousFriday.setDate(previousMonday.getDate() + 4);
        previousFriday.setHours(23, 59, 59, 999);
        
        const previousMondayStr = getLocalDateStr(previousMonday);
        const previousFridayStr = getLocalDateStr(previousFriday);
        
        // Double-check: Only Monday-Friday, explicitly exclude Saturday & Sunday
        const callDate = new Date(callDateStr + 'T12:00:00'); // Use noon to avoid timezone issues
        const callDayOfWeek = callDate.getDay(); // 0=Sun, 6=Sat
        if (callDayOfWeek === 0 || callDayOfWeek === 6) {
          return false; // Exclude weekends
        }
        
        const inRange = callDateStr >= previousMondayStr && callDateStr <= previousFridayStr;
        return inRange;
      }
      
      case 'month': {
        // First day of current month to last day of current month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = getLocalDateStr(monthStart);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthEndStr = getLocalDateStr(monthEnd);
        return callDateStr >= monthStartStr && callDateStr <= monthEndStr;
      }
      
      case 'custom':
        if (!customStartDate || !customEndDate) return true;
        return callDateStr >= customStartDate && callDateStr <= customEndDate;
      
      default:
        return true;
    }
  };

  // Filter data based on date range for overview tab
  const dateFilteredCallOutcomes = callOutcomes.filter(outcome => {
    return isDateInRange(outcome.call_date || outcome.created_at);
  });
  
  const dateFilteredCalls = calls.filter(call => {
    return isDateInRange(call.call_date || call.created_at);
  });
  
  const dateFilteredAnalyses = analyses.filter(analysis => isDateInRange(analysis.created_at));

  // Calls over last 7 days (for line chart) - Always shows last 7 days regardless of filter
  const callsLast7Days = useMemo(() => {
    const now = new Date();
    const days = [] as { date: string; count: number }[];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const count = calls.filter(c => (new Date(c.call_date || c.created_at).toISOString().split('T')[0]) === key && (callsChartEmployeeFilter === 'all' || c.employee_id === callsChartEmployeeFilter)).length;
      days.push({ date: key, count });
    }
    return days;
  }, [calls, callsChartEmployeeFilter]);

  // Recent call quality scores for selected employee
  const recentQualityScores = useMemo(() => {
    if (!callsChartEmployeeFilter || callsChartEmployeeFilter === 'all') return [] as { date: string; score: number }[];
    const arr = dateFilteredAnalyses
      .filter(a => (a.user_id || '') === callsChartEmployeeFilter && typeof a.call_quality_score !== 'undefined')
      .map(a => ({ date: (new Date(a.created_at)).toISOString().split('T')[0], score: Number(a.call_quality_score) || 0 }));
    // sort ascending by date
    arr.sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
    // return last up to 10 entries
    return arr.slice(Math.max(0, arr.length - 10));
  }, [dateFilteredAnalyses, callsChartEmployeeFilter]);

  // Calls per employee (bar chart)
  const callsPerEmployee = useMemo(() => {
    const map = new Map<string, { total: number; relevant: number }>();
    const nameMap = new Map<string, string>();
    employees.forEach(emp => { map.set(emp.user_id, { total: 0, relevant: 0 }); nameMap.set(emp.user_id, emp.full_name || emp.email || emp.user_id); });
    dateFilteredCalls.forEach(c => {
      const uid = c.employee_id;
      const entry = map.get(uid) || { total: 0, relevant: 0 };
      entry.total = (entry.total || 0) + 1;
      const duration = Number(c.exotel_duration || 0);
      if ((c.outcome || '').toLowerCase() === 'completed' && duration >= 30) {
        entry.relevant = (entry.relevant || 0) + 1;
      }
      map.set(uid, entry);
    });
    const arr = Array.from(map.entries()).map(([user_id, stats]) => ({ user_id, name: nameMap.get(user_id) || user_id, total: stats.total, relevant: stats.relevant }));
    return arr.sort((a, b) => b.total - a.total).slice(0, 10);
  }, [dateFilteredCalls, employees]);

  // Analyses status distribution (pie)
  const analysesStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { completed: 0, processing: 0, pending: 0, failed: 0 };
    dateFilteredAnalyses.forEach(a => {
      const s = (a.status || 'pending') as string;
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [dateFilteredAnalyses]);

  // Summary: total calls in selected range and how many analyses exist
  const analysesSummary = useMemo(() => {
    const totalCalls = dateFilteredCalls.length;
    const analyzed = dateFilteredAnalyses.length;
    const percent = totalCalls ? Math.round((analyzed / totalCalls) * 100) : 0;
    return { totalCalls, analyzed, percent };
  }, [dateFilteredCalls, dateFilteredAnalyses]);

  // callDateFilteredCalls: driven by `callDateFilter` control used in Call History
  const callDateFilteredCalls = useMemo(() => {
    const now = new Date();
    return calls.filter(call => {
      const callDate = new Date(call.call_date || call.created_at || '');
      if (Number.isNaN(callDate.getTime())) return false;

      // If a specific date is selected, filter by that date only
      if (selectedCallDate) {
        const selectedDateStr = format(selectedCallDate, 'yyyy-MM-dd');
        const callDateStr = format(callDate, 'yyyy-MM-dd');
        return callDateStr === selectedDateStr;
      }

      if (callDateFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        return (new Date(callDate).toISOString().split('T')[0]) === todayStr;
      } else if (callDateFilter === 'yesterday') {
        const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0];
        return (new Date(callDate).toISOString().split('T')[0]) === y;
      } else if (callDateFilter === 'week') {
        // Previous week Monday to Thursday (Mon-Thu, excluding Friday)
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const currentMonday = new Date(now);
        currentMonday.setDate(now.getDate() - daysFromMonday);
        currentMonday.setHours(0,0,0,0);
        const previousMonday = new Date(currentMonday);
        previousMonday.setDate(currentMonday.getDate() - 7);
        previousMonday.setHours(0,0,0,0);
        const previousFriday = new Date(previousMonday);
        previousFriday.setDate(previousMonday.getDate() + 4);
        previousFriday.setHours(23,59,59,999);
        const t = new Date(callDate).getTime();
        return t >= previousMonday.getTime() && t <= previousFriday.getTime();
      } else if (callDateFilter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0,0,0,0);
        // Use today as end date, not end of month
        const monthEnd = new Date(now);
        monthEnd.setHours(23,59,59,999);
        const t = new Date(callDate).getTime();
        return t >= monthStart.getTime() && t <= monthEnd.getTime();
      }
      return true;
    });
  }, [calls, callDateFilter, selectedCallDate]);

  // baseFilteredCalls: date-filtered by callDateFilter plus employee/search filters
  const baseFilteredCalls = useMemo(() => {
    let arr = callDateFilteredCalls.slice();

    if (selectedEmployeeFilter && selectedEmployeeFilter !== 'all') {
      arr = arr.filter(call => call.employee_id === selectedEmployeeFilter);
    }

    if (callSearch && callSearch.trim() !== '') {
      const q = callSearch.trim().toLowerCase();
      arr = arr.filter(call => {
        const leadName = (call.leads?.name || '').toLowerCase();
        const contact = (call.leads?.contact || '').toLowerCase();
        return leadName.includes(q) || contact.includes(q);
      });
    }

    return arr;
  }, [callDateFilteredCalls, selectedEmployeeFilter, callSearch]);

  // Helper function for team performance date filtering
  const isTeamPerfDateInRange = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    
    switch (teamPerfDateFilter) {
      case 'today':
        return dateUTC === nowUTC;
      
      case 'yesterday':
        const yesterdayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1);
        return dateUTC === yesterdayUTC;
      
      case 'thisWeek': {
        // Current week Monday to Saturday
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const mondayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday);
        const saturdayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday + 5);
        return dateUTC >= mondayUTC && dateUTC <= saturdayUTC;
      }
      
      case 'week':
        const weekAgoUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6);
        return dateUTC >= weekAgoUTC && dateUTC <= nowUTC;
      
      case 'month':
        const monthStartUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
        const monthEndUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0);
        return dateUTC >= monthStartUTC && dateUTC <= monthEndUTC;
      
      case 'custom':
        if (!teamPerfCustomStartDate || !teamPerfCustomEndDate) return true;
        const start = new Date(teamPerfCustomStartDate);
        const end = new Date(teamPerfCustomEndDate);
        const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
        return dateUTC >= startUTC && dateUTC <= endUTC;
      
      default:
        return true;
    }
  };

  // Filter calls for team performance page
  const teamPerfFilteredCalls = calls.filter(call => {
    const dateMatch = isTeamPerfDateInRange(call.call_date || call.created_at);
    const employeeMatch = teamPerfEmployeeFilter === 'all' || call.employee_id === teamPerfEmployeeFilter;
    return dateMatch && employeeMatch;
  });

  // Handler for viewing call details
  const handleViewCallDetails = (call: any) => {
    setSelectedCallForDetails(call);
    setIsCallDetailsModalOpen(true);
  };

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

      // Fetch clients assigned to this manager directly
      const { data: directClientsData, error: directClientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('assigned_to_manager', managerData.id)
        .eq('is_active', true);

      if (directClientsError) {
        console.error('Direct clients error:', directClientsError);
        setAssignedClients([]);
      } else {
        setAssignedClients(directClientsData || []);
      }

      // Fetch jobs for assigned clients
      if (directClientsData && directClientsData.length > 0) {
        const clientIds = directClientsData.map(client => client.id);
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
      
      let callsData: any[] = [];
      let callsError = null;
      
      if (formattedEmployees.length > 0) {
        const employeeUserIds = formattedEmployees.map(emp => emp.user_id);
        
        // Fetch all calls using pagination (Supabase has 1000 row limit per request)
        let allCalls: any[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('call_history')
            .select('*, leads(name, email, contact), employees(full_name, email)')
            .in('employee_id', employeeUserIds)
            .eq('company_id', userRole.company_id)
            .order('created_at', { ascending: false })
            .range(from, from + batchSize - 1);
          
          if (error) {
            callsError = error;
            break;
          }
          
          if (data && data.length > 0) {
            allCalls = [...allCalls, ...data];
            from += batchSize;
            hasMore = data.length === batchSize;
          } else {
            hasMore = false;
          }
        }
        
        callsData = allCalls;
      } else {
      }

      if (callsError) {
        console.error('Calls error:', callsError);
        setCalls([]);
      } else {
        // Deduplicate calls based on unique ID
        const uniqueCalls = callsData?.reduce((acc: any[], call: any) => {
          if (!acc.find(c => c.id === call.id)) {
            acc.push(call);
          }
          return acc;
        }, []) || [];
        
        setCalls(uniqueCalls);
      }

      // Fetch call outcomes
      let callOutcomesData = [];
      let callOutcomesError = null;
      
      if (formattedEmployees.length > 0) {
        const employeeIds = formattedEmployees.map(emp => emp.id);
        const { data, error } = await supabase
          .from('call_outcomes')
          .select('*')
          .in('employee_id', employeeIds)
          .eq('company_id', userRole.company_id);
        callOutcomesData = data;
        callOutcomesError = error;
      }

      if (callOutcomesError) {
        console.error('Call outcomes error:', callOutcomesError);
        setCallOutcomes([]);
      } else {
        setCallOutcomes(callOutcomesData || []);
      }

      // Fetch analyses for recordings made by employees under this manager
      let analysesData: any[] = [];
      let analysesError = null;
      
      if (employeesData && employeesData.length > 0) {
        const employeeUserIds = employeesData.map(emp => emp.user_id);
        
        // Fetch all analyses using pagination
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('analyses')
            .select('*')
            .in('user_id', employeeUserIds)
            .range(from, from + batchSize - 1);
          
          if (error) {
            analysesError = error;
            break;
          }
          
          if (data && data.length > 0) {
            analysesData = [...analysesData, ...data];
            from += batchSize;
            hasMore = data.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        // Enrich analyses with call_history (and nested lead/employee info) using call_id
        if (!analysesError && analysesData && analysesData.length > 0) {
          const callIds = Array.from(new Set(
            analysesData.map((a: any) => a.call_id).filter(Boolean)
          ));

          if (callIds.length > 0) {
            // Fetch call_history data in batches
            let allCallsData: any[] = [];
            const callBatchSize = 200;
            
            for (let i = 0; i < callIds.length; i += callBatchSize) {
              const batch = callIds.slice(i, i + callBatchSize);
              const { data: callsData, error: callsErr } = await supabase
                .from('call_history')
                .select('id, call_date, outcome, lead_id, employee_id, leads(name, email, contact), employees(full_name)')
                .in('id', batch as any[]);
              
              if (!callsErr && callsData) {
                allCallsData = [...allCallsData, ...callsData];
              }
            }

            const callHistoryMap = Object.fromEntries(allCallsData.map((c: any) => [c.id, c]));

            // Map call_history data to analyses
            analysesData = analysesData.map((a: any) => ({
              ...a,
              call_history: a.call_id ? callHistoryMap[a.call_id] : undefined,
            }));
          }
        }
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

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEmployee || !userRole?.company_id) return;

    try {
      // Update employee in employees table
      const { error: employeeError } = await supabase
        .from('employees')
        .update({
          full_name: editingEmployee.full_name,
          email: editingEmployee.email,
          phone: editingEmployee.phone || null,
        })
        .eq('user_id', editingEmployee.user_id)
        .eq('company_id', userRole.company_id);

      if (employeeError) throw employeeError;

      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });

      // Reset and close modal
      setEditingEmployee(null);
      setIsEditEmployeeModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update employee. Please try again.',
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

  // Export helpers for Team Performance CSV
  const formatDuration = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatAvgTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const exportTeamPerformanceCSV = () => {
    try {
      const filteredEmployees = employees.filter(emp => 
        emp.user_id !== userRole?.user_id && (teamPerfEmployeeFilter === 'all' || emp.user_id === teamPerfEmployeeFilter)
      );

      const rows = filteredEmployees.map((emp) => {
        const empCalls = teamPerfFilteredCalls.filter(c => c.employee_id === emp.user_id);
        const relevantCalls = empCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30);
        const irrelevantCalls = empCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30);
        const contactedCalls = empCalls.filter(c => c.outcome === 'completed');
        const notAnsweredCalls = empCalls.filter(c => c.outcome === 'no-answer');
        const failedCalls = empCalls.filter(c => (c.outcome || '').toLowerCase() === 'failed');
        const busyCalls = empCalls.filter(c => c.outcome === 'busy');
        const validCalls = empCalls.filter(call => (call.exotel_duration || 0) >= 45);
        const totalDuration = validCalls.reduce((sum, call) => sum + (Number(call.exotel_duration) || 0), 0);
        const avgTalkTime = validCalls.length > 0 ? Math.round(totalDuration / validCalls.length) : 0;

        return {
          Name: emp.full_name || emp.email || emp.user_id,
          TotalCalls: empCalls.length,
          RelevantCalls: relevantCalls.length,
          IrrelevantCalls: irrelevantCalls.length,
          Contacted: contactedCalls.length,
          NotAnswered: notAnsweredCalls.length,
          Failed: failedCalls.length,
          Busy: busyCalls.length,
          TotalDuration: formatDuration(totalDuration),
          AvgTalkTime: formatAvgTime(avgTalkTime),
        } as Record<string, any>;
      });

      const headers = rows.length > 0 ? Object.keys(rows[0]) : ['Name','TotalCalls','RelevantCalls','IrrelevantCalls','Contacted','NotAnswered','Failed','Busy','TotalDuration','AvgTalkTime'];
      const csvLines = [headers.join(',')];
      rows.forEach(r => {
        const line = headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',');
        csvLines.push(line);
      });

      // Add totals row when viewing all employees
      if (teamPerfEmployeeFilter === 'all') {
        const totalCalls = teamPerfFilteredCalls.length;
        const totalRelevant = teamPerfFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30).length;
        const totalIrrelevant = teamPerfFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30).length;
        const totalContacted = teamPerfFilteredCalls.filter(c => c.outcome === 'completed').length;
        const totalNotAnswered = teamPerfFilteredCalls.filter(c => c.outcome === 'no-answer').length;
        const totalFailed = teamPerfFilteredCalls.filter(c => (c.outcome || '').toLowerCase() === 'failed').length;
        const totalBusy = teamPerfFilteredCalls.filter(c => c.outcome === 'busy').length;
        const grandValidCalls = teamPerfFilteredCalls.filter(call => (call.exotel_duration || 0) >= 45);
        const grandTotalDuration = grandValidCalls.reduce((sum, call) => sum + (Number(call.exotel_duration) || 0), 0);
        const grandAvgTalkTime = grandValidCalls.length > 0 ? Math.round(grandTotalDuration / grandValidCalls.length) : 0;

        const totalsRow: Record<string, any> = {
          Name: 'TOTAL',
          TotalCalls: totalCalls,
          RelevantCalls: totalRelevant,
          IrrelevantCalls: totalIrrelevant,
          Contacted: totalContacted,
          NotAnswered: totalNotAnswered,
          Failed: totalFailed,
          Busy: totalBusy,
          TotalDuration: formatDuration(grandTotalDuration),
          AvgTalkTime: formatAvgTime(grandAvgTalkTime),
        };
        const totalsLine = headers.map(h => `"${String(totalsRow[h] ?? '').replace(/"/g, '""')}"`).join(',');
        csvLines.push(totalsLine);
      }

      const csv = csvLines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `team_performance_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export CSV failed', err);
      toast({ title: 'Error', description: 'Failed to export CSV', variant: 'destructive' });
    }
  };

  // Filter analyses
  const filteredAnalyses = analyses.filter(analysis => {
    const leadName = analysis.call_history?.leads?.name?.toLowerCase() || '';
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
    
    const matchesStatus = selectedAnalysisStatus === 'all' || analysis.status === selectedAnalysisStatus;
    return matchesSearch && matchesEmployee && matchesProbability && matchesStatus;
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
              src="/Sattva_logo.png" 
              alt="Sattva" 
              className="h-12 w-auto cursor-pointer hover:scale-110 transition-transform"
              onError={(e) => {
                e.currentTarget.src = "/Sattva_logo.png";
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
              variant={selectedTab === "team-performance" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("team-performance")}
            >
              <TrendingUp className="h-4 w-4" />
              Team Performance
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
              <TabsTrigger value="team-performance">Team Performance</TabsTrigger>
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
                        variant={dateRangeFilter === 'thisWeek' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRangeFilter('thisWeek')}
                      >
                        This Week (Mon-Fri)
                      </Button>
                      <Button 
                        variant={dateRangeFilter === 'week' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRangeFilter('week')}
                      >
                        Previous Week (Mon-Fri)
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
                      <>
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
                        <div className="text-center mt-2 text-sm font-medium">
                          Total calls: {analysesSummary.totalCalls} — Analysed: {analysesSummary.analyzed} ({analysesSummary.percent}%)
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Total Jobs */}
                <Card className="bg-blue-100">
                  <CardContent className="pt-6 text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap">
                      {formatNumber(jobs.length)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Total Jobs</p>
                  </CardContent>
                </Card>

                {/* Total Calls */}
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap">{formatNumber(dateFilteredCalls.length)}</div>
                    <p className="text-sm text-muted-foreground mt-2">Total Calls</p>
                  </CardContent>
                </Card>

                {/* Contacted */}
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 whitespace-nowrap">
                      {formatNumber(dateFilteredCalls.filter(c => c.outcome === 'completed').length)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Contacted</p>
                  </CardContent>
                </Card>

                {/* Follow-Ups */}
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 whitespace-nowrap">
                      {formatNumber(dateFilteredCalls.filter(c => c.outcome === 'no-answer').length)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Follow-Ups</p>
                  </CardContent>
                </Card>

                {/* Failed */}
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 whitespace-nowrap">
                      {formatNumber(dateFilteredCalls.filter(c => (c.outcome || '').toLowerCase() === 'failed').length)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Failed</p>
                  </CardContent>
                </Card>

                {/* Busy */}
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 whitespace-nowrap">
                      {formatNumber(dateFilteredCalls.filter(c => c.outcome === 'busy').length)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Busy</p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Call Outcomes Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Call Outcomes</CardTitle>
                      <CardDescription>Distribution of call results for your team</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Completed (Relevant)', value: dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30).length, fill: '#22c55e' },
                                { name: 'Completed (Irrelevant)', value: dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30).length, fill: '#86efac' },
                                { name: 'Busy', value: dateFilteredCalls.filter(c => c.outcome === 'busy').length, fill: '#f59e0b' },
                                { name: 'No Answer', value: dateFilteredCalls.filter(c => c.outcome === 'no-answer').length, fill: '#6366f1' },
                                { name: 'Failed', value: dateFilteredCalls.filter(c => c.outcome === 'Failed').length, fill: '#ef4444' },
                              ].filter(d => d.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={85}
                              paddingAngle={2}
                              dataKey="value"
                              label={(entry) => `${entry.value}`}
                            >
                              {[
                                { name: 'Completed (Relevant)', value: dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30).length, fill: '#22c55e' },
                                { name: 'Completed (Irrelevant)', value: dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30).length, fill: '#86efac' },
                                { name: 'Busy', value: dateFilteredCalls.filter(c => c.outcome === 'busy').length, fill: '#f59e0b' },
                                { name: 'No Answer', value: dateFilteredCalls.filter(c => c.outcome === 'no-answer').length, fill: '#6366f1' },
                                { name: 'Failed', value: dateFilteredCalls.filter(c => c.outcome === 'Failed').length, fill: '#ef4444' },
                              ].filter(d => d.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 border rounded shadow-lg">
                                      <p className="font-medium text-sm">{payload[0].name}</p>
                                      <p className="text-sm text-gray-600">Count: {payload[0].value}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-3 space-y-2 text-xs">
                        {(() => {
                          const totalCalls = dateFilteredCalls.length || 1;
                          const relevantCount = dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30).length;
                          const irrelevantCount = dateFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30).length;
                          const busyCount = dateFilteredCalls.filter(c => c.outcome === 'busy').length;
                          const noAnswerCount = dateFilteredCalls.filter(c => c.outcome === 'no-answer').length;
                          const failedCount = dateFilteredCalls.filter(c => c.outcome === 'Failed').length;
                          
                          return (
                            <>
                              {relevantCount > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                  <span className="text-gray-600">Completed - Relevant ≥30s ({relevantCount} - {Math.round((relevantCount / totalCalls) * 100)}%)</span>
                                </div>
                              )}
                              {irrelevantCount > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-green-300"></div>
                                  <span className="text-gray-600">Completed - Irrelevant &lt;30s ({irrelevantCount} - {Math.round((irrelevantCount / totalCalls) * 100)}%)</span>
                                </div>
                              )}
                              {busyCount > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                  <span className="text-gray-600">Busy ({busyCount} - {Math.round((busyCount / totalCalls) * 100)}%)</span>
                                </div>
                              )}
                              {noAnswerCount > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                  <span className="text-gray-600">No Answer ({noAnswerCount} - {Math.round((noAnswerCount / totalCalls) * 100)}%)</span>
                                </div>
                              )}
                              {failedCount > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <span className="text-gray-600">Failed ({failedCount} - {Math.round((failedCount / totalCalls) * 100)}%)</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Calls Over Time (last 7 days) */}
                  <Card>
                    <CardHeader className="flex items-center justify-between">
                        <div>
                          <CardTitle>Calls Over Time (Last 7 days)</CardTitle>
                          <CardDescription>Daily call volumes</CardDescription>
                        </div>
                        <div className="w-48">
                          <Select value={callsChartEmployeeFilter} onValueChange={setCallsChartEmployeeFilter}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Employees" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Employees</SelectItem>
                              {employees.map(emp => (
                                <SelectItem key={emp.id} value={emp.user_id}>{emp.full_name || emp.email || emp.user_id}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={callsLast7Days}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip />
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Talk Time Stats - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Average Talk Time */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Average Talk Time</CardTitle>
                        <CardDescription>Average duration per call</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-purple-600 break-words">
                            {(() => {
                              const relevantCalls = dateFilteredCalls.filter(c => (c.exotel_duration || 0) >= 30);
                              if (relevantCalls.length === 0) return '0m 0s';
                              const totalDuration = relevantCalls.reduce((sum, c) => sum + (c.exotel_duration || 0), 0);
                              const avgSeconds = Math.floor(totalDuration / relevantCalls.length);
                              const minutes = Math.floor(avgSeconds / 60);
                              const seconds = avgSeconds % 60;
                              return `${minutes}m ${seconds}s`;
                            })()}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {dateFilteredCalls.filter(c => (c.exotel_duration || 0) >= 30).length} calls ≥30s
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total Talk Time */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Total Talk Time</CardTitle>
                        <CardDescription>Combined call duration</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-blue-600 break-words">
                            {(() => {
                              const totalSeconds = dateFilteredCalls.reduce((sum, c) => sum + (c.exotel_duration || 0), 0);
                              const hours = Math.floor(totalSeconds / 3600);
                              const minutes = Math.floor((totalSeconds % 3600) / 60);
                              if (hours > 0) {
                                return `${hours}h ${minutes}m`;
                              }
                              return `${minutes}m`;
                            })()}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {dateFilteredCalls.length} total calls
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Calls Analysis */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Calls Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* High Closure Probability Candidates */}
                      <Card className="bg-green-100">
                        <CardContent className="pt-6 text-center">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap">
                            {formatNumber(dateFilteredAnalyses.filter(a => (a.closure_probability || 0) >= 85).length)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">High Closure (85%+)</p>
                        </CardContent>
                      </Card>

                      {/* High-Risk Candidates */}
                      <Card className="bg-orange-100">
                        <CardContent className="pt-6 text-center">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap">
                            {formatNumber(dateFilteredAnalyses.filter(a => {
                              const risk = parseFloat(a.candidate_acceptance_risk) || 0;
                              return risk >= 40;
                            }).length)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {company?.industry?.toLowerCase() === 'hr' ? 'High-Risk (40%+)' : 'High-Risk (40%+)'}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Call Quality Score */}
                      <Card className="bg-purple-100">
                        <CardContent className="pt-6 text-center">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap">
                            {dateFilteredAnalyses.length > 0
                              ? Math.round(dateFilteredAnalyses.reduce((sum, a) => sum + (a.call_quality_score || 0), 0) / dateFilteredAnalyses.length)
                              : 0}%
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">Call Quality Score</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Candidate Status */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Candidate Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap">{formatNumber(new Set(dateFilteredCalls.map(c => c.lead_id)).size)}</div>
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

                  {/* Top 5 Longest Calls */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 5 Longest Calls</CardTitle>
                      <CardDescription>Team calls with highest duration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(() => {
                          const sortedCalls = [...dateFilteredCalls]
                            .sort((a, b) => (b.exotel_duration || 0) - (a.exotel_duration || 0))
                            .slice(0, 5);
                          
                          if (sortedCalls.length === 0) {
                            return <div className="text-sm text-muted-foreground">No calls found for this period</div>;
                          }
                          
                          return sortedCalls.map((call, index) => {
                            const duration = call.exotel_duration || 0;
                            const minutes = Math.floor(duration / 60);
                            const seconds = duration % 60;
                            const formattedDuration = `${minutes}m ${seconds}s`;
                            
                            return (
                              <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm mr-2">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {call.leads?.name || 'Unknown Lead'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {call.employees?.full_name || 'Unknown Employee'} • {new Date(call.call_date || call.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right ml-3">
                                  <p className="font-bold text-blue-600">{formattedDuration}</p>
                                  <p className="text-xs text-gray-500 capitalize">{call.outcome || 'N/A'}</p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team-performance" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Team Performance</h2>
                  <p className="text-muted-foreground mb-6">Detailed performance metrics for all team members</p>
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={exportTeamPerformanceCSV}>
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Filters Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Time Period Filter */}
                    <div className="flex flex-wrap items-center gap-4">
                      <Label className="font-semibold min-w-[100px]">Time Period:</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant={teamPerfDateFilter === 'today' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTeamPerfDateFilter('today')}
                        >
                          Today
                        </Button>
                        <Button 
                          variant={teamPerfDateFilter === 'yesterday' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTeamPerfDateFilter('yesterday')}
                        >
                          Yesterday
                        </Button>
                        <Button 
                          variant={teamPerfDateFilter === 'thisWeek' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTeamPerfDateFilter('thisWeek')}
                        >
                          This Week
                        </Button>
                        <Button 
                          variant={teamPerfDateFilter === 'week' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTeamPerfDateFilter('week')}
                        >
                          Last 7 Days
                        </Button>
                        <Button 
                          variant={teamPerfDateFilter === 'month' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTeamPerfDateFilter('month')}
                        >
                          This Month
                        </Button>
                        <Button 
                          variant={teamPerfDateFilter === 'custom' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTeamPerfDateFilter('custom')}
                        >
                          Custom Range
                        </Button>
                      </div>
                    </div>

                    {/* Custom Date Range */}
                    {teamPerfDateFilter === 'custom' && (
                      <div className="flex flex-wrap items-center gap-4">
                        <Label className="font-semibold min-w-[100px]">Date Range:</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="date" 
                            value={teamPerfCustomStartDate}
                            onChange={(e) => setTeamPerfCustomStartDate(e.target.value)}
                            className="w-40"
                          />
                          <span>to</span>
                          <Input 
                            type="date" 
                            value={teamPerfCustomEndDate}
                            onChange={(e) => setTeamPerfCustomEndDate(e.target.value)}
                            className="w-40"
                          />
                        </div>
                      </div>
                    )}

                    {/* Employee Filter */}
                    <div className="flex flex-wrap items-center gap-4">
                      <Label className="font-semibold min-w-[100px]">Employee:</Label>
                      <Select value={teamPerfEmployeeFilter} onValueChange={setTeamPerfEmployeeFilter}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Employees</SelectItem>
                          {employees.filter(emp => emp.user_id !== userRole?.user_id).map((emp) => (
                            <SelectItem key={emp.id} value={emp.user_id}>
                              {emp.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort Options */}
                    <div className="flex flex-wrap items-center gap-4">
                      <Label className="font-semibold min-w-[100px]">Sort By:</Label>
                      <div className="flex gap-2">
                        <Select value={teamPerfSortBy} onValueChange={(value: any) => setTeamPerfSortBy(value)}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select sort field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="totalCalls">Total Calls</SelectItem>
                            <SelectItem value="relevantCalls">Relevant Calls</SelectItem>
                            <SelectItem value="irrelevantCalls">Irrelevant Calls</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="notAnswered">Not Answered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="busy">Busy</SelectItem>
                            <SelectItem value="duration">Total Duration</SelectItem>
                            <SelectItem value="avgTime">Avg. Talk Time</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={teamPerfSortOrder} onValueChange={(value: any) => setTeamPerfSortOrder(value)}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Order" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Ascending</SelectItem>
                            <SelectItem value="desc">Descending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Call metrics and statistics for your team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg shadow border bg-white">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10 bg-gray-100">
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-semibold whitespace-nowrap" title="Employee Name">Team Member</th>
                          <th className="text-right py-3 px-2 font-semibold whitespace-nowrap" title="Total calls made">Total Calls</th>
                          <th className="text-right py-3 px-2 font-semibold whitespace-nowrap" title="Calls > 30s">Relevant <span className='ml-1 text-xs bg-green-100 text-green-700 rounded px-1'>≥30s</span></th>
                          <th className="text-right py-3 px-2 font-semibold whitespace-nowrap" title="Calls < 30s">Irrelevant <span className='ml-1 text-xs bg-gray-200 text-gray-700 rounded px-1'>&lt;30s</span></th>
                          <th className="text-right py-3 px-2 font-semibold whitespace-nowrap" title="Completed calls"><span className='bg-green-100 text-green-700 rounded px-2 py-1 text-xs'>Contacted</span></th>
                          <th className="text-right py-3 px-2 font-semibold whitespace-nowrap" title="No answer"><span className='bg-blue-100 text-blue-700 rounded px-2 py-1 text-xs'>Not Answered</span></th>
                          <th className="text-right py-3 px-2 font-semibold whitespace-nowrap" title="Failed calls"><span className='bg-red-100 text-red-700 rounded px-2 py-1 text-xs'>Failed</span></th>
                          <th className="text-right py-3 px-2 font-semibold whitespace-nowrap" title="Busy calls"><span className='bg-orange-100 text-orange-700 rounded px-2 py-1 text-xs'>Busy</span></th>
                          <th className="text-right py-3 px-2 font-semibold whitespace-nowrap" title="Sum of durations (≥45s)">Total Duration</th>
                          <th className="text-right py-3 px-2 font-semibold whitespace-nowrap" title="Average talk time (≥45s)">Avg. Talk Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Filter and prepare employee data
                          const filteredEmployees = employees.filter(emp => 
                            emp.user_id !== userRole?.user_id && 
                            (teamPerfEmployeeFilter === 'all' || emp.user_id === teamPerfEmployeeFilter)
                          );

                          // Calculate metrics for each employee
                          const employeeData = filteredEmployees.map((emp) => {
                            const empCalls = teamPerfFilteredCalls.filter(c => c.employee_id === emp.user_id);
                            const relevantCalls = empCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30);
                            const irrelevantCalls = empCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30);
                            const contactedCalls = empCalls.filter(c => c.outcome === 'completed');
                            const notAnsweredCalls = empCalls.filter(c => c.outcome === 'no-answer');
                            const failedCalls = empCalls.filter(c => c.outcome === 'Failed');
                            const busyCalls = empCalls.filter(c => c.outcome === 'busy');
                            
                            const validCalls = empCalls.filter(call => (call.exotel_duration || 0) >= 45);
                            const totalDuration = validCalls.reduce((sum, call) => sum + (call.exotel_duration || 0), 0);
                            const avgTalkTime = validCalls.length > 0 ? Math.round(totalDuration / validCalls.length) : 0;

                            return {
                              emp,
                              empCalls,
                              relevantCalls,
                              irrelevantCalls,
                              contactedCalls,
                              notAnsweredCalls,
                              failedCalls,
                              busyCalls,
                              totalDuration,
                              avgTalkTime
                            };
                          });

                          // Sort employee data
                          const sortedEmployeeData = [...employeeData].sort((a, b) => {
                            let compareValue = 0;
                            switch (teamPerfSortBy) {
                              case 'name':
                                compareValue = a.emp.full_name.localeCompare(b.emp.full_name);
                                break;
                              case 'totalCalls':
                                compareValue = a.empCalls.length - b.empCalls.length;
                                break;
                              case 'relevantCalls':
                                compareValue = a.relevantCalls.length - b.relevantCalls.length;
                                break;
                              case 'irrelevantCalls':
                                compareValue = a.irrelevantCalls.length - b.irrelevantCalls.length;
                                break;
                              case 'contacted':
                                compareValue = a.contactedCalls.length - b.contactedCalls.length;
                                break;
                              case 'notAnswered':
                                compareValue = a.notAnsweredCalls.length - b.notAnsweredCalls.length;
                                break;
                              case 'failed':
                                compareValue = a.failedCalls.length - b.failedCalls.length;
                                break;
                              case 'busy':
                                compareValue = a.busyCalls.length - b.busyCalls.length;
                                break;
                              case 'duration':
                                compareValue = a.totalDuration - b.totalDuration;
                                break;
                              case 'avgTime':
                                compareValue = a.avgTalkTime - b.avgTalkTime;
                                break;
                            }
                            return teamPerfSortOrder === 'asc' ? compareValue : -compareValue;
                          });

                          return (
                            <>
                              {sortedEmployeeData.map(({ emp, empCalls, relevantCalls, irrelevantCalls, contactedCalls, notAnsweredCalls, failedCalls, busyCalls, totalDuration, avgTalkTime }, idx) => {
                                const hours = Math.floor(totalDuration / 3600);
                                const minutes = Math.floor((totalDuration % 3600) / 60);
                                const seconds = totalDuration % 60;
                                const formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                const avgMinutes = Math.floor(avgTalkTime / 60);
                                const avgSeconds = avgTalkTime % 60;
                                const formattedAvgTime = `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;
                                // Avatar initials
                                const initials = emp.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                                return (
                                  <tr key={emp.id} className={`border-b transition-colors ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
                                    <td className="py-3 px-2 flex items-center gap-2">
                                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm mr-2">{initials}</span>
                                      <span>{emp.full_name}</span>
                                    </td>
                                    <td className="text-right py-3 px-2">{empCalls.length}</td>
                                    <td className="text-right py-3 px-2"><span className="inline-block bg-green-100 text-green-700 rounded px-2 font-semibold">{relevantCalls.length}</span></td>
                                    <td className="text-right py-3 px-2"><span className="inline-block bg-gray-200 text-gray-700 rounded px-2">{irrelevantCalls.length}</span></td>
                                    <td className="text-right py-3 px-2"><span className="inline-block bg-green-100 text-green-700 rounded px-2">{contactedCalls.length}</span></td>
                                    <td className="text-right py-3 px-2"><span className="inline-block bg-blue-100 text-blue-700 rounded px-2">{notAnsweredCalls.length}</span></td>
                                    <td className="text-right py-3 px-2"><span className="inline-block bg-red-100 text-red-700 rounded px-2">{failedCalls.length}</span></td>
                                    <td className="text-right py-3 px-2"><span className="inline-block bg-orange-100 text-orange-700 rounded px-2">{busyCalls.length}</span></td>
                                    <td className="text-right py-3 px-2 font-medium">{formattedDuration}</td>
                                    <td className="text-right py-3 px-2 font-medium">{formattedAvgTime}</td>
                                  </tr>
                                );
                              })}
                              {/* Only show totals row when viewing all employees */}
                              {teamPerfEmployeeFilter === 'all' && sortedEmployeeData.length > 0 && (() => {
                          const totalCalls = teamPerfFilteredCalls.length;
                          const totalRelevant = teamPerfFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) >= 30).length;
                          const totalIrrelevant = teamPerfFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) < 30).length;
                          const totalContacted = teamPerfFilteredCalls.filter(c => c.outcome === 'completed').length;
                          const totalNotAnswered = teamPerfFilteredCalls.filter(c => c.outcome === 'no-answer').length;
                          const totalFailed = teamPerfFilteredCalls.filter(c => c.outcome === 'Failed').length;
                          const totalBusy = teamPerfFilteredCalls.filter(c => c.outcome === 'busy').length;
                          
                          // Calculate total duration across all employees using exotel_duration, excluding calls below 45 seconds
                          const grandValidCalls = teamPerfFilteredCalls.filter(call => (call.exotel_duration || 0) >= 45);
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
                              <td className="text-right py-3 px-2 text-green-600">{totalRelevant}</td>
                              <td className="text-right py-3 px-2 text-gray-500">{totalIrrelevant}</td>
                              <td className="text-right py-3 px-2 text-green-600">{totalContacted}</td>
                              <td className="text-right py-3 px-2 text-blue-600">{totalNotAnswered}</td>
                              <td className="text-right py-3 px-2 text-red-600">{totalFailed}</td>
                              <td className="text-right py-3 px-2 text-orange-600">{totalBusy}</td>
                              <td className="text-right py-3 px-2">{grandFormattedDuration}</td>
                              <td className="text-right py-3 px-2">{grandFormattedAvgTime}</td>
                            </tr>
                          );
                        })()}
                              {sortedEmployeeData.length === 0 && (
                                <tr>
                                  <td colSpan={10} className="text-center py-8 text-muted-foreground">
                                    {teamPerfEmployeeFilter === 'all' ? 'No team members found' : 'No data available for selected employee'}
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
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
                      {(() => {
                        const filteredLeads = leads.filter(lead => {
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
                        });
                        
                        // Pagination
                        const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
                        const paginatedLeads = filteredLeads.slice(
                          (leadsPage - 1) * ITEMS_PER_PAGE,
                          leadsPage * ITEMS_PER_PAGE
                        );
                        
                        return (
                          <>
                            {paginatedLeads.map((lead) => {
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
                              <div className="flex items-center space-x-4 flex-1">
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
                            
                            {/* Leads Pagination */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg mt-4">
                                <div className="text-sm text-gray-600">
                                  Showing {((leadsPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(leadsPage * ITEMS_PER_PAGE, filteredLeads.length)} of {formatNumber(filteredLeads.length)} leads
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLeadsPage(1)}
                                    disabled={leadsPage === 1}
                                  >
                                    First
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
                                    disabled={leadsPage === 1}
                                  >
                                    Previous
                                  </Button>
                                  <span className="px-3 py-1 text-sm">
                                    Page {leadsPage} of {totalPages}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLeadsPage(p => Math.min(totalPages, p + 1))}
                                    disabled={leadsPage === totalPages}
                                  >
                                    Next
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLeadsPage(totalPages)}
                                    disabled={leadsPage === totalPages}
                                  >
                                    Last
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
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
                              {new Date(selectedLeadGroup.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
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
                                  <SelectItem key={employee.id} value={employee.id}>
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
                                const assignedEmployee = employees.find(emp => emp.user_id === lead.assigned_to);
                                
                                return (
                                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4 flex-1">
                                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Phone className="h-5 w-5 text-blue-500" />
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-medium">{lead.name}</h4>
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
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold">Team Call History</h2>
                <p className="text-muted-foreground mt-1">View and manage all team member calls</p>
              </div>
              
              {/* Filters and Sorting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Select value={callDateFilter} onValueChange={(value) => {
                    setCallDateFilter(value);
                    if (value !== 'all') setSelectedCallDate(undefined);
                  }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="This Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="week">Last 7 days</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-[180px] justify-start text-left font-normal ${
                          !selectedCallDate && "text-muted-foreground"
                        }`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedCallDate ? format(selectedCallDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedCallDate}
                        onSelect={(date) => {
                          setSelectedCallDate(date);
                          if (date) setCallDateFilter('all');
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {selectedCallDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCallDate(undefined)}
                      className="h-8 px-2"
                    >
                      Clear
                    </Button>
                  )}

                  <Select value={selectedEmployeeFilter} onValueChange={setSelectedEmployeeFilter}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.user_id}>{emp.full_name || emp.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    className="w-[260px]"
                    placeholder="Search lead or phone"
                    value={callSearch}
                    onChange={(e) => setCallSearch(e.target.value)}
                  />
                  <Select value={callSortBy} onValueChange={(v) => setCallSortBy(v as any)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date-Time</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={callSortOrder} onValueChange={(v) => setCallSortOrder(v as any)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Assending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="border-b">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setCallOutcomeFilter('all')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      callOutcomeFilter === 'all'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                      All ({baseFilteredCalls.length})
                  </button>
                  <button
                    onClick={() => setCallOutcomeFilter('followup')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      callOutcomeFilter === 'followup'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Follow-up ({(() => {
                      const followUpCallIds = new Set(
                        analyses
                          .filter(a => {
                            const hasFollowUp = a.follow_up_details && 
                              a.follow_up_details.trim().length > 0 && 
                              !a.follow_up_details.toLowerCase().includes('irrelevant according to transcript');
                            return hasFollowUp && a.recordings?.call_history_id;
                          })
                          .map(a => a.recordings?.call_history_id)
                          .filter(Boolean)
                      );
                      // Include calls with follow-up details OR no-answer outcome
                      return baseFilteredCalls.filter(c => followUpCallIds.has(c.id) || c.outcome === 'no-answer').length;
                    })()})
                  </button>
                  <button
                    onClick={() => setCallOutcomeFilter('Failed')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      callOutcomeFilter === 'Failed'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Failed ({baseFilteredCalls.filter(c => c.outcome === 'Failed').length})
                  </button>
                  <button
                    onClick={() => setCallOutcomeFilter('busy')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      callOutcomeFilter === 'busy'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Busy ({baseFilteredCalls.filter(c => c.outcome === 'busy').length})
                  </button>
                  <button
                    onClick={() => setCallOutcomeFilter('relevant')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      callOutcomeFilter === 'relevant'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Relevant ({baseFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) > 30).length})
                  </button>
                  <button
                    onClick={() => setCallOutcomeFilter('irrelevant')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      callOutcomeFilter === 'irrelevant'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Irrelevant ({baseFilteredCalls.filter(c => c.outcome === 'completed' && (c.exotel_duration || 0) <= 30).length})
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Duration</TableHead>
                      <TableHead className="font-semibold">Disposition</TableHead>
                      <TableHead className="font-semibold">Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Start with baseFilteredCalls which already has date, employee, search filters applied
                      let filteredCalls = baseFilteredCalls.slice();

                      // Apply outcome filter
                      if (callOutcomeFilter !== 'all') {
                        if (callOutcomeFilter === 'followup') {
                          // Get call IDs from analyses that have valid follow-up details
                          const followUpCallIds = new Set(
                            analyses
                              .filter(a => {
                                const hasFollowUp = a.follow_up_details && 
                                  a.follow_up_details.trim().length > 0 && 
                                  !a.follow_up_details.toLowerCase().includes('irrelevant according to transcript');
                                return hasFollowUp && a.recordings?.call_history_id;
                              })
                              .map(a => a.recordings?.call_history_id)
                              .filter(Boolean)
                          );
                          // Include calls with follow-up details OR no-answer outcome
                          filteredCalls = filteredCalls.filter(call => followUpCallIds.has(call.id) || call.outcome === 'no-answer');
                        } else if (callOutcomeFilter === 'relevant') {
                          // Relevant calls are completed calls with duration > 30 seconds
                          filteredCalls = filteredCalls.filter(call => call.outcome === 'completed' && (call.exotel_duration || 0) > 30);
                        } else if (callOutcomeFilter === 'irrelevant') {
                          // Irrelevant calls are completed calls with duration <= 30 seconds
                          filteredCalls = filteredCalls.filter(call => call.outcome === 'completed' && (call.exotel_duration || 0) <= 30);
                        } else {
                          filteredCalls = filteredCalls.filter(call => call.outcome === callOutcomeFilter);
                        }
                      }

                      // Apply sorting
                      if (callSortBy === 'date') {
                        filteredCalls.sort((a: any, b: any) => {
                          const at = new Date(a.call_date || a.created_at).getTime();
                          const bt = new Date(b.call_date || b.created_at).getTime();
                          return callSortOrder === 'asc' ? at - bt : bt - at;
                        });
                      } else if (callSortBy === 'duration') {
                        filteredCalls.sort((a: any, b: any) => {
                          const ad = a.exotel_duration || 0;
                          const bd = b.exotel_duration || 0;
                          return callSortOrder === 'asc' ? ad - bd : bd - ad;
                        });
                      } else if (callSortBy === 'agent') {
                        filteredCalls.sort((a: any, b: any) => {
                          const an = (a.employees?.full_name || '').toLowerCase();
                          const bn = (b.employees?.full_name || '').toLowerCase();
                          if (an < bn) return callSortOrder === 'asc' ? -1 : 1;
                          if (an > bn) return callSortOrder === 'asc' ? 1 : -1;
                          return 0;
                        });
                      }

                      if (filteredCalls.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} className="h-32">
                              <div className="text-center">
                                <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                  {calls.length === 0 ? 'No calls made yet' : 'No calls match the selected filters'}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      // Pagination
                      const totalPages = Math.ceil(filteredCalls.length / ITEMS_PER_PAGE);
                      const paginatedCalls = filteredCalls.slice(
                        (callHistoryPage - 1) * ITEMS_PER_PAGE,
                        callHistoryPage * ITEMS_PER_PAGE
                      );

                      return paginatedCalls.map((call) => {
                        const disposition = call.outcome || 'unknown';

                        const getDispositionStyle = (outcome: string) => {
                          switch (outcome) {
                            case 'converted':
                              return 'text-green-600 bg-green-50 border-green-200';
                            case 'follow_up':
                              return 'text-orange-600 bg-orange-50 border-orange-200';
                            case 'rejected':
                              return 'text-red-600 bg-red-50 border-red-200';
                            case 'not_answered':
                              return 'text-gray-600 bg-gray-50 border-gray-200';
                            default:
                              return 'text-blue-600 bg-blue-50 border-blue-200';
                          }
                        };

                        const getDispositionLabel = (outcome: string) => {
                          switch (outcome) {
                            case 'converted':
                              return 'Converted';
                            case 'follow_up':
                              return 'Follow-up';
                            case 'rejected':
                              return 'Rejected';
                            case 'not_answered':
                              return 'Not Answered';
                            default:
                              return outcome.charAt(0).toUpperCase() + outcome.slice(1).replace('_', ' ');
                          }
                        };

                        return (
                          <TableRow key={call.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="font-medium"><b>{call.leads?.name || 'Unknown'}</b></div>
                              
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {call.leads?.contact || 'N/A'}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <div>
                                {(() => {
                                  const dateStr = call.call_date || call.created_at;
                                  if (!dateStr) return 'N/A';
                                  // Extract date: YYYY-MM-DD from timestamp
                                  const datePart = dateStr.substring(0, 10);
                                  const [year, month, day] = datePart.split('-');
                                  return `${day}-${month}-${year.substring(2)}`;
                                })()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {(() => {
                                  const dateStr = call.call_date || call.created_at;
                                  if (!dateStr) return '--';
                                  // Extract time: HH:MM from timestamp
                                  const timePart = dateStr.substring(11, 16);
                                  return timePart;
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {call.exotel_duration ? (
                                <div className="text-sm">
                                  {Math.floor(call.exotel_duration / 60)}m {call.exotel_duration % 60}s
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">--</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDispositionStyle(disposition)}`}>
                                {getDispositionLabel(disposition)}
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <div className="flex items-center justify-end gap-4">
                                <span className="text-sm">{call.employees?.full_name || 'Unknown'}</span>
                                <Button size="sm" variant="outline" className="gap-2" onClick={() => handleViewCallDetails(call)}>
                                  <Eye className="h-4 w-4" />
                                  Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </div>
              
              {/* Call History Pagination */}
              {(() => {
                // Start with baseFilteredCalls which already has date, employee, search filters applied
                let filteredCalls = baseFilteredCalls.slice();
                
                // Apply outcome filter (same logic as table)
                if (callOutcomeFilter !== 'all') {
                  if (callOutcomeFilter === 'followup') {
                    const followUpCallIds = new Set(
                      analyses.filter(a => a.follow_up_details && a.follow_up_details.trim().length > 0 && !a.follow_up_details.toLowerCase().includes('irrelevant according to transcript') && a.recordings?.call_history_id).map(a => a.recordings?.call_history_id).filter(Boolean)
                    );
                    // Include calls with follow-up details OR no-answer outcome
                    filteredCalls = filteredCalls.filter(call => followUpCallIds.has(call.id) || call.outcome === 'no-answer');
                  } else {
                    filteredCalls = filteredCalls.filter(call => call.outcome === callOutcomeFilter);
                  }
                }
                
                const totalItems = filteredCalls.length;
                const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
                
                if (totalPages <= 1) return null;
                
                return (
                  <div className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg mt-4">
                    <div className="text-sm text-gray-600">
                      Showing {((callHistoryPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(callHistoryPage * ITEMS_PER_PAGE, totalItems)} of {formatNumber(totalItems)} calls
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCallHistoryPage(1)}
                        disabled={callHistoryPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCallHistoryPage(p => Math.max(1, p - 1))}
                        disabled={callHistoryPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 px-3">
                        Page {callHistoryPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCallHistoryPage(p => Math.min(totalPages, p + 1))}
                        disabled={callHistoryPage === totalPages}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCallHistoryPage(totalPages)}
                        disabled={callHistoryPage === totalPages}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Team Call Analyses</h1>
                  <p className="text-muted-foreground mt-1">Track and analyze your team's call performance</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <strong>{filteredAnalyses.length}</strong> records found
                  </div>
                  {(() => {
                    const analyzedCount = filteredAnalyses.filter(a => a.status === 'completed').length;
                    const pendingCount = filteredAnalyses.filter(a => a.status === 'pending' || a.status === 'processing').length;
                    return (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Analyzed: <strong className="text-gray-900">{analyzedCount}</strong></span>
                        <span>Pending: <strong className="text-gray-900">{pendingCount}</strong></span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Statistics Cards */}
              {analyses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-700">Total Analyses</p>
                          <p className="text-3xl font-bold text-purple-900 mt-1">{formatNumber(analyses.length)}</p>
                        </div>
                        <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700">Avg Closure Rate</p>
                          <p className="text-3xl font-bold text-green-900 mt-1">
                            {Math.round(analyses.reduce((sum, a) => sum + (a.closure_probability || 0), 0) / analyses.length)}%
                          </p>
                        </div>
                        <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">High Closure (≥70%)</p>
                          <p className="text-3xl font-bold text-blue-900 mt-1">
                            {analyses.filter(a => (a.closure_probability || 0) >= 70).length}
                          </p>
                        </div>
                        <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filters and Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                      <option value="high">High (≥70%)</option>
                      <option value="medium">Medium (40-69%)</option>
                      <option value="low">Low (&lt;40%)</option>
                    </select>
                    {/* Status Filter */}
                    <select
                      value={selectedAnalysisStatus}
                      onChange={(e) => setSelectedAnalysisStatus(e.target.value)}
                      className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Analyses Grid */}
              <div className="space-y-4">
                {filteredAnalyses.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-500">
                          {analyses.length === 0 ? 'No analyses found' : 'No analyses match your filters'}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          {analyses.length === 0 
                            ? 'Team call analyses will appear here once available' 
                            : 'Try adjusting your search or filters'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAnalyses.slice((analysisPage - 1) * ITEMS_PER_PAGE, analysisPage * ITEMS_PER_PAGE).map((analysis) => (
                    <Card 
                      key={analysis.id} 
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => navigate(`/analysis/${analysis.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          {/* Left Section - Lead Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {analysis.call_history?.leads?.name || 'Unknown Lead'}
                              </h3>
                              <Badge 
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                <User className="h-3 w-3 mr-1" />
                                {analysis.call_history?.employees?.full_name || 'Unknown Employee'}
                              </Badge>
                            </div>

                            {/* Metrics Row */}
                            <div className="space-y-2">
                              {/* Closure Probability */}
                              {analysis.closure_probability !== null && analysis.closure_probability !== undefined && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Closure Probability</p>
                                  <div className="flex items-center gap-2">
                                    <Progress 
                                      value={analysis.closure_probability} 
                                      className="h-2 flex-1"
                                    />
                                    <span className="text-sm font-semibold text-gray-700 min-w-[45px]">
                                      {Math.round(analysis.closure_probability)}%
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Status */}
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={analysis.status === 'completed' ? 'default' : analysis.status === 'failed' ? 'destructive' : 'secondary'}
                                  className="text-xs capitalize"
                                >
                                  {analysis.status || 'pending'}
                                </Badge>
                                {analysis.status === 'completed' && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(analysis.created_at).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Section - View Button */}
                          <div className="ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/analysis/${analysis.id}`, '_blank');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Analysis
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {filteredAnalyses.length > ITEMS_PER_PAGE && (() => {
                const totalPages = Math.ceil(filteredAnalyses.length / ITEMS_PER_PAGE);
                const startIndex = (analysisPage - 1) * ITEMS_PER_PAGE + 1;
                const endIndex = Math.min(analysisPage * ITEMS_PER_PAGE, filteredAnalyses.length);
                
                return (
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Showing {startIndex} to {endIndex} of {filteredAnalyses.length} analyses
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAnalysisPage(1)}
                          disabled={analysisPage === 1}
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAnalysisPage(p => Math.max(1, p - 1))}
                          disabled={analysisPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 px-3">
                          Page {analysisPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAnalysisPage(p => Math.min(totalPages, p + 1))}
                          disabled={analysisPage === totalPages}
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAnalysisPage(totalPages)}
                          disabled={analysisPage === totalPages}
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <ManagerReportsPage />
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <ClientsPage managerId={manager?.id} />
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              <JobsPage managerId={manager?.id} />
            </TabsContent>

            <TabsContent value="productivity" className="space-y-6">
              <EmployeeProductivityPage managerId={manager?.id} />
            </TabsContent>

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

      {/* Edit Employee Dialog */}
      <Dialog open={isEditEmployeeModalOpen} onOpenChange={setIsEditEmployeeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateEmployee} className="space-y-4">
            <div>
              <Label htmlFor="editFullName">Full Name *</Label>
              <Input
                id="editFullName"
                value={editingEmployee?.full_name || ''}
                onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editingEmployee?.email || ''}
                onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, email: e.target.value } : null)}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={editingEmployee?.phone || ''}
                onChange={(e) => setEditingEmployee(prev => prev ? { ...prev, phone: e.target.value } : null)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingEmployee(null);
                  setIsEditEmployeeModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!editingEmployee?.full_name || !editingEmployee?.email}>
                Update Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

              {/* Call Details Dialog */}
              <Dialog open={isCallDetailsModalOpen} onOpenChange={setIsCallDetailsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Call Details</DialogTitle>
                    <DialogDescription>
                      Basic information about this call
                    </DialogDescription>
                  </DialogHeader>
                  {selectedCallForDetails && (
                    <div className="space-y-6">
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Candidate Details
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-[100px]">Name:</span>
                            <span className="text-sm text-gray-900">{selectedCallForDetails.leads?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-[100px]">Email:</span>
                            <span className="text-sm text-gray-900">{selectedCallForDetails.leads?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-[100px]">Contact:</span>
                            <span className="text-sm text-gray-900">{selectedCallForDetails.leads?.contact || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-purple-50">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <PhoneCall className="h-5 w-5" />
                          Call Information
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-[100px]">Date:</span>
                            <span className="text-sm text-gray-900">
                              {selectedCallForDetails.call_date 
                                ? new Date(selectedCallForDetails.call_date).toLocaleString('en-IN', { 
                                    timeZone: 'Asia/Kolkata',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })
                                : 'N/A'}
                            </span>
                          </div>
                          {selectedCallForDetails.exotel_duration && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 min-w-[100px]">Duration:</span>
                              <span className="text-sm text-gray-900">
                                {Math.floor(selectedCallForDetails.exotel_duration / 60)}m {selectedCallForDetails.exotel_duration % 60}s
                              </span>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-[100px]">Outcome:</span>
                            <Badge variant={
                              selectedCallForDetails.outcome === 'completed' ? 'default' :
                              selectedCallForDetails.outcome === 'interested' ? 'default' :
                              selectedCallForDetails.outcome === 'converted' ? 'default' :
                              selectedCallForDetails.outcome === 'not_interested' ? 'destructive' :
                              selectedCallForDetails.outcome === 'follow_up' ? 'secondary' :
                              'outline'
                            }>
                              {selectedCallForDetails.outcome?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          {selectedCallForDetails.notes && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 min-w-[100px]">Notes:</span>
                              <span className="text-sm text-gray-900">{selectedCallForDetails.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedCallForDetails.exotel_recording_url && (
                        <div className="border rounded-lg p-4 bg-orange-50">
                          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Headphones className="h-5 w-5" />
                            Recording
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">URL:</span>
                              <a 
                                href={selectedCallForDetails.exotel_recording_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                Open Recording
                                <LinkIcon className="h-3 w-3" />
                              </a>
                            </div>
                            <audio controls className="w-full mt-2">
                              <source src={selectedCallForDetails.exotel_recording_url} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        </div>
                      )}

                      {selectedCallForDetails.next_follow_up && (
                        <div className="border rounded-lg p-4 bg-yellow-50">
                          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Follow-up
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 min-w-[100px]">Date:</span>
                              <span className="text-sm text-gray-900">
                                {new Date(selectedCallForDetails.next_follow_up).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setIsCallDetailsModalOpen(false)}>
                      Close
                    </Button>
                  </div>
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
                <Button type="submit" disabled={!editingLead}>
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
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
