import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import EmployeeProfilePage from "@/components/EmployeeProfilePage";
import EmployeeReportsPage from "@/components/EmployeeReportsPage";
import PhoneDialer from "@/components/PhoneDialer";

const WEBHOOK_URL = "https://n8nautomation.site/webhook/b1df7b1a-d5df-4b49-b310-4a7e26d76417";

// Function to send webhook in background without blocking UI
const sendWebhookInBackground = async (webhookPayload: any) => {
  try {
    console.log('🔄 Attempting webhook call...');
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    console.log('✅ Webhook response status:', webhookResponse.status);
    console.log('✅ Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));
    
    if (webhookResponse.ok) {
      const responseText = await webhookResponse.text();
      console.log('✅ Webhook response body:', responseText);
      console.log('🎉 Webhook call successful!');
    } else {
      console.warn(`⚠️ Webhook returned ${webhookResponse.status}: ${webhookResponse.statusText}`);
    }
    
  } catch (corsError) {
    console.warn('❌ CORS error, trying no-cors mode:', corsError);
    
    // Second attempt: No-CORS mode
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });
      
      console.log('✅ Webhook request sent via no-cors mode');
      
    } catch (noCorsError) {
      console.error('❌ Both webhook attempts failed:', noCorsError);
      
      // Third attempt: Using XMLHttpRequest as fallback
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', WEBHOOK_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(webhookPayload));
        console.log('✅ Webhook sent via XMLHttpRequest fallback');
      } catch (xhrError) {
        console.error('❌ All webhook attempts failed:', xhrError);
      }
    }
  }
};

import { 
  Phone, 
  PhoneCall, 
  TrendingUp, 
  Settings, 
  Search,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  User,
  LogOut,
  Plus,
  BarChart3,
  Upload,
  Download,
  Eye,
  Star,
  AlertTriangle,
  Calendar,
  Check,
  Loader2,
  RefreshCw,
  Trash2,
  FileText,
  Clock,
  Users,
  Building,
  BarChart
} from "lucide-react";

const normalizePhoneNumber = (num: string | null | undefined) => {
  if (!num) return '';
  const digitsOnly = num.replace(/\D/g, '');
  return digitsOnly.replace(/^0+/, '') || digitsOnly;
};

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
  group_id?: string;
}

