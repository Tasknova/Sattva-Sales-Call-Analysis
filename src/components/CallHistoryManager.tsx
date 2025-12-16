import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Phone, 
  PhoneCall, 
  Search,
  RefreshCw,
  Eye,
  BarChart3,
  Trash2,
  Loader2,
  User,
  Calendar,
  Filter,
  ChevronDown,
  Clock,
  X,
  Headphones,
  Link as LinkIcon
} from "lucide-react";

interface Call {
  id: string;
  lead_id: string;
  employee_id: string;
  company_id?: string;
  outcome: 'interested' | 'not_interested' | 'follow_up' | 'converted' | 'lost' | 'completed' | 'no_answer' | 'failed';
  notes: string;
  call_date: string;
  next_follow_up?: string;
  created_at: string;
  exotel_call_sid?: string;
  exotel_recording_url?: string;
  leads?: {
    name: string;
    email: string;
    contact: string;
  };
  employees?: {
    full_name: string;
    email: string;
    manager_id?: string;
    managers?: {
      full_name: string;
    };
  };
}

interface Analysis {
  id: string;
  recording_id: string;
  call_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sentiment_score: number;
  engagement_score: number;
  confidence_score_executive: number;
  confidence_score_person: number;
  detailed_call_analysis: any;
  created_at: string;
  recordings?: {
    id: string;
    file_name: string;
    stored_file_url: string;
  };
}

interface CallHistoryManagerProps {
  companyId: string;
  managerId?: string;
}

