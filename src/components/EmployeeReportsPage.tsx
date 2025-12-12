import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Phone, 
  TrendingUp, 
  BarChart3,
  Download,
  Target,
  Activity,
  ThumbsUp,
  MessageSquare,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export default function EmployeeReportsPage() {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [customFromDate, setCustomFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [customToDate, setCustomToDate] = useState(new Date().toISOString().split('T')[0]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [callsBreakdown, setCallsBreakdown] = useState<any[]>([]);

  useEffect(() => {
    if (userRole?.user_id) {
      fetchReportData();
    }
  }, [userRole, timePeriod, selectedDate, customFromDate, customToDate]);

  const getDateRange = () => {
    const now = new Date();
    let startDateStr: string;
    let endDateStr: string;

    if (timePeriod === 'custom') {
      // Use custom date range - just the date part
      startDateStr = customFromDate;
      endDateStr = customToDate;
    } else if (timePeriod === 'today') {
      // Today only - just the date part
      const todayStr = now.toISOString().split('T')[0];
      startDateStr = todayStr;
      endDateStr = todayStr;
    } else if (timePeriod === 'yesterday') {
      // Yesterday only
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      startDateStr = yStr;
      endDateStr = yStr;
    } else if (timePeriod === 'week') {
      // This week (Monday to Friday)
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysFromMonday);
      startDateStr = monday.toISOString().split('T')[0];
      
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      endDateStr = friday.toISOString().split('T')[0];
    } else {
      // This month
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      startDateStr = firstDay.toISOString().split('T')[0];
      
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDateStr = lastDay.toISOString().split('T')[0];
    }

    return { startDate: startDateStr, endDate: endDateStr };
  };

  const fetchReportData = async () => {
    if (!userRole?.user_id) {
      console.log('No user_id found in userRole:', userRole);
      return;
    }

    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      console.log('==================== EMPLOYEE REPORTS DATA FETCH ====================');
      console.log('User Role:', userRole);
      console.log('Fetching report data for employee user_id:', userRole.user_id);
      console.log('Company ID:', userRole.company_id);
      console.log('Time Period:', timePeriod);
      console.log('Date range (YYYY-MM-DD):', { 
        startDate, 
        endDate
      });
      
      // Verify employee exists in database
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('id, user_id, full_name, email, company_id, manager_id, is_active')
        .eq('user_id', userRole.user_id)
        .single();
      
      if (empError) {
        console.error('Error fetching employee data:', empError);
      } else {
        console.log('Employee data:', employeeData);
      }

      // Fetch all calls for this employee (same as dashboard)
      const { data: callsData, error: callsError } = await supabase
        .from('call_history')
        .select('*')
        .eq('employee_id', userRole.user_id)
        .order('created_at', { ascending: false });

      if (callsError) {
        console.error('Error fetching calls:', callsError);
        throw callsError;
      }
      
      console.log('All calls fetched:', callsData?.length || 0);
      console.log('Filtering by date range:', { startDate, endDate });
      
      // Filter calls by date range client-side
      const filteredCallsData = callsData?.filter(call => {
        if (!call.call_date) {
          console.log('Call without date:', call.id);
          return false;
        }
        const callDate = new Date(call.call_date);
        const callDateStr = callDate.toISOString().split('T')[0];
        const matches = callDateStr >= startDate && callDateStr <= endDate;
        console.log(`Call ${call.id}: date=${callDateStr}, matches=${matches}`);
        return matches;
      }) || [];
      
      console.log('Calls after date filter:', filteredCallsData.length);
      console.log('Filtered call outcomes:', filteredCallsData.map(c => c.outcome));
      
      // Fetch lead details separately for better error handling
      const leadIds = filteredCallsData.map(c => c.lead_id).filter(Boolean);
      let leadsMap = new Map();
      
      if (leadIds.length > 0) {
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id, name, email, contact')
          .in('id', leadIds);
        
        if (leadsError) {
          console.error('Error fetching leads:', leadsError);
        } else if (leadsData) {
          leadsData.forEach(lead => {
            leadsMap.set(lead.id, lead);
          });
          console.log('Leads fetched:', leadsData.length);
        }
      }
      
      // Attach lead info to calls
      const callsWithLeads = filteredCallsData.map(call => ({
        ...call,
        leads: call.lead_id ? leadsMap.get(call.lead_id) : null
      }));

      // Fetch all analyses for the employee
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userRole.user_id);

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
      }
      
      console.log('Analyses fetched:', analysesData?.length || 0);

      // Calculate performance metrics
      const totalCalls = callsWithLeads.length;
      const completedCalls = callsWithLeads.filter(c => c.outcome === 'completed').length;
      const notAnsweredCalls = callsWithLeads.filter(c => c.outcome === 'no-answer').length;
      const failedCalls = callsWithLeads.filter(c => c.outcome === 'Failed').length;
      const busyCalls = callsWithLeads.filter(c => c.outcome === 'busy').length;

      console.log('Total calls in period:', totalCalls);
      console.log('Completed calls:', completedCalls);
      console.log('Not answered calls:', notAnsweredCalls);
      console.log('Failed calls:', failedCalls);
      console.log('Busy calls:', busyCalls);
      console.log('All calls outcomes:', callsWithLeads.map(c => c.outcome));

      const completedAnalyses = (analysesData || []);
      
      console.log('Completed analyses:', completedAnalyses.length);

      // Calculate metrics from analyses table: closure probability, candidate risk, recruiter confidence, recruiter score
      const avgClosureProbability = completedAnalyses.length > 0 ?
        (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.closure_probability) || 0), 0) / completedAnalyses.length).toFixed(1) : '0';
      
      // candidate_acceptance_risk is stored as numeric (0-100), higher means more risk
      const avgCandidateRisk = completedAnalyses.length > 0 ?
        (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.candidate_acceptance_risk) || 0), 0) / completedAnalyses.length).toFixed(1) : '0';
      
      const avgRecruiterConfidence = completedAnalyses.length > 0 ?
        (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.recruiter_confidence_score) || 0), 0) / completedAnalyses.length).toFixed(1) : '0';
      
      const avgRecruiterScore = completedAnalyses.length > 0 ?
        (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.recruiter_process_score) || 0), 0) / completedAnalyses.length).toFixed(1) : '0';

      const perfData = {
        total_calls: totalCalls,
        completed_calls: completedCalls,
        not_answered_calls: notAnsweredCalls,
        failed_calls: failedCalls,
        busy_calls: busyCalls,
        conversion_rate: totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : 0,
        avg_closure_probability: avgClosureProbability,
        avg_candidate_risk: avgCandidateRisk,
        avg_recruiter_confidence: avgRecruiterConfidence,
        avg_recruiter_score: avgRecruiterScore,
        total_analyses: completedAnalyses.length,
        calls: callsWithLeads || []
      };
      
      console.log('==================== EMPLOYEE PERFORMANCE DATA ====================');
      console.log('Performance Data:', perfData);
      console.log('===================================================================');
      
      setPerformanceData(perfData);

      // Set calls breakdown for detailed view
      setCallsBreakdown(callsWithLeads || []);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    let csv = `Employee Performance Report\n`;
    csv += `Period: ${timePeriod.toUpperCase()}\n`;
    csv += `Date: ${selectedDate}\n\n`;
    
    csv += `Performance Summary\n`;
    csv += `Total Calls,${performanceData?.total_calls}\n`;
    csv += `Completed Calls,${performanceData?.completed_calls}\n`;
    csv += `Conversion Rate,${performanceData?.conversion_rate}%\n`;
    csv += `Avg Sentiment,${performanceData?.avg_sentiment}%\n`;
    csv += `Avg Engagement,${performanceData?.avg_engagement}%\n\n`;

    csv += `Call Details\n`;
    csv += `Date,Lead Name,Lead Contact,Outcome,Notes\n`;
    callsBreakdown.forEach(call => {
      csv += `${new Date(call.created_at).toLocaleDateString()},${call.leads?.name || 'N/A'},${call.leads?.contact || 'N/A'},${call.outcome},${call.notes?.replace(/,/g, ';') || 'N/A'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-performance-report-${timePeriod}-${selectedDate}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const performanceScore = parseFloat(performanceData?.conversion_rate || '0');
  const performanceLevel = performanceScore >= 70 ? 'Excellent' : performanceScore >= 50 ? 'Good' : performanceScore >= 30 ? 'Average' : 'Needs Improvement';
  const performanceColor = performanceScore >= 70 ? 'text-green-600' : performanceScore >= 50 ? 'text-blue-600' : performanceScore >= 30 ? 'text-orange-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Performance Reports</h2>
          <p className="text-muted-foreground">Track your call performance and improvement areas</p>
        </div>
        <Button onClick={exportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={timePeriod} onValueChange={(value: any) => setTimePeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {timePeriod === 'custom' && (
              <>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">From Date</label>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    max={customToDate}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">To Date</label>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    min={customFromDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Score */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-5xl font-bold ${performanceColor}`}>
                {performanceData?.conversion_rate || 0}%
              </div>
              <p className="text-lg text-muted-foreground mt-2">Conversion Rate</p>
            </div>
            <div className="text-right">
              <Badge variant={performanceScore >= 50 ? "default" : "secondary"} className="text-lg px-4 py-2">
                {performanceLevel}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">Performance Level</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.total_calls || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All calls made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Connected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{performanceData?.completed_calls || 0}</div>
            <p className="text-xs text-green-600 mt-1">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Answered (FollowUps)</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{performanceData?.not_answered_calls || 0}</div>
            <p className="text-xs text-orange-600 mt-1">Follow-ups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{performanceData?.failed_calls || 0}</div>
            <p className="text-xs text-red-600 mt-1">Failed calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busy</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{performanceData?.busy_calls || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Line busy</p>
          </CardContent>
        </Card>
      </div>

      {/* Call Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Call Quality Metrics
          </CardTitle>
          <CardDescription>AI-analyzed metrics from your completed calls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-600">{performanceData?.avg_closure_probability || 0}%</div>
              <p className="text-sm text-blue-600 font-medium mt-1">Avg Closure Prob</p>
              <p className="text-xs text-muted-foreground mt-1">Deal closure likelihood</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Activity className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-red-600">{performanceData?.avg_candidate_risk || 0}%</div>
              <p className="text-sm text-red-600 font-medium mt-1">Avg Candidate Risk</p>
              <p className="text-xs text-muted-foreground mt-1">Risk of rejection</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600">{performanceData?.avg_recruiter_confidence || 0}/10</div>
              <p className="text-sm text-green-600 font-medium mt-1">Avg Recruiter Confidence</p>
              <p className="text-xs text-muted-foreground mt-1">Confidence level</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <ThumbsUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-600">{performanceData?.avg_recruiter_score || 0}/10</div>
              <p className="text-sm text-purple-600 font-medium mt-1">Avg Recruiter Score</p>
              <p className="text-xs text-muted-foreground mt-1">Process quality</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Call Activity
          </CardTitle>
          <CardDescription>Your latest call records in this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {callsBreakdown.slice(0, 5).map(call => (
              <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{call.leads?.name || 'Lead'}</p>
                  <p className="text-sm text-muted-foreground">{call.leads?.contact}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(call.created_at).toLocaleDateString()} at {new Date(call.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant={
                  call.outcome === 'completed' || call.outcome === 'converted' ? 'default' :
                  call.outcome === 'follow_up' ? 'secondary' :
                  'destructive'
                }>
                  {call.outcome?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            ))}
            {callsBreakdown.length === 0 && (
              <div className="text-center py-8">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No calls found for this period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