interface Call {
  id: string;
  lead_id: string;
  employee_id: string;
  company_id?: string;
  outcome: 'interested' | 'not_interested' | 'follow_up' | 'converted' | 'lost' | 'completed' | 'not_answered' | 'failed';
  notes: string;
  call_date: string;
  next_follow_up?: string;
  auto_call_followup?: boolean;
  call_details?: any;
  created_at: string;
  exotel_recording_url?: string;
  exotel_call_sid?: string;
  exotel_response?: any;
  exotel_duration?: number;
  exotel_start_time?: string;
  exotel_end_time?: string;
  exotel_answered_by?: string;
  leads?: {
    name: string;
    email: string;
    contact: string;
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

import EmployeeAnalysisPage from "@/pages/EmployeeAnalysisPage";
export default function EmployeeDashboard() {
  const { user, userRole, company, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  // router navigation is not required here (uses react-router elsewhere)
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [followUpLeads, setFollowUpLeads] = useState<Lead[]>([]);
  const [completedLeads, setCompletedLeads] = useState<Lead[]>([]);
  const [leadGroups, setLeadGroups] = useState<any[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [dailyProductivity, setDailyProductivity] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeadsSection, setSelectedLeadsSection] = useState<'all' | 'followup' | 'completed'>('all');
  const [leadsSection, setLeadsSection] = useState<'leads' | 'groups'>('leads');
  const [isViewingGroupPage, setIsViewingGroupPage] = useState(false);
  const [selectedLeadGroup, setSelectedLeadGroup] = useState<any>(null);
  const [completedLeadIds, setCompletedLeadIds] = useState<Set<string>>(new Set());
  const [callOutcomeFilter, setCallOutcomeFilter] = useState<string>('all');
  const [callDateFilter, setCallDateFilter] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiInsights, setAiInsights] = useState<Array<{title: string, message: string, type: 'success' | 'warning' | 'info' | 'error'}>>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [lastInsightsFetch, setLastInsightsFetch] = useState<Date | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  // Use only valid Call outcome types for status
  const [callOutcomeStatus, setCallOutcomeStatus] = useState<'failed' | 'converted' | 'follow_up' | 'not_answered'>('follow_up');
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [autoCallFollowup, setAutoCallFollowup] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isCallDetailsModalOpen, setIsCallDetailsModalOpen] = useState(false);
  const [selectedCallDetails, setSelectedCallDetails] = useState<Call | null>(null);
  const [nextFollowUpTime, setNextFollowUpTime] = useState("");
  const [analysisFileName, setAnalysisFileName] = useState("");
  
  // Exotel calling state
  const [isExotelCallModalOpen, setIsExotelCallModalOpen] = useState(false);
  const [fromNumber, setFromNumber] = useState(""); // Will be set from company settings
  const [toNumber, setToNumber] = useState("");
  const [callerId, setCallerId] = useState(""); // Will be set from company settings
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [currentCallSid, setCurrentCallSid] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const [callPollingInterval, setCallPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentCallRecordId, setCurrentCallRecordId] = useState<string | null>(null); // Track the call record ID for updating
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  // Company settings state
  const [companySettings, setCompanySettings] = useState({
    caller_id: "09513886363",
    from_numbers: ["7887766008"],
  });
  
  // Remove lead modal state
  const [isRemoveLeadModalOpen, setIsRemoveLeadModalOpen] = useState(false);
  const [selectedLeadToRemove, setSelectedLeadToRemove] = useState<Lead | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [isDialerModalOpen, setIsDialerModalOpen] = useState(false);
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userRole && company) {
      fetchData();
      fetchCompanySettings();
      // Set up automatic refresh every 10 seconds to check for analysis updates
      const dataInterval = setInterval(() => {
        fetchData(false); // Don't show loading spinner on automatic refresh
      }, 10000); // Refresh data every 10 seconds
      // Realtime subscription: refetch when leads change so assignments appear immediately
      let leadsSubscription: any = null;
      try {
        // Use Supabase Realtime to listen for changes on the leads table for this company
        leadsSubscription = supabase
          .channel('public:leads')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `company_id=eq.${userRole.company_id}` }, () => {
            fetchData(false);
          })
          .subscribe();
      } catch (err) {
        // Fallback for older supabase clients
        try {
          const sub = supabase
            .from(`leads:company_id=eq.${userRole.company_id}`)
            .on('*', () => fetchData(false))
            .subscribe();
          leadsSubscription = sub;
        } catch (e) {
          console.warn('Realtime leads subscription not available:', e);
        }
      }
      // Set up time update every second for countdown timers
      const timeInterval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000); // Update time every second
      // Clean up intervals
      return () => {
        clearInterval(dataInterval);
        clearInterval(timeInterval);
        try {
          if (leadsSubscription) {
            // Unsubscribe depending on API
            if (typeof leadsSubscription.unsubscribe === 'function') {
              leadsSubscription.unsubscribe();
            } else if (typeof supabase.removeChannel === 'function') {
              supabase.removeChannel(leadsSubscription);
            }
          }
        } catch (e) {
          console.warn('Error cleaning up leads subscription', e);
        }
      };
    }
  }, [userRole, company]);

  const fetchData = async (showLoading = true) => {
    if (!userRole?.company_id) return;

    try {
      if (showLoading) {
      setLoading(true);
      }

      // Declare leadsDataArray at function scope so it's accessible in calls processing
      let leadsDataArray: any[] = [];

      // STEP 1: First fetch all calls made by this employee from call_history table
      // Note: employee_id in call_history references employees.user_id (not employees.id)
      const { data: callsData, error: callsError } = await supabase
        .from('call_history')
        .select('*')
        .eq('employee_id', userRole.user_id)
        .order('created_at', { ascending: false });

      if (callsError) {
        console.error('Calls error:', callsError);
        setCalls([]);
        setAllLeads([]);
        setFollowUpLeads([]);
        setCompletedLeads([]);
        return;
      }

      console.log('EmployeeDashboard - Fetched calls:', callsData?.length || 0, callsData);

      // STEP 2: Get all unique lead IDs from the calls
      const calledLeadIds = [...new Set(callsData?.map(c => c.lead_id).filter(Boolean) || [])];
      console.log('EmployeeDashboard - Unique leads called:', calledLeadIds.length);

      // STEP 3: Fetch ALL leads that have been called by this employee (not just assigned)
      // Also include leads assigned to this employee so assigned leads show up immediately
      // Determine employee.table id for assigned_to comparisons
      const { data: employeeRecord } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userRole.user_id)
        .maybeSingle();

      // Build arrays of promises to fetch leads
      const leadsFetches: Array<Promise<any>> = [];

      if (calledLeadIds.length > 0) {
        leadsFetches.push(
          supabase.from('leads').select('*').in('id', calledLeadIds)
        );
      }

      // Fetch leads assigned to this user (assigned_to could be either user_id or employees.id)
      if (userRole?.user_id) {
        leadsFetches.push(
          supabase.from('leads').select('*').eq('assigned_to', userRole.user_id)
        );
      }

      if (employeeRecord?.id) {
        leadsFetches.push(
          supabase.from('leads').select('*').eq('assigned_to', employeeRecord.id)
        );
      }

      // Execute all lead fetches and merge unique results
      if (leadsFetches.length > 0) {
        const fetched = await Promise.all(leadsFetches);
        const combinedLeads: any[] = [];
        for (const res of fetched) {
          if (res && res.data) {
            combinedLeads.push(...(res.data || []));
          }
          if (res && res.error) {
            console.error('Leads fetch error:', res.error);
          }
        }

        // Deduplicate leads by id
        const unique = Object.values(Object.fromEntries(combinedLeads.map((l: any) => [l.id, l])));
        leadsDataArray = unique;

        console.log('EmployeeDashboard - Fetched leads (merged from calls & assignments):', leadsDataArray.length, leadsDataArray);

        // Fetch lead groups for these leads
        const leadGroupIds = [...new Set(leadsDataArray.map(lead => lead.group_id).filter(Boolean))];
        if (leadGroupIds.length > 0) {
          const { data: leadGroupsData, error: leadGroupsError } = await supabase
            .from('lead_groups')
            .select('*')
            .in('id', leadGroupIds);

          if (leadGroupsError) {
            console.error('Lead groups error:', leadGroupsError);
            setLeadGroups([]);
          } else {
            setLeadGroups(leadGroupsData || []);
          }
        } else {
          setLeadGroups([]);
        }
      } else {
        // No calls and no assignments
        leadsDataArray = [];
        setLeadGroups([]);
      }

      // STEP 4: Create leads map for call merging
      let leadsMap = new Map();
      leadsDataArray.forEach(lead => leadsMap.set(lead.id, lead));

      // STEP 5: Fetch call outcomes separately (for backward compatibility with old data)
      // Note: call_outcomes.employee_id references employees.id, but we have userRole.user_id (employees.user_id)
      // So we need to first get the employee.id
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userRole.user_id)
        .single();

      const { data: outcomesData, error: outcomesError } = await supabase
        .from('call_outcomes')
        .select('lead_id, outcome')
        .eq('employee_id', employeeData?.id || '');

      // STEP 6: Merge call outcomes and leads with call history
      const mergedCalls = callsData?.map(call => {
        const outcome = outcomesData?.find(o => o.lead_id === call.lead_id);
        const lead = leadsMap.get(call.lead_id);
        return {
          ...call,
          leads: lead || null, // Add lead data if available
          call_outcomes: outcome ? [{ outcome: outcome.outcome }] : []
        };
      }) || [];
      
      // Log outcome distribution for debugging
      const outcomeCounts = mergedCalls.reduce((acc, call) => {
        const outcome = call.call_outcomes?.[0]?.outcome || call.outcome || 'null';
        acc[outcome] = (acc[outcome] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('EmployeeDashboard - Call outcome distribution:', outcomeCounts);
      
      setCalls(mergedCalls);
      
      // STEP 7: Create lead entries from calls (show all calls, not just unique leads)
      // This matches the Call History page - showing 51 follow-up calls, not 36 unique leads
      if (leadsDataArray && mergedCalls) {
        // Filter out removed leads
        const activeLeadIds = new Set(
          leadsDataArray.filter(lead => lead.status !== 'removed').map(l => l.id)
        );
        
        // Create lead entries from calls (one entry per call)
        const allCallsWithLeads = mergedCalls
          .filter(call => call.lead_id && activeLeadIds.has(call.lead_id))
          .map(call => ({
            ...leadsMap.get(call.lead_id),
            call_id: call.id,
            call_created_at: call.created_at,
            call_outcome: call.outcome
          }));
        
        // Filter by outcome to show all follow-up CALLS (51), not unique leads (36)
        const followUpCallsArray = allCallsWithLeads.filter(entry => 
          entry.call_outcome === 'follow_up'
        );
        
        // Filter by outcome to show all converted CALLS
        const completedCallsArray = allCallsWithLeads.filter(entry => 
          entry.call_outcome === 'converted'
        );
        
        // For "All" tab, show unique leads (no duplicates)
        const uniqueLeadIds = new Set(allCallsWithLeads.map(e => e.id));
        const allLeadsArray = Array.from(uniqueLeadIds)
          .map(id => leadsMap.get(id))
          .filter(Boolean);
        
        console.log('EmployeeDashboard - Categorized leads by call outcomes:', {
          all: allLeadsArray.length,
          followUpCalls: followUpCallsArray.length,
          completedCalls: completedCallsArray.length
        });
        
        setAllLeads(allLeadsArray);
        setFollowUpLeads(followUpCallsArray);
        setCompletedLeads(completedCallsArray);
      }

      // Fetch analyses for recordings made by this employee
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
        .eq('user_id', userRole.user_id);

      console.log('EmployeeDashboard - Fetching analyses for user_id:', userRole.user_id);
      console.log('EmployeeDashboard - Analyses data:', analysesData);
      console.log('EmployeeDashboard - Analyses error:', analysesError);

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

      // Fetch daily productivity data for current month
      if (employeeData?.id) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { data: productivityData, error: productivityError } = await supabase
          .from('employee_daily_productivity')
          .select('*')
          .eq('employee_id', employeeData.id)
          .gte('date', startOfMonth.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (productivityError) {
          console.error('Daily productivity error:', productivityError);
          setDailyProductivity([]);
        } else {
          setDailyProductivity(productivityData || []);
          console.log('EmployeeDashboard - Daily productivity data:', productivityData);
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
      if (showLoading) {
      setLoading(false);
      }
    }
  };

  const fetchAIInsights = useCallback(async () => {
    if (!userRole?.company_id || calls.length === 0) {
      return;
    }

    setIsLoadingInsights(true);
    try {
      // Calculate performance stats
      const completedAnalyses = analyses.filter(a => a.status?.toLowerCase() === 'completed');
      const totalCalls = calls.length;
      const completedCalls = calls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length;
      const followUpCalls = calls.filter(c => c.outcome === 'follow_up').length;
      const notAnsweredCalls = calls.filter(c => c.outcome === 'not_answered').length;
      const notInterestedCalls = calls.filter(c => c.outcome === 'not_interested').length;
      
      const completionRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
      const followUpRate = totalCalls > 0 ? Math.round((followUpCalls / totalCalls) * 100) : 0;
      const notAnsweredRate = totalCalls > 0 ? Math.round((notAnsweredCalls / totalCalls) * 100) : 0;
      
      let avgSentiment = 0;
      let avgEngagement = 0;
      let avgConfidence = 0;
      
      if (completedAnalyses.length > 0) {
        avgSentiment = Math.round(completedAnalyses.reduce((sum: number, a) => sum + (parseFloat(String(a.sentiment_score)) || 0), 0) / completedAnalyses.length);
        avgEngagement = Math.round(completedAnalyses.reduce((sum: number, a) => sum + (parseFloat(String(a.engagement_score)) || 0), 0) / completedAnalyses.length);
        const avgConfidenceExec = completedAnalyses.reduce((sum: number, a) => sum + (parseFloat(String(a.confidence_score_executive)) || 0), 0) / completedAnalyses.length;
        const avgConfidencePerson = completedAnalyses.reduce((sum: number, a) => sum + (parseFloat(String(a.confidence_score_person)) || 0), 0) / completedAnalyses.length;
        avgConfidence = Math.round((avgConfidenceExec + avgConfidencePerson) / 2);
      }

      // Prepare stats data for Gemini
      const statsData = {
        totalCalls,
        completedCalls,
        followUpCalls,
        notAnsweredCalls,
        notInterestedCalls,
        completionRate,
        followUpRate,
        notAnsweredRate,
        avgSentiment,
        avgEngagement,
        avgConfidence,
        analyzedCalls: completedAnalyses.length,
        analysisRate: totalCalls > 0 ? Math.round((completedAnalyses.length / totalCalls) * 100) : 0
      };

      // System prompt for Gemini
      const systemPrompt = `You are an expert sales performance coach and data analyst. Your role is to analyze call performance statistics and provide actionable, personalized insights and improvement tips for a sales employee.

Guidelines:
1. Provide 3-4 specific, actionable insights based on the performance data
2. Each insight should have a clear title and detailed message
3. Focus on areas that need improvement, but also acknowledge strengths
4. Be constructive, encouraging, and specific in your recommendations
5. Use the performance metrics to identify patterns and opportunities
6. Format your response as a JSON array with objects containing: title, message, and type (one of: "success", "warning", "info", "error")
7. Make insights practical and implementable

Example format:
[
  {
    "title": "High Completion Rate",
    "message": "Your completion rate of 65% is excellent! This shows strong closing skills. To maintain this momentum, focus on maintaining consistent follow-up practices.",
    "type": "success"
  },
  {
    "title": "Improve Call Analysis Coverage",
    "message": "Only 40% of your calls have been analyzed. Consider analyzing more calls to get deeper insights into your communication patterns and identify areas for improvement.",
    "type": "warning"
  }
]`;

      // User prompt with stats
      const userPrompt = `Analyze the following call performance statistics and provide 3-4 actionable insights and improvement tips:

Performance Statistics:
- Total Calls: ${statsData.totalCalls}
- Completed/Converted: ${statsData.completedCalls} (${statsData.completionRate}%)
- Follow-up Required: ${statsData.followUpCalls} (${statsData.followUpRate}%)
- Not Answered: ${statsData.notAnsweredCalls} (${statsData.notAnsweredRate}%)
- Not Interested: ${statsData.notInterestedCalls}
- Analyzed Calls: ${statsData.analyzedCalls} (${statsData.analysisRate}% of total)
- Average Sentiment Score: ${statsData.avgSentiment}%
- Average Engagement Score: ${statsData.avgEngagement}%
- Average Confidence Score: ${statsData.avgConfidence}/10

Please provide insights that are specific, actionable, and tailored to these metrics.`;

      // Get Gemini API key from environment
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error('API Key check:', {
          VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY ? 'Found' : 'Not found',
          GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY ? 'Found' : 'Not found',
          allEnvKeys: Object.keys(import.meta.env).filter(key => key.includes('GEMINI') || key.includes('gemini'))
        });
        throw new Error('Gemini API key not found in environment variables. Please set VITE_GEMINI_API_KEY in your .env file.');
      }

      // Initialize Google Generative AI
      const genAI = new GoogleGenerativeAI(apiKey);

      // Try different models in order of preference
      const modelsToTry = [
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
      ];

      let lastError: any = null;
      let success = false;
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`Trying Gemini model: ${modelName}`);
          
          // Get the model
          const model = genAI.getGenerativeModel({ model: modelName });

          // Prepare the prompt
          const prompt = `${systemPrompt}\n\n${userPrompt}\n\nPlease respond with only a valid JSON array, no additional text.`;

          // Generate content
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const responseText = response.text();

          if (!responseText) {
            console.error('No text in Gemini response');
            lastError = new Error('No response text from Gemini API');
            continue; // Try next model
          }
          
          // Parse JSON from response (handle markdown code blocks if present)
          let insightsJson = responseText.trim();
          if (insightsJson.startsWith('```json')) {
            insightsJson = insightsJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          } else if (insightsJson.startsWith('```')) {
            insightsJson = insightsJson.replace(/```\n?/g, '');
          }

          let parsedInsights;
          try {
            parsedInsights = JSON.parse(insightsJson);
          } catch (parseError) {
            console.error('Failed to parse insights JSON:', insightsJson);
            lastError = new Error('Failed to parse AI insights response. Please try again.');
            continue; // Try next model
          }
          
          // Validate and set insights
          if (Array.isArray(parsedInsights) && parsedInsights.length > 0) {
            const validInsights = parsedInsights
              .filter(insight => insight.title && insight.message && insight.type)
              .slice(0, 4); // Limit to 4 insights
            setAiInsights(validInsights);
            setLastInsightsFetch(new Date());
            success = true;
            console.log(`Successfully fetched insights using ${modelName}`);
            break; // Success! Exit loop
          } else {
            lastError = new Error('Invalid insights format from API');
            continue; // Try next model
          }
        } catch (error: any) {
          console.error(`Error trying ${modelName}:`, error);
          lastError = error;
          // If it's a model not found error, try next model
          if (error.message?.includes('not found') || error.message?.includes('404')) {
            continue; // Try next model
          }
          // For other errors, we might want to retry or fail
          continue; // Try next model
        }
      }

      // If all models failed, throw the last error
      if (!success && lastError) {
        throw lastError;
      }
    } catch (error: any) {
      console.error('Error fetching AI insights:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch AI insights. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingInsights(false);
    }
  }, [userRole, calls, analyses, toast]);

  // Auto-fetch insights every 24 hours (only if insights have been fetched before)
  useEffect(() => {
    if (!userRole?.company_id || calls.length === 0 || !lastInsightsFetch) return;

    const shouldFetchInsights = () => {
      const hoursSinceLastFetch = (new Date().getTime() - lastInsightsFetch.getTime()) / (1000 * 60 * 60);
      return hoursSinceLastFetch >= 24;
    };

    // Set up interval to check every hour
    const interval = setInterval(() => {
      if (shouldFetchInsights()) {
        fetchAIInsights();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [userRole, calls.length, lastInsightsFetch, fetchAIInsights]);

  const handleStartCall = (lead: Lead) => {
    setSelectedLead(lead);
    setIsCallModalOpen(true);
  };

  const handleStartExotelCall = (lead: Lead) => {
    setSelectedLead(lead);
    setToNumber(lead.contact); // Pre-fill the lead's contact number
    setIsExotelCallModalOpen(true);
  };

  const handleMarkAsComplete = (leadId: string) => {
    setCompletedLeadIds(prev => new Set([...prev, leadId]));
    toast({
      title: 'Success',
      description: 'Lead marked as complete!',
    });
  };

  const handleViewAnalysis = (analysisId: string) => {
    // Navigate to analysis detail page
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
        .eq('user_id', userRole?.user_id)
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
            user_id: userRole?.user_id,
            company_id: userRole?.company_id,
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
            user_id: userRole?.user_id,
            company_id: userRole?.company_id,
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
        // If analysis exists but recording isn't processing, update recording status
        const recordingStatus = analysis.recordings?.status;
        if (recordingStatus !== 'processing') {
          const { error: updateError } = await supabase
            .from('recordings')
            .update({ status: 'processing' })
            .eq('id', analysis.recording_id);

          if (updateError) {
            console.warn('Failed to update recording status:', updateError);
          } else if (analysis.recordings) {
            analysis.recordings.status = 'processing';
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
        user_id: userRole?.user_id,
        call_id: call.id,
        timestamp: new Date().toISOString(),
        source: 'voice-axis-scan-employee-dashboard',
        url_validated: true,
        validation_method: 'auto_submission'
      };

      console.log('🚀 Sending webhook POST request to:', WEBHOOK_URL);
      console.log('📦 Webhook payload (with accurate IDs):', webhookPayload);

      sendWebhookInBackground(webhookPayload);

      toast({
        title: 'Processing Started',
        description: 'Your call recording is being analyzed. This may take a few moments.',
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

  const handleDeleteCall = async (callId: string) => {
    if (window.confirm('Are you sure you want to delete this call? This will also delete any related analysis records.')) {
      try {
        // Delete the call record - related analysis records will be automatically deleted due to CASCADE
        const { error } = await supabase
          .from('call_outcomes')
          .delete()
          .eq('id', callId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Call and related analysis deleted successfully!',
        });

        fetchData(true); // Show loading after user action
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

  const handleDeleteFollowUp = async (leadId: string) => {
    if (window.confirm('Are you sure you want to delete this follow-up? This will remove the follow-up call record and the lead will return to the "All Leads" section.')) {
      try {
        // Find the follow-up call record for this lead
        // Look for calls that have next_follow_up set (indicating it's a follow-up call)
        const followUpCall = calls.find(call => 
          call.lead_id === leadId && 
          call.next_follow_up
        );

        if (!followUpCall) {
          // If no call record found, just update the lead status to 'active'
          console.log('No follow-up call record found, updating lead status only');
          
          const { error: leadError } = await supabase
            .from('leads')
            .update({ status: 'active' })
            .eq('id', leadId);

          if (leadError) throw leadError;

          toast({
            title: 'Follow-up Deleted',
            description: 'Follow-up has been removed successfully. The lead will return to "All Leads".',
          });

          // Refresh data
          fetchData(true);
          return;
        }

        // Delete the follow-up call record from call_history table
        const { error: historyError } = await supabase
          .from('call_history')
          .delete()
          .eq('id', followUpCall.id);

        if (historyError) throw historyError;

        // Also delete from call_outcomes table for backward compatibility
        const { error: outcomeError } = await supabase
          .from('call_outcomes')
          .delete()
          .eq('id', followUpCall.id);

        if (outcomeError) {
          console.warn('Warning: Failed to delete from call_outcomes table:', outcomeError);
          // Don't throw error here as call_history is the primary storage
        }

        // Update the lead status to 'active' so it returns to All Leads
        const { error: leadError } = await supabase
          .from('leads')
          .update({ status: 'active' })
          .eq('id', leadId);

        if (leadError) throw leadError;

        toast({
          title: 'Follow-up Deleted',
          description: 'Follow-up call has been removed successfully. The lead will return to "All Leads".',
        });

        // Refresh data
        fetchData(true);
      } catch (error: any) {
        console.error('Error deleting follow-up:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete follow-up. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRemoveLead = (lead: Lead) => {
    setSelectedLeadToRemove(lead);
    setRemovalReason("");
    setIsRemoveLeadModalOpen(true);
  };

  const handleConfirmRemoveLead = async () => {
    if (!selectedLeadToRemove || !removalReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for removing this lead.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First get the employee record to get the correct employee ID
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userRole?.user_id)
        .single();

      if (employeeError || !employeeData) {
        console.error('Employee not found:', employeeError);
        return;
      }

      // Save to removed_leads table
      const { error: removeError } = await supabase
        .from('removed_leads')
        .insert({
          lead_id: selectedLeadToRemove.id,
          employee_id: employeeData.id,
          company_id: userRole?.company_id,
          lead_name: selectedLeadToRemove.name,
          lead_email: selectedLeadToRemove.email,
          lead_contact: selectedLeadToRemove.contact,
          lead_company: selectedLeadToRemove.company,
          removal_reason: removalReason.trim(),
        });

      if (removeError) throw removeError;

      // Update the lead status to 'removed'
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'removed' })
        .eq('id', selectedLeadToRemove.id);

      if (leadError) throw leadError;

      toast({
        title: 'Lead Removed',
        description: 'Lead has been removed successfully with the provided reason.',
      });

      // Close modal and refresh data
      setIsRemoveLeadModalOpen(false);
      setSelectedLeadToRemove(null);
      setRemovalReason("");
      fetchData(true);
    } catch (error: any) {
      console.error('Error removing lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove lead. Please try again.',
        variant: 'destructive',
      });
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
        
        // Set default values for the call modal
        if (data.from_numbers && data.from_numbers.length > 0) {
          setFromNumber(data.from_numbers[0]);
        }
        if (data.caller_id) {
          setCallerId(data.caller_id);
        }
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
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
          user_id: userRole?.user_id,
          company_id: userRole?.company_id,
          stored_file_url: recordingUrl.trim(),
          file_name: analysisFileName.trim(),
          status: 'pending',
          transcript: selectedCall.notes,
        })
        .select()
        .single();

      if (recordingError) throw recordingError;

      // Step 2: Create analysis record immediately (n8n will update it with results)
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          recording_id: recording.id,
          call_id: selectedCall.id,
          user_id: userRole?.user_id,
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
        user_id: userRole?.user_id,
        call_id: selectedCall.id,
        timestamp: new Date().toISOString(),
        source: 'voice-axis-scan-employee-dashboard',
        url_validated: true,
        validation_method: 'employee_submission'
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

  const handleSubmitCall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLead || !callOutcome.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide call notes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Validate converted call has client and job selected
      if (callOutcomeStatus === 'converted') {
        if (!selectedClient || !selectedJob) {
          toast({
            title: 'Validation Error',
            description: 'Please select both Client and Job for converted calls.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Prepare next follow-up date
      let nextFollowUpDate_value = null;
      if (callOutcomeStatus === 'follow_up' && nextFollowUpDate && nextFollowUpTime) {
        nextFollowUpDate_value = new Date(`${nextFollowUpDate}T${nextFollowUpTime}`);
      }

      // Save or update the call in call_history table
      let call;
      let callError;
      
      if (currentCallRecordId) {
        // Update existing call record (from Exotel call)
        const { data: updatedCall, error: updateError } = await supabase
          .from('call_history')
          .update({
            outcome: callOutcomeStatus,
            notes: callOutcome.trim(),
            next_follow_up: nextFollowUpDate_value,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentCallRecordId)
          .select()
          .single();
        
        call = updatedCall;
        callError = updateError;
        
        // Clear the current call record ID
        setCurrentCallRecordId(null);
      } else {
        // Insert new call record (manual call without Exotel)
        const { data: newCall, error: insertError } = await supabase
          .from('call_history')
          .insert({
            lead_id: selectedLead.id,
            employee_id: userRole?.user_id,
            company_id: userRole?.company_id,
            outcome: callOutcomeStatus,
            notes: callOutcome.trim(),
            next_follow_up: nextFollowUpDate_value,
            call_date: new Date().toISOString(),
            exotel_response: {}, // Required field - empty object for manual calls
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        call = newCall;
        callError = insertError;
      }

      if (callError) throw callError;

      // Save to call_outcomes table as well for disposition tracking
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userRole?.user_id)
        .single();

      if (employeeData) {
        await supabase.from('call_outcomes').insert({
          lead_id: selectedLead.id,
          employee_id: employeeData.id,
          company_id: userRole?.company_id,
          outcome: callOutcomeStatus,
          notes: callOutcome.trim(),
          call_date: new Date().toISOString(),
          next_follow_up: nextFollowUpDate_value,
          created_at: new Date().toISOString()
        });
      }

      // Update the lead status and client/job for converted calls
      const leadUpdateData: any = {
        status: callOutcomeStatus === 'converted' ? 'converted' : 
          callOutcomeStatus === 'follow_up' ? 'follow_up' : 
          callOutcomeStatus === 'failed' ? 'not_interested' : 'contacted',
        updated_at: new Date().toISOString()
      };

      if (callOutcomeStatus === 'converted' && selectedClient && selectedJob) {
        leadUpdateData.client_id = selectedClient;
        // You can add job_id if the leads table has this field
      }

      const { error: leadError } = await supabase
        .from('leads')
        .update(leadUpdateData)
        .eq('id', selectedLead.id);

      if (leadError) {
        console.warn('Failed to update lead status:', leadError);
      }

      toast({
        title: 'Success',
        description: 'Call notes saved successfully!',
      });

      // Reset form and close modal
      setCallOutcome("");
      setCallOutcomeStatus('follow_up');
      setNextFollowUpDate("");
      setNextFollowUpTime("");
      setSelectedClient("");
      setSelectedJob("");
      setSelectedLead(null);
      setIsCallModalOpen(false);
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Error saving call:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Exotel API functions via Supabase Edge Function
  const initiateExotelCall = async (from: string, to: string, callerId: string) => {
    try {
      const response = await fetch('https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/exotel-proxy/calls/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdXVpdmJhZW1qcW10enRyanFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTUzMjMsImV4cCI6MjA3MzA3MTMyM30.0geG3EgNNZ5wH2ClKzZ_lwUgJlHRXr1CxcXo80ehVGM'}`,
        },
        body: JSON.stringify({
          from: from,
          to: to,
          callerId: callerId,
          company_id: userRole?.company_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error initiating Exotel call:', error);
      throw error;
    }
  };

  const getExotelCallDetails = async (callSid: string) => {
    try {
      const response = await fetch(`https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/exotel-proxy/calls/${callSid}?company_id=${userRole?.company_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdXVpdmJhZW1qcW10enRyanFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTUzMjMsImV4cCI6MjA3MzA3MTMyM30.0geG3EgNNZ5wH2ClKzZ_lwUgJlHRXr1CxcXo80ehVGM'}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting Exotel call details:', error);
      throw error;
    }
  };

  const startCallPolling = (callSid: string) => {
    const interval = setInterval(async () => {
      try {
        const callDetails = await getExotelCallDetails(callSid);
        console.log('📞 Call Details Response:', callDetails);
        
        const status = callDetails.Call.Status;
        setCallStatus(status);

        console.log(`📞 Call Status: ${status} for SID: ${callSid}`);

        if (status === 'completed') {
          // Call completed, stop polling and save recording URL
          clearInterval(interval);
          setCallPollingInterval(null);
          setIsCallInProgress(false);
          
          console.log('📞 Call completed! Full response:', callDetails);
          console.log('📞 Recording URL:', callDetails.Call.RecordingUrl);
          console.log('📞 Call Duration:', callDetails.Call.Duration);
          console.log('📞 Call End Time:', callDetails.Call.EndTime);
          
          // Save call details to database
          await saveCallToDatabase(callDetails.Call);
          
          // Close Exotel modal and open call outcome form
          setIsExotelCallModalOpen(false);
          setIsCallModalOpen(true);
          
          toast({
            title: 'Call Completed',
            description: 'Call has been completed successfully! Please fill in the call outcome.',
          });
        } else if (status === 'failed' || status === 'busy' || status === 'no-answer') {
          // Call failed, stop polling
          clearInterval(interval);
          setCallPollingInterval(null);
          setIsCallInProgress(false);
          
          console.log(`📞 Call not answered with status: ${status}`);
          
          // Save to call history with "Not Answered" status
          try {
            // Note: employee_id in call_history references employees.user_id (not employees.id)
            const { error: insertError } = await supabase.from('call_history').insert({
              lead_id: selectedLead?.id,
              employee_id: userRole.user_id,
              company_id: userRole?.company_id,
              outcome: 'not_answered',
              notes: 'Call was not answered by the recipient',
              exotel_call_sid: currentCallSid,
              exotel_status: status,
              exotel_from_number: fromNumber,
              exotel_to_number: toNumber,
              exotel_caller_id: callerId,
              exotel_response: {},
            });
            
            if (insertError) {
              console.error('❌ Error saving call to history:', insertError);
            } else {
              console.log('✅ Call recorded in history as "not_answered"');
              // Refresh data to show the new call in history
              fetchData();
            }
          } catch (error) {
            console.error('❌ Error saving call to history:', error);
          }
          
          toast({
            title: 'Call Not Answered',
            description: 'The call was not answered by the recipient.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error polling call status:', error);
      }
    }, 2000); // Poll every 2 seconds

    setCallPollingInterval(interval);
  };

  const saveCallToDatabase = async (callData: any) => {
    if (!selectedLead || !userRole?.company_id) return;

    try {
      console.log('📞 Saving call to database with data:', callData);
      
      // Note: employee_id in call_history references employees.user_id (not employees.id)
      // So we use userRole.user_id directly
      
      // Save to the new call_history table with complete Exotel response
      const sanitizedFrom = normalizePhoneNumber(callData.From);
      const sanitizedTo = normalizePhoneNumber(callData.To);

      const callHistoryData = {
        lead_id: selectedLead.id,
        employee_id: userRole.user_id, // Fixed: Use userRole.user_id
        company_id: userRole.company_id,
        outcome: 'completed', // Mark as completed since call was answered - will be updated when user submits outcome form
        notes: 'Call completed via Exotel',
        call_date: callData.StartTime || new Date().toISOString(), // Set call_date from Exotel start time
        exotel_response: callData, // Store complete Exotel response as JSONB
        exotel_call_sid: callData.Sid,
        exotel_from_number: sanitizedFrom || callData.From,
        exotel_to_number: sanitizedTo || callData.To,
        exotel_caller_id: callData.PhoneNumberSid,
        exotel_status: callData.Status,
        exotel_duration: callData.Duration,
        exotel_recording_url: callData.RecordingUrl,
        exotel_start_time: callData.StartTime,
        exotel_end_time: callData.EndTime,
        exotel_answered_by: callData.AnsweredBy,
        exotel_direction: callData.Direction,
      };

      console.log('📞 Call history data to insert:', callHistoryData);

      // Insert into call_history table and get the ID
      const { data: insertedCall, error: historyError } = await supabase
        .from('call_history')
        .insert(callHistoryData)
        .select()
        .single();

      if (historyError) throw historyError;

      console.log('✅ Call saved to history successfully with ID:', insertedCall.id);
      
      // Store the call record ID so we can update it when user submits outcome form
      setCurrentCallRecordId(insertedCall.id);

      // Refresh data to show the new call in history
      fetchData();

      // Also save to call_outcomes table for backward compatibility
      const callOutcomeData = {
        lead_id: selectedLead.id,
        employee_id: userRole.user_id, // Fixed: Use userRole.user_id
        company_id: userRole.company_id,
        outcome: 'completed', // Mark as completed since call was answered
        notes: 'Call completed via Exotel',
        exotel_call_sid: callData.Sid,
        exotel_from_number: callData.From,
        exotel_to_number: callData.To,
        exotel_caller_id: callData.PhoneNumberSid,
        exotel_status: callData.Status,
        exotel_duration: callData.Duration,
        exotel_recording_url: callData.RecordingUrl,
        exotel_start_time: callData.StartTime,
        exotel_end_time: callData.EndTime,
        call_in_progress: false,
      };

      const { error: outcomeError } = await supabase
        .from('call_outcomes')
        .insert(callOutcomeData);

      if (outcomeError) {
        console.warn('Warning: Failed to save to call_outcomes table:', outcomeError);
        // Don't throw error here as call_history is the primary storage
      }

      console.log('📞 Call successfully saved to database!');

      // Refresh data to show the new call
      fetchData();
    } catch (error: any) {
      console.error('Error saving call to database:', error);
      toast({
        title: 'Error',
        description: 'Failed to save call details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExotelCall = async () => {
    if (!fromNumber.trim() || !toNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both from and to numbers.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCallInProgress(true);
      setCallStatus('initiating');

      console.log('📞 Initiating call with:', { from: fromNumber, to: toNumber, callerId });

      // Initiate the call
      const callResponse = await initiateExotelCall(fromNumber, toNumber, callerId);
      console.log('📞 Call Initiation Response:', callResponse);
      
      const callSid = callResponse.Call.Sid;
      console.log('📞 Call SID:', callSid);
      
      setCurrentCallSid(callSid);
      setCallStatus('in-progress');

      // Start polling for call status
      startCallPolling(callSid);

      toast({
        title: 'Call Initiated',
        description: 'Call has been initiated successfully!',
      });

    } catch (error: any) {
      console.error('Error initiating call:', error);
      setIsCallInProgress(false);
      setCallStatus('');
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelCall = () => {
    if (callPollingInterval) {
      clearInterval(callPollingInterval);
      setCallPollingInterval(null);
    }
    setIsCallInProgress(false);
    setCallStatus('');
    setCurrentCallSid('');
    setCurrentCallRecordId(null); // Clear the call record ID
    setIsExotelCallModalOpen(false);
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

  // Get current leads based on selected section
  const getCurrentLeads = () => {
    switch (selectedLeadsSection) {
      case 'all':
        return allLeads;
      case 'followup':
        return followUpLeads;
      case 'completed':
        return completedLeads;
      default:
        return allLeads;
    }
  };

  const filteredLeads = getCurrentLeads().filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to get lead status indicator
  const getLeadStatusIndicator = (lead: Lead) => {
    // Find the latest call record for this lead (most recent)
    const callRecords = calls.filter(call => call.lead_id === lead.id);
    const latestCallRecord = callRecords.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    
    if (!latestCallRecord) {
      return { status: 'not_called', label: 'Not Called', variant: 'secondary' as const, color: 'text-gray-500' };
    }
    
    // Check if this is a follow-up call that still has next_follow_up set
    if (latestCallRecord.outcome === 'follow_up' && latestCallRecord.next_follow_up) {
      return { status: 'follow_up', label: 'Follow-up Added', variant: 'default' as const, color: 'text-orange-500' };
    }
    
    // If follow-up was deleted (no next_follow_up), show as called
    if (latestCallRecord.outcome === 'follow_up' && !latestCallRecord.next_follow_up) {
      return { status: 'called', label: 'Called', variant: 'default' as const, color: 'text-blue-500' };
    }
    
    switch (latestCallRecord.outcome) {
      case 'completed':
        return { status: 'completed', label: 'Called', variant: 'default' as const, color: 'text-green-500' };
      case 'not_interested':
        return { status: 'not_interested', label: 'Not Interested', variant: 'destructive' as const, color: 'text-red-500' };
      case 'interested':
        return { status: 'called', label: 'Called', variant: 'default' as const, color: 'text-blue-500' };
      case 'converted':
        return { status: 'completed', label: 'Called', variant: 'default' as const, color: 'text-green-500' };
      case 'lost':
        return { status: 'not_interested', label: 'Not Interested', variant: 'destructive' as const, color: 'text-red-500' };
      default:
        return { status: 'called', label: 'Called', variant: 'default' as const, color: 'text-blue-500' };
    }
  };

  // Function to calculate time remaining until follow-up
  const getTimeRemaining = (followUpDateTime: string) => {
    const now = currentTime;
    const followUp = new Date(followUpDateTime);
    const diffMs = followUp.getTime() - now.getTime();
    
    if (diffMs < 0) {
      // Overdue
      const overdueMs = Math.abs(diffMs);
      const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
      const overdueHours = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
      const overdueSeconds = Math.floor((overdueMs % (1000 * 60)) / 1000);
      
      return {
        isOverdue: true,
        days: overdueDays,
        hours: overdueHours,
        minutes: overdueMinutes,
        seconds: overdueSeconds,
        text: `Overdue by ${overdueDays}d ${overdueHours}h ${overdueMinutes}m`
      };
    } else {
      // Not yet due
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      return {
        isOverdue: false,
        days,
        hours,
        minutes,
        seconds,
        text: `${days}d ${hours}h ${minutes}m remaining`
      };
    }
  };

  // Filter data based on date range - using useMemo for reactivity
  const dateFilteredCalls = useMemo(() => {
    const now = new Date();
    
    const filtered = calls.filter(call => {
      if (!call.call_date) return false;
      const date = new Date(call.call_date);
      const callTime = date.getTime();
      
      if (dateFilter === 'today') {
        // Show previous business day (Friday if Monday, otherwise yesterday)
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
        const daysToGoBack = dayOfWeek === 1 ? 3 : (dayOfWeek === 0 ? 2 : 1);
        const reportDate = new Date(now);
        reportDate.setDate(now.getDate() - daysToGoBack);
        reportDate.setHours(0, 0, 0, 0);
        const reportDateEnd = new Date(reportDate);
        reportDateEnd.setHours(23, 59, 59, 999);
        return callTime >= reportDate.getTime() && callTime <= reportDateEnd.getTime();
      } else if (dateFilter === 'week') {
        // Monday to Friday of current week (includes future dates within week)
        const weekStart = new Date(now);
        const dayOfWeek = now.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 4); // Friday
        weekEnd.setHours(23, 59, 59, 999);
        
        return callTime >= weekStart.getTime() && callTime <= weekEnd.getTime();
      } else if (dateFilter === 'month') {
        // Entire current month (includes future dates within month)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return callTime >= monthStart.getTime() && callTime <= monthEnd.getTime();
      } else if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        const start = new Date(customDateRange.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customDateRange.endDate);
        end.setHours(23, 59, 59, 999);
        return callTime >= start.getTime() && callTime <= end.getTime();
      }
      return true;
    });
    
    return filtered;
  }, [calls, dateFilter, customDateRange.startDate, customDateRange.endDate]);

  const dateFilteredAnalyses = useMemo(() => {
    const now = new Date();
    
    return analyses.filter(analysis => {
      const createdAt = analysis.created_at;
      if (!createdAt) return false;
      
      const date = new Date(createdAt);
      const analysisTime = date.getTime();
      
      if (dateFilter === 'today') {
        // Show previous business day (Friday if Monday, otherwise yesterday)
        const dayOfWeek = now.getDay();
        const daysToGoBack = dayOfWeek === 1 ? 3 : (dayOfWeek === 0 ? 2 : 1);
        const reportDate = new Date(now);
        reportDate.setDate(now.getDate() - daysToGoBack);
        reportDate.setHours(0, 0, 0, 0);
        const reportDateEnd = new Date(reportDate);
        reportDateEnd.setHours(23, 59, 59, 999);
        return analysisTime >= reportDate.getTime() && analysisTime <= reportDateEnd.getTime();
      } else if (dateFilter === 'week') {
        // Monday to Friday of current week (includes future dates within week)
        const weekStart = new Date(now);
        const dayOfWeek = now.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 4);
        weekEnd.setHours(23, 59, 59, 999);
        
        return analysisTime >= weekStart.getTime() && analysisTime <= weekEnd.getTime();
      } else if (dateFilter === 'month') {
        // Entire current month (includes future dates within month)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return analysisTime >= monthStart.getTime() && analysisTime <= monthEnd.getTime();
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
    
    return dailyProductivity.filter(p => {
      if (!p.date) return false;
      const date = new Date(p.date);
      const prodTime = date.getTime();
      
      if (dateFilter === 'today') {
        // Show previous business day (Friday if Monday, otherwise yesterday)
        const dayOfWeek = now.getDay();
        const daysToGoBack = dayOfWeek === 1 ? 3 : (dayOfWeek === 0 ? 2 : 1);
        const reportDate = new Date(now);
        reportDate.setDate(now.getDate() - daysToGoBack);
        reportDate.setHours(0, 0, 0, 0);
        const reportDateEnd = new Date(reportDate);
        reportDateEnd.setHours(23, 59, 59, 999);
        return prodTime >= reportDate.getTime() && prodTime <= reportDateEnd.getTime();
      } else if (dateFilter === 'week') {
        // Monday to Friday of current week (includes future dates within week)
        const weekStart = new Date(now);
        const dayOfWeek = now.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 4);
        weekEnd.setHours(23, 59, 59, 999);
        
        return prodTime >= weekStart.getTime() && prodTime <= weekEnd.getTime();
      } else if (dateFilter === 'month') {
        // Entire current month (includes future dates within month)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return prodTime >= monthStart.getTime() && prodTime <= monthEnd.getTime();
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

  const applyCustomRange = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      setShowCustomDatePicker(false);
    }
  };

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
            <div className="border-l-2 border-purple-500/30 pl-4">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  Employee Dashboard
                  <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-none font-semibold px-2.5 py-0.5 text-xs shadow-md">
                    <Users className="h-3 w-3 mr-1" />
                    EMPLOYEE
                  </Badge>
                </h1>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="text-lg">👋</span>
                  <span className="font-semibold text-foreground">{user?.user_metadata?.full_name || 'Employee'}</span>
                </span>
                <span className="text-purple-500">•</span>
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-purple-500" />
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
              variant={selectedTab === "productivity" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("productivity")}
            >
              <BarChart className="h-4 w-4" />
              Productivity Dashboard
            </Button>
            <Button 
              variant={selectedTab === "leads" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("leads")}
            >
              <Phone className="h-4 w-4" />
              My Leads
            </Button>
            <Button 
              variant={selectedTab === "calls" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("calls")}
            >
              <PhoneCall className="h-4 w-4" />
              Call History
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
              variant={selectedTab === "analysis" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("analysis")}
            >
              <BarChart3 className="h-4 w-4" />
              Analysis
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
            <TabsContent value="overview" className="space-y-6">
              {/* Header with Date Filter */}
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Performance Dashboard</h1>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={dateFilter === 'today' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => {
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

              {showCustomDatePicker && dateFilter === 'custom' && (
                <Card className="bg-white shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input 
                          id="startDate" 
                          type="date" 
                          value={customDateRange.startDate}
                          onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input 
                          id="endDate" 
                          type="date"
                          value={customDateRange.endDate}
                          onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                      <Button size="sm" className="mt-6" onClick={applyCustomRange}>
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Row 1: Quality Scores with Circular Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Call Quality Score */}
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-sm font-medium text-gray-600 mb-3">Call quality score</p>
                    <div className="flex flex-col items-center">
                      <div className="relative w-24 h-24 mb-2">
                        <svg className="transform -rotate-90 w-24 h-24">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#10b981"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - (
                              (() => {
                                const completedAnalyses = dateFilteredAnalyses.filter(a => a.call_quality_score && a.call_quality_score > 0);
                                if (completedAnalyses.length === 0) return 0;
                                const avgScore = completedAnalyses.reduce((sum, a) => sum + (a.call_quality_score || 0), 0) / completedAnalyses.length;
                                return (avgScore / 100);
                              })()
                            ))}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-green-600">
                            {(() => {
                              const completedAnalyses = dateFilteredAnalyses.filter(a => a.call_quality_score && a.call_quality_score > 0);
                              if (completedAnalyses.length === 0) return '0%';
                              const avgScore = completedAnalyses.reduce((sum, a) => sum + (a.call_quality_score || 0), 0) / completedAnalyses.length;
                              return Math.round(avgScore) + '%';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Script Adherence */}
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-sm font-medium text-gray-600 mb-3">Script Adherence</p>
                    <div className="flex flex-col items-center">
                      <div className="relative w-24 h-24 mb-2">
                        <svg className="transform -rotate-90 w-24 h-24">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#10b981"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - (
                              (() => {
                                const completedAnalyses = dateFilteredAnalyses.filter(a => a.script_adherence && a.script_adherence > 0);
                                if (completedAnalyses.length === 0) return 0;
                                const avgScore = completedAnalyses.reduce((sum, a) => sum + (a.script_adherence || 0), 0) / completedAnalyses.length;
                                return (avgScore / 100);
                              })()
                            ))}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-green-600">
                            {(() => {
                              const completedAnalyses = dateFilteredAnalyses.filter(a => a.script_adherence && a.script_adherence > 0);
                              if (completedAnalyses.length === 0) return '0%';
                              const avgScore = completedAnalyses.reduce((sum, a) => sum + (a.script_adherence || 0), 0) / completedAnalyses.length;
                              return Math.round(avgScore) + '%';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Expectations */}
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-sm font-medium text-gray-600 mb-3">Compliance expectations</p>
                    <div className="flex flex-col items-center">
                      <div className="relative w-24 h-24 mb-2">
                        <svg className="transform -rotate-90 w-24 h-24">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#10b981"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - (
                              (() => {
                                const completedAnalyses = dateFilteredAnalyses.filter(a => a.compilience_expections_score !== null && a.compilience_expections_score !== undefined);
                                if (completedAnalyses.length === 0) return 0;
                                const avgScore = completedAnalyses.reduce((sum, a) => sum + (a.compilience_expections_score || 0), 0) / completedAnalyses.length;
                                return (avgScore / 100);
                              })()
                            ))}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-green-600">
                            {(() => {
                              const completedAnalyses = dateFilteredAnalyses.filter(a => a.compilience_expections_score !== null && a.compilience_expections_score !== undefined);
                              if (completedAnalyses.length === 0) return '0%';
                              const avgScore = completedAnalyses.reduce((sum, a) => sum + (a.compilience_expections_score || 0), 0) / completedAnalyses.length;
                              return Math.round(avgScore) + '%';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Login Time - Shows actual login for today, average for other periods */}
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-sm font-medium text-gray-600 mb-3">
                      {dateFilter === 'today' ? 'Login Time' : 'Avg Login Time'}
                    </p>
                    <div className="flex flex-col items-center">
                      <p className="text-4xl font-bold text-gray-900">
                        {(() => {
                          if (dateFilteredDailyProductivity.length === 0) return '--:--';
                          const loginTimes = dateFilteredDailyProductivity.filter(dp => dp.login_time);
                          if (loginTimes.length === 0) return '--:--';
                          
                          // For today, show the actual login time
                          if (dateFilter === 'today') {
                            return loginTimes[0].login_time.substring(0, 5); // Format HH:MM
                          }
                          
                          // For other periods, calculate average
                          const totalMinutes = loginTimes.reduce((sum, dp) => {
                            const [hours, minutes] = dp.login_time.split(':').map(Number);
                            return sum + (hours * 60 + minutes);
                          }, 0);
                          const avgMinutes = Math.round(totalMinutes / loginTimes.length);
                          const hours = Math.floor(avgMinutes / 60);
                          const mins = avgMinutes % 60;
                          return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                        })()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Logout Time - Shows expected logout for today, average for other periods */}
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-sm font-medium text-gray-600 mb-3">
                      {dateFilter === 'today' ? 'Expected Logout Time' : 'Avg Logout Time'}
                    </p>
                    <div className="flex flex-col items-center">
                      <p className="text-4xl font-bold text-gray-900">
                        {(() => {
                          if (dateFilteredDailyProductivity.length === 0) return '--:--';
                          
                          // For today, calculate expected logout (9 hours after login)
                          if (dateFilter === 'today') {
                            const loginTimes = dateFilteredDailyProductivity.filter(dp => dp.login_time);
                            if (loginTimes.length === 0) return '--:--';
                            
                            const [hours, minutes] = loginTimes[0].login_time.split(':').map(Number);
                            const loginMinutes = hours * 60 + minutes;
                            const expectedLogoutMinutes = loginMinutes + (9 * 60); // Add 9 hours
                            const logoutHours = Math.floor(expectedLogoutMinutes / 60);
                            const logoutMins = expectedLogoutMinutes % 60;
                            return `${logoutHours.toString().padStart(2, '0')}:${logoutMins.toString().padStart(2, '0')}`;
                          }
                          
                          // For other periods, calculate average logout time
                          const logoutTimes = dateFilteredDailyProductivity.filter(dp => dp.logout_time);
                          if (logoutTimes.length === 0) return '--:--';
                          
                          const totalMinutes = logoutTimes.reduce((sum, dp) => {
                            const [hours, minutes] = dp.logout_time.split(':').map(Number);
                            return sum + (hours * 60 + minutes);
                          }, 0);
                          const avgMinutes = Math.round(totalMinutes / logoutTimes.length);
                          const hours = Math.floor(avgMinutes / 60);
                          const mins = avgMinutes % 60;
                          return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                        })()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Call Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Calls */}
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Calls</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {dateFilteredCalls.length}
                    </p>
                  </CardContent>
                </Card>

                {/* Calls Connected */}
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Calls Connected</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {dateFilteredCalls.filter(c => c.outcome !== 'not_answered' && c.outcome !== 'failed').length}
                    </p>
                  </CardContent>
                </Card>

                {/* Avg Talk Time */}
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Avg. Talk time (per call)</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {(() => {
                        // Use exotel_duration from calls, filter out calls with duration < 60 seconds
                        const callsWithValidDuration = dateFilteredCalls.filter(c => 
                          c.exotel_duration && c.exotel_duration >= 60
                        );
                        if (callsWithValidDuration.length === 0) return '00:00';
                        const totalDuration = callsWithValidDuration.reduce((sum, c) => sum + (c.exotel_duration || 0), 0);
                        const avgDuration = Math.round(totalDuration / callsWithValidDuration.length);
                        const minutes = Math.floor(avgDuration / 60);
                        const seconds = avgDuration % 60;
                        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                      })()}
                    </p>
                  </CardContent>
                </Card>

                {/* Total Talk Time */}
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Total talk time</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {(() => {
                        // Use exotel_duration from calls, filter out calls with duration < 60 seconds
                        const callsWithValidDuration = dateFilteredCalls.filter(c => 
                          c.exotel_duration && c.exotel_duration >= 60
                        );
                        const totalDuration = callsWithValidDuration.reduce((sum, c) => sum + (c.exotel_duration || 0), 0);
                        const totalMinutes = Math.floor(totalDuration / 60);
                        return totalMinutes + 'm';
                      })()}
                    </p>
                  </CardContent>
                </Card>

                {/* Profile Utilization */}
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Profile Utilization</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {(() => {
                        const profilesDownloaded = dateFilteredDailyProductivity.reduce((sum, dp) => sum + (dp.profiles_downloaded || 0), 0);
                        // Count unique phone numbers called (not duplicate calls to same number)
                        const uniquePhoneNumbers = new Set(
                          dateFilteredCalls
                            .map(c => c.exotel_to_number || c.exotel_from_number)
                            .filter(num => num) // Remove null/undefined
                        );
                        const uniqueCallsMade = uniquePhoneNumbers.size;
                        if (profilesDownloaded === 0) return '0%';
                        const utilization = (uniqueCallsMade / profilesDownloaded) * 100;
                        return Math.round(utilization) + '%';
                      })()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Last 7 Days Calls */}
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Last 7 Days Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={(() => {
                            const last7Days = [];
                            const today = new Date();
                            for (let i = 6; i >= 0; i--) {
                              const date = new Date(today);
                              date.setDate(date.getDate() - i);
                              const dateStr = date.toISOString().split('T')[0];
                              const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
                              const dayCalls = calls.filter(c => {
                                const callDate = new Date(c.created_at).toISOString().split('T')[0];
                                return callDate === dateStr;
                              }).length;
                              last7Days.push({
                                day: dayName,
                                calls: dayCalls
                              });
                            }
                            return last7Days;
                          })()}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis 
                            dataKey="day" 
                            axisLine={false}
                            tickLine={false}
                            style={{ fontSize: '12px', fill: '#6b7280' }}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            style={{ fontSize: '12px', fill: '#6b7280' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                            cursor={{ fill: '#f3f4f6' }}
                          />
                          <Bar 
                            dataKey="calls" 
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Profiles Downloaded */}
                  <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 pb-6">
                      <p className="text-sm font-medium text-gray-600 mb-2">Profiles Downloaded</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {dateFilteredDailyProductivity.reduce((sum, dp) => sum + (dp.profiles_downloaded || 0), 0)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Calls Converted */}
                  <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 pb-6">
                      <p className="text-sm font-medium text-gray-600 mb-2">Calls Converted</p>
                      <p className="text-4xl font-bold text-green-600">
                        {dateFilteredCalls.filter(c => c.outcome === 'converted').length}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Missed Calls */}
                  <Card 
                    className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedTab('calls');
                      setCallDateFilter(dateFilter === 'today' ? 'today' : dateFilter === 'week' ? 'week' : dateFilter === 'month' ? 'month' : 'all');
                      setCallOutcomeFilter('not_answered');
                    }}
                  >
                    <CardContent className="pt-6 pb-6">
                      <p className="text-sm font-medium text-gray-600 mb-2">Missed Calls</p>
                      <p className="text-4xl font-bold text-red-600">
                        {dateFilteredCalls.filter(c => c.outcome === 'not_answered').length}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Follow-up Calls */}
                  <Card 
                    className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedTab('calls');
                      setCallDateFilter(dateFilter === 'today' ? 'today' : dateFilter === 'week' ? 'week' : dateFilter === 'month' ? 'month' : 'all');
                      setCallOutcomeFilter('follow_up');
                    }}
                  >
                    <CardContent className="pt-6 pb-6">
                      <p className="text-sm font-medium text-gray-600 mb-2">Follow-up Calls</p>
                      <p className="text-4xl font-bold text-orange-600">
                        {dateFilteredCalls.filter(c => c.outcome === 'follow_up').length}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Row 4: Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Avg Calls per Day</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {(() => {
                            const uniqueDays = new Set(dateFilteredCalls.map(c => new Date(c.created_at).toISOString().split('T')[0]));
                            return uniqueDays.size > 0 ? (dateFilteredCalls.length / uniqueDays.size).toFixed(1) : 0;
                          })()}
                        </p>
                      </div>
                      <PhoneCall className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                        <p className="text-3xl font-bold text-green-600">
                          {dateFilteredCalls.length > 0 
                            ? ((dateFilteredCalls.filter(c => c.outcome === 'converted').length / dateFilteredCalls.length) * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Pending Follow-ups</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {dateFilteredCalls.filter(c => c.outcome === 'follow_up').length}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 5: Productivity Breakdown */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Productivity Breakdown</CardTitle>
                  <CardDescription>How your score is calculated</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-sm font-medium">Conversion Rate</span>
                        <span className="text-xs text-muted-foreground ml-2">(Weight: 40%)</span>
                      </div>
                      <span className="text-sm font-bold">
                        {dateFilteredCalls.length > 0 
                          ? ((dateFilteredCalls.filter(c => c.outcome === 'converted').length / dateFilteredCalls.length) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${dateFilteredCalls.length > 0 
                            ? ((dateFilteredCalls.filter(c => c.outcome === 'converted').length / dateFilteredCalls.length) * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-sm font-medium">Profile Utilization</span>
                        <span className="text-xs text-muted-foreground ml-2">(Weight: 30%)</span>
                      </div>
                      <span className="text-sm font-bold">
                        {(() => {
                          const profilesDownloaded = dateFilteredDailyProductivity.reduce((sum, dp) => sum + (dp.profiles_downloaded || 0), 0);
                          const callsMade = dateFilteredCalls.length;
                          return profilesDownloaded > 0 
                            ? Math.min((callsMade / profilesDownloaded) * 100, 100).toFixed(1)
                            : 0;
                        })()}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${(() => {
                            const profilesDownloaded = dateFilteredDailyProductivity.reduce((sum, dp) => sum + (dp.profiles_downloaded || 0), 0);
                            const callsMade = dateFilteredCalls.length;
                            return profilesDownloaded > 0 
                              ? Math.min((callsMade / profilesDownloaded) * 100, 100)
                              : 0;
                          })()}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-sm font-medium">Follow-up Rate</span>
                        <span className="text-xs text-muted-foreground ml-2">(Weight: 30%)</span>
                      </div>
                      <span className="text-sm font-bold">
                        {dateFilteredCalls.length > 0 
                          ? ((dateFilteredCalls.filter(c => c.outcome === 'follow_up').length / dateFilteredCalls.length) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${dateFilteredCalls.length > 0 
                            ? ((dateFilteredCalls.filter(c => c.outcome === 'follow_up').length / dateFilteredCalls.length) * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-sm font-medium">Average Work Hours</span>
                      </div>
                      <span className="text-sm font-bold">
                        {(() => {
                          if (dateFilteredDailyProductivity.length === 0) return '0.0h';
                          
                          const totalHours = dateFilteredDailyProductivity.reduce((sum, dp) => {
                            return sum + (parseFloat(dp.work_hours) || 0);
                          }, 0);
                          
                          const avgHours = (totalHours / dateFilteredDailyProductivity.length).toFixed(1);
                          return `${avgHours}h`;
                        })()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${(() => {
                            if (dateFilteredDailyProductivity.length === 0) return 0;
                            
                            const totalHours = dateFilteredDailyProductivity.reduce((sum, dp) => {
                              return sum + (parseFloat(dp.work_hours) || 0);
                            }, 0);
                            
                            const avgHours = totalHours / dateFilteredDailyProductivity.length;
                            // Show as percentage of 8 hours (standard workday)
                            return Math.min((avgHours / 8) * 100, 100);
                          })()}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="productivity" className="space-y-6">
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
                  
                  {showCustomDatePicker && dateFilter === 'custom' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor="prodStartDate">Start Date</Label>
                          <Input 
                            id="prodStartDate" 
                            type="date" 
                            value={customDateRange.startDate}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="prodEndDate">End Date</Label>
                          <Input 
                            id="prodEndDate" 
                            type="date"
                            value={customDateRange.endDate}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                        <Button size="sm" className="mt-6" onClick={applyCustomRange}>
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Productivity Dashboard */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Productivity Dashboard</h2>
                
                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-blue-900 mb-2">
                        {dateFilteredAnalyses.length}
                      </div>
                      <p className="text-sm text-blue-700 font-medium">Total Profiles Downloaded</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-purple-900 mb-2">
                        {dateFilteredCalls.length}
                      </div>
                      <p className="text-sm text-purple-700 font-medium">Total Calls Made</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-green-900 mb-2">
                        {dateFilteredCalls.filter(c => c.outcome === 'converted').length}
                      </div>
                      <p className="text-sm text-green-700 font-medium">Total Converted</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-orange-900 mb-2">
                        {(() => {
                          // Calculate Productivity Score
                          const profilesDownloaded = dateFilteredAnalyses.length;
                          const callsMade = dateFilteredCalls.length;
                          const converted = dateFilteredCalls.filter(c => c.outcome === 'converted').length;
                          const followUps = dateFilteredCalls.filter(c => c.outcome === 'follow_up').length;
                          
                          // Scoring formula
                          let score = 0;
                          if (callsMade > 0) {
                            const conversionRate = (converted / callsMade) * 100;
                            const profileUtilization = profilesDownloaded > 0 ? (callsMade / profilesDownloaded) * 100 : 0;
                            const followUpRate = (followUps / callsMade) * 100;
                            
                            // Weighted average: 40% conversion, 30% calls, 30% profile utilization
                            score = (conversionRate * 0.4) + (Math.min(profileUtilization, 100) * 0.3) + (followUpRate * 0.3);
                          }
                          
                          return Math.round(score);
                        })()}
                      </div>
                      <p className="text-sm text-orange-700 font-medium">Productivity Score</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-cyan-900 mb-2">
                        {(() => {
                          // Calculate Average Talk Time from exotel_duration column
                          const callsWithDuration = dateFilteredCalls.filter(c => c.exotel_duration && c.exotel_duration > 0);
                          if (callsWithDuration.length === 0) return '0:00';
                          
                          const totalDuration = callsWithDuration.reduce((sum, call) => {
                            return sum + (call.exotel_duration || 0);
                          }, 0);
                          
                          const avgDuration = Math.round(totalDuration / callsWithDuration.length);
                          const minutes = Math.floor(avgDuration / 60);
                          const seconds = avgDuration % 60;
                          
                          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        })()}
                      </div>
                      <p className="text-sm text-cyan-700 font-medium">Avg. Talk Time</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-indigo-900 mb-2">
                        {(() => {
                          // Calculate Average Work Hours from daily productivity data
                          if (dateFilteredDailyProductivity.length === 0) return '0.0h';
                          
                          const totalHours = dateFilteredDailyProductivity.reduce((sum, dp) => {
                            return sum + (parseFloat(dp.work_hours) || 0);
                          }, 0);
                          
                          const avgHours = (totalHours / dateFilteredDailyProductivity.length).toFixed(1);
                          return `${avgHours}h`;
                        })()}
                      </div>
                      <p className="text-sm text-indigo-700 font-medium">Avg. Work Hours</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-emerald-900 mb-2">
                        {(() => {
                          // Get today's login time
                          const today = '2025-11-24'; // Current date
                          const todayData = dailyProductivity.find(dp => dp.date === today);
                          
                          if (!todayData || !todayData.login_time) return '--:--';
                          
                          // Format time to remove seconds for cleaner display
                          const time = todayData.login_time.substring(0, 5);
                          return time;
                        })()}
                      </div>
                      <p className="text-sm text-emerald-700 font-medium">Today's Login</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-teal-50 to-teal-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-teal-900 mb-2">
                        {(() => {
                          // Calculate Average Login Time
                          if (dateFilteredDailyProductivity.length === 0) return '--:--';
                          
                          const loginTimes = dateFilteredDailyProductivity.filter(dp => dp.login_time);
                          if (loginTimes.length === 0) return '--:--';
                          
                          // Convert times to minutes for averaging
                          const totalMinutes = loginTimes.reduce((sum, dp) => {
                            const [hours, minutes] = dp.login_time.split(':').map(Number);
                            return sum + (hours * 60 + minutes);
                          }, 0);
                          
                          const avgMinutes = Math.round(totalMinutes / loginTimes.length);
                          const avgHours = Math.floor(avgMinutes / 60);
                          const avgMins = avgMinutes % 60;
                          
                          return `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`;
                        })()}
                      </div>
                      <p className="text-sm text-teal-700 font-medium">Avg. Login Time</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-violet-50 to-violet-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl font-bold text-violet-900 mb-2">
                        {(() => {
                          // Calculate Average Logout Time
                          if (dateFilteredDailyProductivity.length === 0) return '--:--';
                          
                          const logoutTimes = dateFilteredDailyProductivity.filter(dp => dp.logout_time);
                          if (logoutTimes.length === 0) return '--:--';
                          
                          // Convert times to minutes for averaging
                          const totalMinutes = logoutTimes.reduce((sum, dp) => {
                            const [hours, minutes] = dp.logout_time.split(':').map(Number);
                            return sum + (hours * 60 + minutes);
                          }, 0);
                          
                          const avgMinutes = Math.round(totalMinutes / logoutTimes.length);
                          const avgHours = Math.floor(avgMinutes / 60);
                          const avgMins = avgMinutes % 60;
                          
                          return `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`;
                        })()}
                      </div>
                      <p className="text-sm text-violet-700 font-medium">Avg. Logout Time</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Productivity Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Productivity Breakdown</CardTitle>
                      <CardDescription>How your score is calculated</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-sm font-medium">Conversion Rate</span>
                            <span className="text-xs text-muted-foreground ml-2">(Weight: 40%)</span>
                          </div>
                          <span className="text-sm font-bold">
                            {dateFilteredCalls.length > 0 
                              ? ((dateFilteredCalls.filter(c => c.outcome === 'converted').length / dateFilteredCalls.length) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${calls.length > 0 
                                ? ((calls.filter(c => c.outcome === 'converted').length / calls.length) * 100)
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-sm font-medium">Profile Utilization</span>
                            <span className="text-xs text-muted-foreground ml-2">(Weight: 30%)</span>
                          </div>
                          <span className="text-sm font-bold">
                            {analyses.length > 0 
                              ? Math.min((calls.length / analyses.length) * 100, 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${analyses.length > 0 
                                ? Math.min((calls.length / analyses.length) * 100, 100)
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-sm font-medium">Follow-up Rate</span>
                            <span className="text-xs text-muted-foreground ml-2">(Weight: 30%)</span>
                          </div>
                          <span className="text-sm font-bold">
                            {calls.length > 0 
                              ? ((calls.filter(c => c.outcome === 'follow_up').length / calls.length) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${calls.length > 0 
                                ? ((calls.filter(c => c.outcome === 'follow_up').length / calls.length) * 100)
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-sm font-medium">Average Work Hours</span>
                          </div>
                          <span className="text-sm font-bold">
                            {(() => {
                              if (dailyProductivity.length === 0) return '0.0h';
                              
                              const totalHours = dailyProductivity.reduce((sum, dp) => {
                                return sum + (parseFloat(dp.work_hours) || 0);
                              }, 0);
                              
                              const avgHours = (totalHours / dailyProductivity.length).toFixed(1);
                              return `${avgHours}h`;
                            })()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${(() => {
                                if (dailyProductivity.length === 0) return 0;
                                
                                const totalHours = dailyProductivity.reduce((sum, dp) => {
                                  return sum + (parseFloat(dp.work_hours) || 0);
                                }, 0);
                                
                                const avgHours = totalHours / dailyProductivity.length;
                                // Show as percentage of 8 hours (standard workday)
                                return Math.min((avgHours / 8) * 100, 100);
                              })()}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Last 7 Days Productivity Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Last 7 Days Productivity Score</CardTitle>
                      <CardDescription>Your daily productivity trend</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-end justify-between gap-2">
                        {(() => {
                          // Current week: Monday Nov 24 to Friday Nov 28, 2025
                          const weekDays = [
                            { date: '2025-11-24', day: 'Mon' },
                            { date: '2025-11-25', day: 'Tue' },
                            { date: '2025-11-26', day: 'Wed' },
                            { date: '2025-11-27', day: 'Thu' },
                            { date: '2025-11-28', day: 'Fri' }
                          ];
                          
                          // Use data from database table if available, otherwise calculate
                          const weekData = weekDays.map(dayInfo => {
                            // Try to find data from the database
                            const dbData = dailyProductivity.find(dp => dp.date === dayInfo.date);
                            
                            if (dbData) {
                              // Use database data
                              return {
                                date: dayInfo.date,
                                day: dayInfo.day,
                                score: Math.round(parseFloat(dbData.productivity_score) || 0),
                                profilesDownloaded: dbData.profiles_downloaded,
                                callsMade: dbData.calls_made,
                                loginTime: dbData.login_time,
                                logoutTime: dbData.logout_time,
                                workHours: dbData.work_hours ? parseFloat(dbData.work_hours).toFixed(1) : null
                              };
                            } else {
                              // Fallback: calculate from calls and analyses
                              const dayCallsFiltered = calls.filter(c => {
                                const callDate = new Date(c.created_at).toISOString().split('T')[0];
                                return callDate === dayInfo.date;
                              });
                              
                              const dayAnalysesFiltered = analyses.filter(a => {
                                const analysisDate = new Date(a.created_at).toISOString().split('T')[0];
                                return analysisDate === dayInfo.date;
                              });
                              
                              const dayConverted = dayCallsFiltered.filter(c => c.outcome === 'converted').length;
                              const dayFollowUps = dayCallsFiltered.filter(c => c.outcome === 'follow_up').length;
                              
                              let dayScore = 0;
                              if (dayCallsFiltered.length > 0) {
                                const conversionRate = (dayConverted / dayCallsFiltered.length) * 100;
                                const profileUtilization = dayAnalysesFiltered.length > 0 
                                  ? (dayCallsFiltered.length / dayAnalysesFiltered.length) * 100 
                                  : 0;
                                const followUpRate = (dayFollowUps / dayCallsFiltered.length) * 100;
                                
                                dayScore = (conversionRate * 0.4) + (Math.min(profileUtilization, 100) * 0.3) + (followUpRate * 0.3);
                              }
                              
                              return {
                                date: dayInfo.date,
                                day: dayInfo.day,
                                score: Math.round(dayScore),
                                profilesDownloaded: dayAnalysesFiltered.length,
                                callsMade: dayCallsFiltered.length,
                                loginTime: null,
                                logoutTime: null,
                                workHours: null
                              };
                            }
                          });
                          
                          return weekData.map((day, idx) => (
                            <div key={idx} className="flex-1 flex flex-col justify-end h-full group relative">
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap pointer-events-none z-10">
                                <div className="font-bold mb-1">Score: {day.score}</div>
                                <div>Profiles: {day.profilesDownloaded || 0}</div>
                                <div>Calls: {day.callsMade || 0}</div>
                                {day.loginTime && (
                                  <>
                                    <div className="mt-1 pt-1 border-t border-gray-700">Login: {day.loginTime}</div>
                                    <div>Logout: {day.logoutTime}</div>
                                    <div>Hours: {day.workHours}h</div>
                                  </>
                                )}
                              </div>
                              <div 
                                className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                                style={{ height: `${day.score}%` }}
                              ></div>
                              <div className="text-center mt-2">
                                <span className="text-xs font-medium">{day.day}</span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Avg Calls per Day</p>
                          <p className="text-2xl font-bold">
                            {(() => {
                              const uniqueDays = new Set(calls.map(c => new Date(c.created_at).toISOString().split('T')[0]));
                              return uniqueDays.size > 0 ? (calls.length / uniqueDays.size).toFixed(1) : 0;
                            })()}
                          </p>
                        </div>
                        <PhoneCall className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                          <p className="text-2xl font-bold text-green-600">
                            {calls.length > 0 
                              ? ((calls.filter(c => c.outcome === 'converted').length / calls.length) * 100).toFixed(1)
                              : 0}%
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Pending Follow-ups</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {calls.filter(c => c.outcome === 'follow_up').length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="leads" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">My Leads</h2>
                  <p className="text-muted-foreground">Manage your assigned leads</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setIsDialerModalOpen(true)}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <PhoneCall className="h-4 w-4" />
                    Dial Number
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchData(true)}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Tabs for Leads and Lead Groups */}
              <Tabs value={leadsSection} onValueChange={(value) => setLeadsSection(value as 'leads' | 'groups')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="leads">My Leads</TabsTrigger>
                  <TabsTrigger value="groups">Lead Groups</TabsTrigger>
                </TabsList>
                
                <TabsContent value="leads" className="space-y-6">
              {/* Section Tabs */}
              <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                <Button
                  variant={selectedLeadsSection === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedLeadsSection('all')}
                  className="flex-1"
                >
                  All Leads ({allLeads.length})
                </Button>
                <Button
                  variant={selectedLeadsSection === 'followup' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedLeadsSection('followup')}
                  className="flex-1"
                >
                  Follow-up ({followUpLeads.length})
                </Button>
                <Button
                  variant={selectedLeadsSection === 'completed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedLeadsSection('completed')}
                  className="flex-1"
                >
                  Completed ({completedLeads.length})
                </Button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedLeadsSection === 'all' && <Phone className="h-5 w-5" />}
                    {selectedLeadsSection === 'followup' && <Calendar className="h-5 w-5" />}
                    {selectedLeadsSection === 'completed' && <Check className="h-5 w-5" />}
                    {selectedLeadsSection === 'all' && `All Leads (${filteredLeads.length})`}
                    {selectedLeadsSection === 'followup' && `Follow-up Leads (${filteredLeads.length})`}
                    {selectedLeadsSection === 'completed' && `Completed Leads (${filteredLeads.length})`}
                  </CardTitle>
                  <CardDescription>
                    {selectedLeadsSection === 'all' && 'All your leads with call status indicators'}
                    {selectedLeadsSection === 'followup' && 'Leads that need follow-up calls'}
                    {selectedLeadsSection === 'completed' && 'Leads that have been completed or converted'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-8">
                      {selectedLeadsSection === 'all' && <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                      {selectedLeadsSection === 'followup' && <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                      {selectedLeadsSection === 'completed' && <Check className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                      <p className="text-muted-foreground">
                        {selectedLeadsSection === 'all' && 'No leads assigned to you yet'}
                        {selectedLeadsSection === 'followup' && 'No follow-up leads at the moment'}
                        {selectedLeadsSection === 'completed' && 'No completed leads yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredLeads.map((lead) => {
                        // Find the latest call record for this lead to get follow-up time
                        const callRecords = calls.filter(call => call.lead_id === lead.id);
                        const latestCallRecord = callRecords.sort((a, b) => 
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        )[0];
                        const followUpTime = latestCallRecord?.next_follow_up;
                        const statusIndicator = getLeadStatusIndicator(lead);
                        
                        return (
                        <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                selectedLeadsSection === 'all' ? 'bg-blue-100' :
                                selectedLeadsSection === 'followup' ? 'bg-orange-100' :
                                'bg-green-100'
                              }`}>
                                {selectedLeadsSection === 'all' && <Phone className="h-5 w-5 text-blue-500" />}
                                {selectedLeadsSection === 'followup' && <Calendar className="h-5 w-5 text-orange-500" />}
                                {selectedLeadsSection === 'completed' && <Check className="h-5 w-5 text-green-500" />}
                            </div>
                            <div>
                              <h4 className="font-medium">{lead.name}</h4>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                              <p className="text-sm text-muted-foreground">{lead.contact}</p>
                                {selectedLeadsSection === 'all' && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={statusIndicator.variant} className="text-xs">
                                      {statusIndicator.label}
                                    </Badge>
                                    {statusIndicator.status === 'follow_up' && followUpTime && (
                                      <Badge variant="outline" className="text-xs">
                                        {new Date(followUpTime).toLocaleDateString()} at {new Date(followUpTime).toLocaleTimeString()}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {selectedLeadsSection === 'followup' && followUpTime && (
                                  <div className="flex flex-col gap-2 mt-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        Follow-up: {new Date(followUpTime).toLocaleDateString()} at {new Date(followUpTime).toLocaleTimeString()}
                                      </Badge>
                                    </div>
                                    {(() => {
                                      const timeRemaining = getTimeRemaining(followUpTime);
                                      return (
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-1">
                                            <div className={`px-2 py-1 rounded text-xs font-mono ${
                                              timeRemaining.isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {timeRemaining.days.toString().padStart(2, '0')}
                                            </div>
                                            <span className="text-xs text-muted-foreground">Days</span>
                                            <div className={`px-2 py-1 rounded text-xs font-mono ${
                                              timeRemaining.isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {timeRemaining.hours.toString().padStart(2, '0')}
                                            </div>
                                            <span className="text-xs text-muted-foreground">Hrs</span>
                                            <div className={`px-2 py-1 rounded text-xs font-mono ${
                                              timeRemaining.isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {timeRemaining.minutes.toString().padStart(2, '0')}
                                            </div>
                                            <span className="text-xs text-muted-foreground">Min</span>
                                            <div className={`px-2 py-1 rounded text-xs font-mono ${
                                              timeRemaining.isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {timeRemaining.seconds.toString().padStart(2, '0')}
                                            </div>
                                            <span className="text-xs text-muted-foreground">Sec</span>
                                          </div>
                                          {timeRemaining.isOverdue && (
                                            <Badge variant="destructive" className="text-xs w-fit">
                                              Overdue
                                            </Badge>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">
                                {lead.status}
                              </Badge>
                              
                              {/* Show call button for all leads and follow-up leads */}
                              {(selectedLeadsSection === 'all' || selectedLeadsSection === 'followup') && (
                            <Button 
                                  onClick={() => handleStartExotelCall(lead)}
                              className="gap-2"
                            >
                                  <Phone className="h-4 w-4" />
                                  {selectedLeadsSection === 'followup' ? 'Follow-up Call' : 'Call'}
                            </Button>
                              )}
                              
                              {/* Show remove button (moves lead to removed_leads) */}
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveLead(lead)}
                                className="gap-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                {selectedLeadsSection === 'followup' ? 'Remove Lead' : 'Remove'}
                              </Button>
                            </div>
                            
                            {/* Auto-call toggle for follow-up leads */}
                            {selectedLeadsSection === 'followup' && latestCallRecord && (
                              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-md">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={latestCallRecord.auto_call_followup || false}
                                    onChange={async (e) => {
                                      const newValue = e.target.checked;
                                      try {
                                        const { error } = await supabase
                                          .from('call_history')
                                          .update({ auto_call_followup: newValue })
                                          .eq('id', latestCallRecord.id);
                                        
                                        if (error) throw error;
                                        
                                        // Update local state
                                        setCalls(prev => prev.map(c => 
                                          c.id === latestCallRecord.id 
                                            ? { ...c, auto_call_followup: newValue }
                                            : c
                                        ));
                                        
                                        toast({
                                          title: newValue ? 'Auto-call enabled' : 'Auto-call disabled',
                                          description: newValue 
                                            ? 'Call will be triggered automatically at scheduled time' 
                                            : 'Automatic calling has been disabled',
                                        });
                                      } catch (error: any) {
                                        console.error('Error updating auto-call:', error);
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to update auto-call setting',
                                          variant: 'destructive',
                                        });
                                      }
                                    }}
                                    className="w-4 h-4"
                                  />
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium text-blue-700">Auto-call at scheduled time</span>
                                </label>
                              </div>
                            )}
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
                          <p className="text-muted-foreground">View and call your leads in this group</p>
                        </div>
                      </div>

                      {/* Group Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {allLeads.filter(lead => lead.group_id === selectedLeadGroup.id).length}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                              {allLeads.filter(lead => lead.group_id === selectedLeadGroup.id && completedLeadIds.has(lead.id)).length}
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

                      {/* Leads List */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Leads in This Group</CardTitle>
                          <CardDescription>Your assigned leads from this group</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {allLeads.filter(lead => lead.group_id === selectedLeadGroup.id).length === 0 ? (
                            <div className="text-center py-8">
                              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No leads assigned to you in this group</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {allLeads.filter(lead => lead.group_id === selectedLeadGroup.id).map((lead) => {
                                const callRecords = calls.filter(call => call.lead_id === lead.id);
                                const latestCallRecord = callRecords.sort((a, b) => 
                                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                )[0];
                                const statusIndicator = getLeadStatusIndicator(lead);
                                
                                return (
                                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4 flex-1">
                                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Phone className="h-5 w-5 text-blue-500" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium">{lead.name}</h4>
                                          <Badge
                                            variant={statusIndicator.variant}
                                            className={`text-xs ${statusIndicator.color}`}
                                          >
                                            {statusIndicator.label}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                                        <p className="text-sm text-muted-foreground">{lead.contact}</p>
                                        {latestCallRecord && latestCallRecord.next_follow_up && (
                                          <p className="text-xs text-orange-600 mt-1">
                                            Follow-up: {new Date(latestCallRecord.next_follow_up).toLocaleString()}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedLead(lead);
                                          setIsCallModalOpen(true);
                                        }}
                                        className="gap-2 bg-green-600 hover:bg-green-700"
                                      >
                                        <PhoneCall className="h-4 w-4" />
                                        Call
                                      </Button>
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
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          My Lead Groups
                        </CardTitle>
                        <CardDescription>
                          View lead groups containing your assigned leads
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {leadGroups.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">You don't have any leads in groups yet</p>
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
                                    {allLeads.filter(lead => lead.group_id === group.id).length} leads assigned to you
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => {
                                    setSelectedLeadGroup(group);
                                    setIsViewingGroupPage(true);
                                  }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Leads
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

            <TabsContent value="calls" className="space-y-6">
              {/* Header with Filters */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Call History</h2>
                </div>
                <Select value={callDateFilter} onValueChange={setCallDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Last 30 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
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
                    All ({calls.length})
                  </button>
                  <button
                    onClick={() => setCallOutcomeFilter('converted')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      callOutcomeFilter === 'converted'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Converted ({calls.filter(c => c.outcome === 'converted').length})
                  </button>
                  <button
                    onClick={() => setCallOutcomeFilter('not_answered')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      callOutcomeFilter === 'not_answered'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Not Answered ({calls.filter(c => c.outcome === 'not_answered').length})
                  </button>
                  <button
                    onClick={() => setCallOutcomeFilter('follow_up')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      callOutcomeFilter === 'follow_up'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Follow-up ({calls.filter(c => c.outcome === 'follow_up').length})
                  </button>
                  <button
                    onClick={() => setCallOutcomeFilter('failed')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      callOutcomeFilter === 'failed'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Rejected ({calls.filter(c => c.outcome === 'failed').length})
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
                      <TableHead className="font-semibold">Disposition</TableHead>
                      <TableHead className="font-semibold">Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Filter calls based on filters
                      let filteredCalls = calls;

                      // Filter by outcome from call_history table
                      if (callOutcomeFilter !== 'all') {
                        filteredCalls = filteredCalls.filter(call => call.outcome === callOutcomeFilter);
                      }

                      // Filter by date - MUST MATCH DASHBOARD DATE FILTERING LOGIC
                      const now = new Date();
                      if (callDateFilter === 'today') {
                        // Show previous business day (Friday if Monday, otherwise yesterday) - MATCHES DASHBOARD
                        const dayOfWeek = now.getDay();
                        const daysToGoBack = dayOfWeek === 1 ? 3 : (dayOfWeek === 0 ? 2 : 1);
                        const reportDate = new Date(now);
                        reportDate.setDate(now.getDate() - daysToGoBack);
                        reportDate.setHours(0, 0, 0, 0);
                        const reportDateEnd = new Date(reportDate);
                        reportDateEnd.setHours(23, 59, 59, 999);
                        filteredCalls = filteredCalls.filter(call => {
                          const callTime = new Date(call.call_date || call.created_at).getTime();
                          return callTime >= reportDate.getTime() && callTime <= reportDateEnd.getTime();
                        });
                      } else if (callDateFilter === 'week') {
                        // Monday to Friday of current week - MATCHES DASHBOARD
                        const dayOfWeek = now.getDay();
                        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                        const weekStart = new Date(now);
                        weekStart.setDate(now.getDate() - daysFromMonday);
                        weekStart.setHours(0, 0, 0, 0);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 4); // Friday
                        weekEnd.setHours(23, 59, 59, 999);
                        filteredCalls = filteredCalls.filter(call => {
                          const callTime = new Date(call.call_date || call.created_at).getTime();
                          return callTime >= weekStart.getTime() && callTime <= weekEnd.getTime();
                        });
                      } else if (callDateFilter === 'month') {
                        // Entire current month - MATCHES DASHBOARD
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                        monthStart.setHours(0, 0, 0, 0);
                        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        monthEnd.setHours(23, 59, 59, 999);
                        filteredCalls = filteredCalls.filter(call => {
                          const callTime = new Date(call.call_date || call.created_at).getTime();
                          return callTime >= monthStart.getTime() && callTime <= monthEnd.getTime();
                        });
                      }

                      if (filteredCalls.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32">
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

                      return filteredCalls.map((call) => {
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
                              <div className="font-medium">{call.leads?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{call.leads?.contact || 'N/A'}</div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {call.leads?.contact || 'N/A'}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <div>{new Date(call.created_at).toLocaleDateString('en-GB')}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(call.created_at).toLocaleTimeString('en-GB', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDispositionStyle(disposition)}`}>
                                {getDispositionLabel(disposition)}
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm">You</span>
                                <Button size="sm" variant="outline" className="gap-2" onClick={() => window.open(`/call/${call.id}`, '_blank')}>
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
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <EmployeeReportsPage />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <EmployeeAnalysisPage />
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <EmployeeProfilePage onBack={() => setSelectedTab("overview")} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Call Modal */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-blue-600" />
              Add Call Notes
            </DialogTitle>
            <DialogDescription>
              Add call notes for {selectedLead?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCall} className="space-y-4">
            <div>
              <Label htmlFor="callOutcomeStatus">Call Outcome *</Label>
              <Select value={callOutcomeStatus} onValueChange={(value: 'failed' | 'converted' | 'follow_up' | 'not_answered') => {
                setCallOutcomeStatus(value);
                // Fetch clients when converted is selected
                if (value === 'converted') {
                  supabase.from('clients').select('*').eq('company_id', userRole?.company_id).then(({ data }) => {
                    setClients(data || []);
                  });
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select call outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="failed">Rejected</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="not_answered">Not Answered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {callOutcomeStatus === 'converted' && (
              <>
                <div>
                  <Label htmlFor="selectedClient">Select Client *</Label>
                  <Select value={selectedClient} onValueChange={(value) => {
                    setSelectedClient(value);
                    // Fetch jobs for selected client
                    supabase.from('jobs').select('*').eq('client_id', value).eq('is_active', true).then(({ data }) => {
                      setJobs(data || []);
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="selectedJob">Select Job *</Label>
                  <Select value={selectedJob} onValueChange={setSelectedJob} disabled={!selectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map(job => (
                        <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="callOutcome">Call Notes *</Label>
              <Input
                id="callOutcome"
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                placeholder="How was the call? What was discussed?"
                required
              />
            </div>
            {callOutcomeStatus === 'follow_up' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nextFollowUpDate">Follow-up Date *</Label>
                  <Input
                    id="nextFollowUpDate"
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nextFollowUpTime">Follow-up Time *</Label>
                  <Input
                    id="nextFollowUpTime"
                    type="time"
                    value={nextFollowUpTime}
                    onChange={(e) => setNextFollowUpTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setCallOutcome("");
                setCallOutcomeStatus('follow_up');
                setNextFollowUpDate("");
                setNextFollowUpTime("");
                setSelectedClient("");
                setSelectedJob("");
                setSelectedLead(null);
                setIsCallModalOpen(false);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={!callOutcome.trim()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Call
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                <CheckCircle className="h-4 w-4 mr-2" />
                Get Analysis
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exotel Call Modal */}
      <Dialog open={isExotelCallModalOpen} onOpenChange={setIsExotelCallModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Make Call via Exotel
            </DialogTitle>
            <DialogDescription>
              Initiate a call to {selectedLead?.name} using Exotel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="fromNumber">From Number *</Label>
              <Select value={fromNumber} onValueChange={setFromNumber} disabled={isCallInProgress}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a phone number" />
                </SelectTrigger>
                <SelectContent>
                  {companySettings.from_numbers.map((number) => (
                    <SelectItem key={number} value={number}>
                      {number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Call Status Indicator */}
            {isCallInProgress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {callStatus === 'initiating' && 'Initiating call...'}
                      {callStatus === 'in-progress' && 'Call in progress...'}
                      {callStatus === 'ringing' && 'Ringing...'}
                      {callStatus === 'completed' && 'Call completed!'}
                    </p>
                    <p className="text-sm text-blue-700">
                      {callStatus === 'initiating' && 'Connecting to Exotel...'}
                      {callStatus === 'in-progress' && 'Calling ' + selectedLead?.name}
                      {callStatus === 'ringing' && 'Waiting for answer...'}
                      {callStatus === 'completed' && 'Please fill in call outcome'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={isCallInProgress ? handleCancelCall : () => setIsExotelCallModalOpen(false)}
                disabled={isCallInProgress && callStatus === 'completed'}
              >
                {isCallInProgress ? 'Cancel Call' : 'Cancel'}
              </Button>
              <Button
                onClick={handleExotelCall}
                disabled={!fromNumber || !selectedLead?.contact || isCallInProgress}
              >
                {isCallInProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calling...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </>
                )}
              </Button>
            </div>
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

      {/* Phone Dialer Modal */}
      <Dialog open={isDialerModalOpen} onOpenChange={setIsDialerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-green-600" />
              Phone Dialer
            </DialogTitle>
            <DialogDescription>
              Make calls to any number using Exotel
            </DialogDescription>
          </DialogHeader>
          <PhoneDialer onCallComplete={() => {
            setIsDialerModalOpen(false);
            fetchData(false);
          }} />
        </DialogContent>
      </Dialog>

      {/* Call details are now shown on a dedicated page (route /call/:callId) */}


    </div>
  );
}