export default function CallHistoryManager({ companyId, managerId }: CallHistoryManagerProps) {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<Call[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [selectedOutcome, setSelectedOutcome] = useState<string>("all");
  const [selectedAnalysisStatus, setSelectedAnalysisStatus] = useState<string>("all");
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [analysisFileName, setAnalysisFileName] = useState("");
  const [isCallDetailsModalOpen, setIsCallDetailsModalOpen] = useState(false);
  const [callDetailsData, setCallDetailsData] = useState<Call | null>(null);
  const [expandedFollowUps, setExpandedFollowUps] = useState<Set<string>>(new Set());
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const WEBHOOK_URL = "https://n8nautomation.site/webhook/b1df7b1a-d5df-4b49-b310-4a7e26d76417";

  // Function to send webhook in background
  const sendWebhookInBackground = async (webhookPayload: any) => {
    try {
      console.log('🔄 Attempting webhook call...');
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        throw new Error(`HTTP error! status: ${webhookResponse.status}`);
      }

      const responseData = await webhookResponse.json();
      console.log('✅ Webhook response:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ Webhook error:', error);
      throw error;
    }
  };

  const fetchData = async () => {
    if (!userRole?.company_id) return;

    try {
      setLoading(true);

      let callsData = [];
      let callsError = null;

      if (managerId) {
        // Fetch employees under this manager first
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, user_id')
          .eq('manager_id', managerId)
          .eq('is_active', true);

        console.log('Manager ID:', managerId);
        console.log('Employees under manager:', employeesData);

        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          callsError = employeesError;
        } else if (employeesData && employeesData.length > 0) {
          // Use user_id instead of id because call_history.employee_id stores user_id
          const employeeUserIds = employeesData.map(emp => emp.user_id);
          
          console.log('Employee user_ids:', employeeUserIds);
          
          // Fetch calls from these employees
          const { data: callsResult, error: callsResultError } = await supabase
            .from('call_history')
            .select(`
              *,
              leads (
                name,
                email,
                contact
              ),
              employees (
                full_name,
                email
              )
            `)
            .in('employee_id', employeeUserIds)
            .order('created_at', { ascending: false });
          
          console.log('Calls fetched for manager:', callsResult?.length || 0, callsResult);

          if (callsResultError) {
            console.error('Calls error:', callsResultError);
            callsError = callsResultError;
          } else {
            callsData = callsResult || [];
          }
        } else {
          console.log('No employees found under this manager or employees list is empty');
          callsData = [];
        }
      } else {
        // Fallback: fetch all calls from employees in the company
        const { data: callsResult, error: callsResultError } = await supabase
          .from('call_history')
          .select(`
            *,
            leads (
              name,
              email,
              contact
            ),
            employees (
              full_name,
              email,
              manager_id,
              managers:manager_id (
                full_name
              )
            )
          `)
          .eq('company_id', userRole.company_id)
          .order('created_at', { ascending: false});

        if (callsResultError) {
          console.error('Calls error:', callsResultError);
          callsError = callsResultError;
        } else {
          callsData = callsResult || [];
        }
      }

      if (callsError) {
        console.error('Calls error:', callsError);
        setCalls([]);
      } else {
        setCalls(callsData || []);
      }

      // Fetch all employees for the company to get their user_ids for analyses query
      const { data: allEmployees, error: empError } = await supabase
        .from('employees')
        .select('user_id')
        .eq('company_id', userRole.company_id)
        .eq('is_active', true);

      const employeeUserIds = allEmployees?.map(emp => emp.user_id) || [];
      console.log('CallHistoryManager - Employee user_ids for analyses:', employeeUserIds);
      
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select(`
          *,
          recordings (
            id,
            file_name,
            recording_url,
            status,
            call_history_id
          )
        `)
        .in('user_id', employeeUserIds);

      console.log('CallHistoryManager - Fetched analyses:', analysesData?.length || 0);
      console.log('CallHistoryManager - Sample analysis:', analysesData?.[0]);

      if (analysesError) {
        console.error('Analyses error:', analysesError);
        setAnalyses([]);
      } else {
        setAnalyses(analysesData || []);
        
        // Remove calls from processing set if they now have completed/failed recordings
        if (analysesData && analysesData.length > 0) {
          setProcessingCalls(prev => {
            const newSet = new Set(prev);
            analysesData.forEach(analysis => {
              const recordingStatus = analysis.recordings?.status;
              if (analysis.recordings?.call_history_id && (recordingStatus === 'completed' || recordingStatus === 'failed')) {
                newSet.delete(analysis.recordings.call_history_id);
              }
            });
            return newSet;
          });
        }
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

  useEffect(() => {
    fetchData();
  }, [userRole?.company_id]);

  // Auto-refresh disabled - use manual Refresh button instead

  const handleViewCallDetails = (call: Call) => {
    setCallDetailsData(call);
    setIsCallDetailsModalOpen(true);
  };

  const handleViewAnalysis = (analysisId: string) => {
    window.open(`/analysis/${analysisId}`, '_blank');
  };

  const handleGetAnalysis = async (call: Call) => {
    // Check if call has a recording URL
    if (!call.exotel_recording_url || call.exotel_recording_url.trim() === '') {
      toast({
        title: 'No Recording Available',
        description: 'This call does not have a recording URL. Please ensure the call was recorded.',
        variant: 'destructive',
      });
      return;
    }

    // Immediately add to processing set to show UI feedback
    setProcessingCalls(prev => new Set(prev).add(call.id));

    try {
      const recordingUrl = call.exotel_recording_url.trim();
      const fileName = `call_${call.id}_${new Date(call.created_at).toISOString().replace(/[:.]/g, '-')}`;

      // Step 1: Check if recording already exists for this call (auto-created by trigger)
      let { data: existingRecording, error: recordingCheckError } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', call.employee_id)
        .eq('stored_file_url', recordingUrl)
        .maybeSingle();

      if (recordingCheckError) {
        console.error('Error checking for existing recording:', recordingCheckError);
      }

      let recording = existingRecording;

      // If no recording exists, create one (backward compatibility)
      if (!recording) {
        const { data: newRecording, error: recordingError } = await supabase
          .from('recordings')
          .insert({
            user_id: call.employee_id,
            company_id: call.company_id,
            stored_file_url: recordingUrl,
            file_name: fileName,
            status: 'pending',
            transcript: call.notes || '',
          })
          .select()
          .single();

        if (recordingError) throw recordingError;
        recording = newRecording;
      }

      // Step 2: Check if analysis already exists for this call
      let { data: existingAnalysis, error: analysisCheckError } = await supabase
        .from('analyses')
        .select('*')
        .eq('call_id', call.id)
        .maybeSingle();

      if (analysisCheckError) {
        console.error('Error checking for existing analysis:', analysisCheckError);
      }

      let analysis = existingAnalysis;

      // If no analysis exists, create one (backward compatibility)
      if (!analysis) {
        const { data: newAnalysis, error: analysisError } = await supabase
          .from('analyses')
          .insert({
            recording_id: recording.id,
            call_id: call.id,
            user_id: call.employee_id,
            company_id: call.company_id,
            status: 'processing',
            sentiment_score: null,
            engagement_score: null,
            confidence_score_executive: null,
            confidence_score_person: null,
            objections_handled: null,
            next_steps: null,
            improvements: null,
            call_outcome: null,
            detailed_call_analysis: null,
            short_summary: null
          })
          .select()
          .single();

        if (analysisError) {
          console.warn('Failed to create analysis record:', analysisError);
          setProcessingCalls(prev => {
            const newSet = new Set(prev);
            newSet.delete(call.id);
            return newSet;
          });
          throw analysisError;
        }
        analysis = newAnalysis;
      } else {
        // If analysis exists but isn't processing, update its status
        if (analysis.status !== 'processing') {
          const { error: updateError } = await supabase
            .from('analyses')
            .update({ status: 'processing' })
            .eq('id', analysis.id);

          if (updateError) {
            console.warn('Failed to update analysis status:', updateError);
          } else {
            analysis.status = 'processing';
          }
        }
      }

      // Immediately update the analyses state to show processing status
      if (analysis) {
        setAnalyses(prev => {
          const filtered = prev.filter(a => a.id !== analysis.id);
          return [...filtered, analysis];
        });
      }

      // Step 3: Send to webhook for analysis with accurate IDs
      const webhookPayload = {
        url: recordingUrl,
        name: fileName,
        recording_id: recording.id,
        analysis_id: analysis.id,
        user_id: call.employee_id,
        call_id: call.id,
        timestamp: new Date().toISOString(),
        source: managerId ? 'voice-axis-scan-manager-dashboard' : 'voice-axis-scan-admin-dashboard',
        url_validated: true,
        validation_method: 'auto_submission'
      };

      console.log('🚀 Sending webhook POST request to:', WEBHOOK_URL);
      console.log('📦 Webhook payload (with accurate IDs):', webhookPayload);

      sendWebhookInBackground(webhookPayload);

      toast({
        title: 'Processing Started',
        description: 'The call recording is being analyzed. This may take a few moments.',
      });
      
      // Refresh data after a short delay to get updated status
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (error: any) {
      console.error('Error submitting analysis:', error);
      
      // Remove from processing set on error
      setProcessingCalls(prev => {
        const newSet = new Set(prev);
        newSet.delete(call.id);
        return newSet;
      });
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit analysis. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleFollowUpDetails = (callId: string) => {
    setExpandedFollowUps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(callId)) {
        newSet.delete(callId);
      } else {
        newSet.add(callId);
      }
      return newSet;
    });
  };

  const handleDeleteCall = async (callId: string) => {
    if (window.confirm('Are you sure you want to delete this call?')) {
      try {
        const { error } = await supabase
          .from('call_history')
          .delete()
          .eq('id', callId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Call deleted successfully!',
        });

        fetchData();
      } catch (error: any) {
        console.error('Error deleting call:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete call. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSubmitAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCall || !recordingUrl.trim() || !analysisFileName.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide recording URL and file name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Step 1: Save the recording to the database
      const { data: recording, error: recordingError } = await supabase
        .from('recordings')
        .insert({
          user_id: selectedCall.employee_id,
          company_id: userRole?.company_id,
          stored_file_url: recordingUrl.trim(),
          file_name: analysisFileName.trim(),
          status: 'pending',
          transcript: selectedCall.notes,
        })
        .select()
        .single();

      if (recordingError) throw recordingError;

      // Step 2: Create analysis record immediately
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          recording_id: recording.id,
          call_id: selectedCall.id,
          user_id: selectedCall.employee_id,
          company_id: userRole?.company_id,
          status: 'pending',
          sentiment_score: null,
          engagement_score: null,
          confidence_score_executive: null,
          confidence_score_person: null,
          objections_handled: null,
          next_steps: null,
          improvements: null,
          call_outcome: null,
          detailed_call_analysis: null,
          short_summary: null
        })
        .select()
        .single();

      if (analysisError) {
        console.warn('Failed to create analysis record:', analysisError);
      }

      // Step 3: Send to webhook for analysis
      const webhookPayload = {
        url: recordingUrl.trim(),
        name: analysisFileName.trim(),
        recording_id: recording.id,
        analysis_id: analysis?.id || null,
        user_id: selectedCall.employee_id,
        call_id: selectedCall.id,
        timestamp: new Date().toISOString(),
        source: 'voice-axis-scan-manager-dashboard',
        url_validated: true,
        validation_method: 'manager_submission'
      };

      console.log('🚀 Sending webhook POST request to:', WEBHOOK_URL);
      console.log('📦 Webhook payload:', webhookPayload);

      sendWebhookInBackground(webhookPayload);

      toast({
        title: 'Success',
        description: 'Recording submitted for analysis!',
      });

      // Reset form and close modal
      setRecordingUrl("");
      setAnalysisFileName("");
      setSelectedCall(null);
      setIsAnalysisModalOpen(false);
      
      fetchData();
    } catch (error: any) {
      console.error('Error submitting analysis:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit analysis. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter calls based on search and filters
  const filteredCalls = calls.filter(call => {
    const matchesSearch = searchTerm === "" || 
      call.leads?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.leads?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.employees?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEmployee = selectedEmployee === "all" || call.employee_id === selectedEmployee;
    
    // Manager filter: employees.manager_id may reference either the manager's
    // `id` or their `user_id`. Try both to be robust across schema shapes.
    const selectedManagerUserId = allManagers.find(m => m.id === selectedManager)?.user_id;
    const matchesManager = selectedManager === "all" || call.employees?.manager_id === selectedManager || call.employees?.manager_id === selectedManagerUserId;
    
    // Debug logging for manager filter
    if (selectedManager !== "all" && call.employees) {
      console.log('Manager Filter Debug:', {
        selectedManager,
        callManagerId: call.employees.manager_id,
        matches: matchesManager,
        employeeName: call.employees.full_name
      });
    }
    
    // Outcome filter - exact match
    let matchesOutcome = selectedOutcome === "all";
    if (selectedOutcome !== "all") {
      matchesOutcome = call.outcome === selectedOutcome;
      
      // Debug logging for outcome filter
      if (call.id === calls[0]?.id && selectedOutcome !== "all") {
        console.log('Outcome Filter Debug (first call):', {
          selectedOutcome,
          callOutcome: call.outcome,
          matches: matchesOutcome
        });
      }
    }

    // Analysis status filter
    const analysis = analyses.find(a => a.call_id === call.id);
    let matchesAnalysisStatus = selectedAnalysisStatus === "all";
    if (selectedAnalysisStatus === "analyzed") {
      matchesAnalysisStatus = analysis && analysis.status?.toLowerCase() === 'completed';
    } else if (selectedAnalysisStatus === "not_analyzed") {
      // Only show answered calls (completed/converted) that are not analyzed
      // Exclude no-answer and Failed calls
      const isAnsweredCall = call.outcome !== 'no-answer' && call.outcome !== 'Failed';
      const hasNoCompletedAnalysis = !analysis || analysis.status?.toLowerCase() !== 'completed';
      matchesAnalysisStatus = isAnsweredCall && hasNoCompletedAnalysis;
    }

    // Date range filter
    let matchesDateRange = true;
    if (dateRange.from || dateRange.to) {
      const callDate = new Date(call.call_date);
      if (dateRange.from && dateRange.to) {
        // Both dates selected - check if call date is between them
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        matchesDateRange = callDate >= fromDate && callDate <= toDate;
      } else if (dateRange.from) {
        // Only from date selected
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        matchesDateRange = callDate >= fromDate;
      } else if (dateRange.to) {
        // Only to date selected
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        matchesDateRange = callDate <= toDate;
      }
    }

    return matchesSearch && matchesEmployee && matchesManager && matchesOutcome && matchesAnalysisStatus && matchesDateRange;
  });


  // Get all employees and managers for filters
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [allManagers, setAllManagers] = useState<any[]>([]);
  
  // Fetch all employees and managers for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      if (!userRole?.company_id) return;
      
      try {
        if (managerId) {
          // For manager view: fetch only their employees
          const { data: employeesData, error: employeesError } = await supabase
            .from('employees')
            .select('id, user_id, full_name, email, manager_id')
            .eq('manager_id', managerId)
            .eq('is_active', true);

          if (employeesError) {
            console.error('Error fetching employees:', employeesError);
          } else {
            setAllEmployees(employeesData || []);
          }
        } else {
          // For admin view: fetch all employees and managers in the company
          const { data: employeesData, error: employeesError } = await supabase
            .from('employees')
            .select('id, user_id, full_name, email, manager_id')
            .eq('company_id', userRole.company_id)
            .eq('is_active', true);

          const { data: managersData, error: managersError } = await supabase
            .from('managers')
            .select('id, user_id, full_name, email')
            .eq('company_id', userRole.company_id)
            .eq('is_active', true);

          if (employeesError) {
            console.error('Error fetching employees:', employeesError);
          } else {
            console.log('Fetched employees for filter:', employeesData);
            setAllEmployees(employeesData || []);
          }

          if (managersError) {
            console.error('Error fetching managers:', managersError);
          } else {
            console.log('Fetched managers for filter:', managersData);
            setAllManagers(managersData || []);
          }
        }
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };

    fetchFilterData();
  }, [managerId, userRole?.company_id]);

  // Build employee options for the select. Use user_id as the value because
  // `call_history.employee_id` stores the employee's user_id. Prefer showing
  // `full_name`, but fall back to `email` or `user_id` so the UI never shows a raw id.
  const allEmployeeOptions = allEmployees.map(emp => ({
    id: emp.user_id,
    name: emp.full_name || emp.email || emp.user_id,
    manager_id: emp.manager_id || null,
  }));

  // Build manager options. Some systems use `managers.id` and others reference
  // the manager's `user_id` on employees.manager_id — include both to match either.
  const managerOptions = allManagers.map(mgr => ({
    id: mgr.id,
    user_id: mgr.user_id,
    name: mgr.full_name || mgr.email || mgr.user_id,
  }));

  // When a manager is selected, show employees whose `manager_id` matches
  // either the manager's `id` or their `user_id`. This covers schema differences.
  const selectedManagerObj = managerOptions.find(m => m.id === selectedManager);

  const employeesForSelectedManager = selectedManager === 'all'
    ? []
    : allEmployeeOptions.filter(emp => emp.manager_id === selectedManager || (selectedManagerObj && emp.manager_id === selectedManagerObj.user_id));

  // Debug: Log managers for dropdown
  if (managerOptions.length > 0 && !managerId) {
    console.log('Managers for dropdown:', managerOptions);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading call history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Call History Management</h2>
          <p className="text-muted-foreground">Manage and monitor all employee calls</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Search (spans two columns on medium+) */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search calls by lead name, email, employee, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Range Filter */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.from && !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Filter by date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                  className="h-9 px-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
            {/* Employee Filter */}
            <div className="sm:col-span-1 lg:col-span-1">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                disabled={selectedManager === 'all'}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">{selectedManager === 'all' ? 'Select manager first' : 'All Employees'}</option>
                {employeesForSelectedManager.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Manager Filter - Only show for admin */}
            {!managerId && managerOptions.length > 0 && (
              <div className="sm:col-span-1 lg:col-span-1">
                <select
                  value={selectedManager}
                  onChange={(e) => { setSelectedManager(e.target.value); setSelectedEmployee('all'); }}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Managers</option>
                  {managerOptions.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Outcome Filter */}
            <div className="sm:col-span-1 lg:col-span-1">
              <select
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Outcomes</option>
                <option value="completed">Completed</option>
                <option value="no-answer">No Answer</option>
                <option value="Failed">Failed</option>
                <option value="follow_up">Follow-up</option>
                <option value="not_interested">Not Interested</option>
              </select>
            </div>

            {/* Analysis Status Filter */}
            <div className="sm:col-span-1 lg:col-span-1">
              <select
                value={selectedAnalysisStatus}
                onChange={(e) => setSelectedAnalysisStatus(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Call Types</option>
                <option value="analyzed">Analyzed</option>
                <option value="not_analyzed">Not Analyzed</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-center text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
              <strong className="mr-1">{filteredCalls.length}</strong> call{filteredCalls.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call History */}
      <Card>
        <CardHeader>
          <CardTitle>All Calls ({filteredCalls.length})</CardTitle>
          <CardDescription>
            Complete history of all employee calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCalls.length === 0 ? (
            <div className="text-center py-8">
              <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No calls found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCalls.map((call) => {
                // Find analysis for this call using call_history_id from recording
                const analysis = analyses.find(a => a.recordings?.call_history_id === call.id);
                const hasAnalysis = !!analysis;
                const recordingStatus = analysis?.recordings?.status;
                const isProcessing = processingCalls.has(call.id);
                
                return (
                  <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        call.outcome === 'no-answer' 
                          ? 'bg-red-100' 
                          : 'bg-blue-100'
                      }`}>
                        <Phone className={`h-5 w-5 ${
                          call.outcome === 'no-answer' 
                            ? 'text-red-600' 
                            : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">Call with {call.leads?.name || 'Lead'}</h4>
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {call.employees?.full_name || 'Unknown Employee'}
                          </Badge>
                          {!managerId && call.employees?.managers?.full_name && (
                            <Badge variant="secondary" className="text-xs">
                              Manager: {call.employees.managers.full_name}
                            </Badge>
                          )}
                          {call.outcome === 'no-answer' && (
                            <Badge variant="destructive" className="text-xs">Not Answered</Badge>
                          )}
                          {(call.next_follow_up || call.outcome === 'follow_up') && (
                            <Badge variant="outline" className="text-xs bg-orange-50 border-orange-300 text-orange-700">
                              <Clock className="h-3 w-3 mr-1" />
                              Follow-up Scheduled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {call.leads?.email} • {call.leads?.contact}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(call.created_at).toLocaleDateString()}
                          </p>
                          
                          {/* Follow-up Details Dropdown */}
                          {call.outcome === 'follow_up' && call.next_follow_up && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFollowUpDetails(call.id)}
                              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Follow-up Details
                              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expandedFollowUps.has(call.id) ? 'rotate-180' : ''}`} />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {isProcessing || (hasAnalysis && recordingStatus === 'processing') ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                Analyzing...
                              </Badge>
                            </div>
                          ) : hasAnalysis && recordingStatus === 'completed' ? (
                            <>
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-semibold ${
                                  (analysis?.closure_probability || 0) >= 70 ? 'bg-green-50 text-green-700 border-green-300' :
                                  (analysis?.closure_probability || 0) >= 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                                  'bg-red-50 text-red-700 border-red-300'
                                }`}
                              >
                                Closure Probability: {analysis?.closure_probability || 0}%
                              </Badge>
                            </>
                          ) : hasAnalysis && recordingStatus === 'failed' ? (
                            <Badge variant="destructive" className="text-xs">
                              Analysis Failed
                            </Badge>
                          ) : hasAnalysis && recordingStatus === 'pending' ? (
                            <Badge variant="outline" className="text-xs">
                              Ready for Analysis
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              No Analysis
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {call.outcome !== 'no_answer' && call.outcome !== 'failed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewCallDetails(call)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>
                      )}
                      {hasAnalysis && recordingStatus === 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewAnalysis(analysis.id)}
                          className="gap-1"
                        >
                          <BarChart3 className="h-4 w-4" />
                          View Analysis
                        </Button>
                      )}
                      {!isProcessing && (!hasAnalysis || recordingStatus === 'pending' || recordingStatus === 'failed') && call.outcome !== 'no_answer' && call.outcome !== 'failed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGetAnalysis(call)}
                          className="gap-1"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Get Analysis
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteCall(call.id)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                    
                    {/* Expanded Follow-up Details */}
                    {call.outcome === 'follow_up' && call.next_follow_up && expandedFollowUps.has(call.id) && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Follow-up Details
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Follow-up Date:</span>
                            <span>{new Date(call.next_follow_up).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Follow-up Time:</span>
                            <span>{new Date(call.next_follow_up).toLocaleTimeString()}</span>
                          </div>
                          {call.notes && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-blue-600 mt-1">Notes:</span>
                              <span className="text-gray-700">{call.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Modal */}
      <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Get Analysis
            </DialogTitle>
            <DialogDescription>
              Submit a recording for analysis of call with {selectedCall?.leads?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAnalysis} className="space-y-4">
            <div>
              <Label htmlFor="analysisFileName">File Name *</Label>
              <Input
                id="analysisFileName"
                value={analysisFileName}
                onChange={(e) => setAnalysisFileName(e.target.value)}
                placeholder="Enter file name for the recording"
                required
              />
            </div>
            <div>
              <Label htmlFor="recordingUrl">Recording URL *</Label>
              <Input
                id="recordingUrl"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="Enter recording URL for analysis"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAnalysisModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!recordingUrl.trim() || !analysisFileName.trim()}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Get Analysis
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
          {callDetailsData && (
            <div className="space-y-6">
              {/* Candidate Details */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Candidate Details
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">Name:</span>
                    <span className="text-sm text-gray-900">{callDetailsData.leads?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">Email:</span>
                    <span className="text-sm text-gray-900">{callDetailsData.leads?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">Contact:</span>
                    <span className="text-sm text-gray-900">{callDetailsData.leads?.contact || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Employee Details */}
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Employee Details
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">Name:</span>
                    <span className="text-sm text-gray-900">{callDetailsData.employees?.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">Email:</span>
                    <span className="text-sm text-gray-900">{callDetailsData.employees?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Call Information */}
              <div className="border rounded-lg p-4 bg-purple-50">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  Call Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">Date:</span>
                    <span className="text-sm text-gray-900">
                      {callDetailsData.call_date 
                        ? new Date(callDetailsData.call_date).toLocaleString('en-IN', { 
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
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">Outcome:</span>
                    <Badge variant={
                      callDetailsData.outcome === 'completed' ? 'default' :
                      callDetailsData.outcome === 'interested' ? 'default' :
                      callDetailsData.outcome === 'converted' ? 'default' :
                      callDetailsData.outcome === 'not_interested' ? 'destructive' :
                      callDetailsData.outcome === 'follow_up' ? 'secondary' :
                      'outline'
                    }>
                      {callDetailsData.outcome?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  {callDetailsData.notes && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-gray-600 min-w-[100px]">Notes:</span>
                      <span className="text-sm text-gray-900">{callDetailsData.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recording URL */}
              {callDetailsData.exotel_recording_url && (
                <div className="border rounded-lg p-4 bg-orange-50">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Headphones className="h-5 w-5" />
                    Recording
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">URL:</span>
                      <a 
                        href={callDetailsData.exotel_recording_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Open Recording
                        <LinkIcon className="h-3 w-3" />
                      </a>
                    </div>
                    <audio controls className="w-full mt-2">
                      <source src={callDetailsData.exotel_recording_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              )}

              {/* Follow-up Details */}
              {callDetailsData.next_follow_up && (
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Follow-up
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-gray-600 min-w-[100px]">Date:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(callDetailsData.next_follow_up).toLocaleDateString('en-IN', {
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
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsCallDetailsModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
