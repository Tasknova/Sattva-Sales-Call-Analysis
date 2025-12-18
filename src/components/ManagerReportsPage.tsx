import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Phone, 
  TrendingUp, 
  BarChart3,
  Download,
  User,
  Target,
  Award,
  Activity,
  ThumbsUp,
  MessageSquare
} from "lucide-react";

interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

export default function ManagerReportsPage() {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('this_month');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeStats, setEmployeeStats] = useState<Map<string, any>>(new Map());
  const [teamOverview, setTeamOverview] = useState<any>(null);

  useEffect(() => {
    if (userRole?.company_id) {
      fetchReportData();
    }
  }, [userRole, dateFilter, customDateRange]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (dateFilter === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'yesterday') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'this_week') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'this_month') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      startDate = new Date(customDateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customDateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const fetchReportData = async () => {
    if (!userRole?.company_id) {
      console.log('No company_id found in userRole:', userRole);
      return;
    }

    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      console.log('==================== MANAGER REPORTS DATA FETCH ====================');
      console.log('Fetching report data for company_id:', userRole.company_id);
      console.log('Manager user_id:', userRole.user_id);
      console.log('Date Filter:', dateFilter);
      console.log('Custom Date Range:', customDateRange);
      console.log('Date range:', { 
        startDate, 
        endDate,
        startDateLocal: new Date(startDate).toLocaleString(),
        endDateLocal: new Date(endDate).toLocaleString()
      });

      // Get manager's data
      const { data: managerData, error: managerError } = await supabase
        .from('managers')
        .select('id')
        .eq('user_id', userRole.user_id)
        .eq('company_id', userRole.company_id)
        .single();

      if (managerError) {
        console.error('Error fetching manager data:', managerError);
        return;
      }
      
      if (!managerData) {
        console.log('No manager data found for user_id:', userRole.user_id);
        return;
      }
      
      console.log('Manager data:', managerData);

      // Fetch employees under this manager (removed is_active filter)
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', userRole.company_id)
        .eq('manager_id', managerData.id);

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }
      
      console.log('Employees fetched:', employeesData?.length || 0, employeesData);

      // Filter active employees for display
      const activeEmployees = (employeesData || []).filter(emp => emp.is_active === true);
      setEmployees(activeEmployees);
      
      console.log('Active employees:', activeEmployees.length);

      const employeeIds = (employeesData || []).map(emp => emp.user_id);
      console.log('Employee user_ids:', employeeIds);

      // Fetch calls for the period
      const { data: callsData, error: callsError } = await supabase
        .from('call_history')
        .select('*')
        .in('employee_id', employeeIds)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (callsError) {
        console.error('Error fetching calls:', callsError);
        throw callsError;
      }
      
      console.log('Calls fetched:', callsData?.length || 0);
      console.log('Call details:', callsData?.map(c => ({
        id: c.id,
        employee_id: c.employee_id,
        outcome: c.outcome,
        created_at: c.created_at,
        created_at_local: new Date(c.created_at).toLocaleString()
      })));

      // Fetch analyses for the period (simplified query without join)
      const callIds = (callsData || []).map(call => call.id);
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .in('call_id', callIds);

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
        throw analysesError;
      }
      
      console.log('Analyses fetched:', analysesData?.length || 0, analysesData);
      
      // Create a map of call_id to employee_id for quick lookup
      const callIdToEmployeeMap = new Map();
      callsData?.forEach(call => {
        callIdToEmployeeMap.set(call.id, call.employee_id);
      });

      // Calculate stats for each employee
      const employeeStatsMap = new Map();
      employeesData?.forEach(employee => {
        const employeeCalls = callsData?.filter(call => call.employee_id === employee.user_id) || [];
        // Match analyses by checking if the call_id belongs to this employee
        const employeeAnalyses = analysesData?.filter(analysis => {
          const employeeId = callIdToEmployeeMap.get(analysis.call_id);
          return employeeId === employee.user_id;
        }) || [];

        const completedAnalyses = employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
        
        // Calculate talk time metrics
        // Filter calls >= 45 seconds for avg talk time
        const validCallsForAvg = employeeCalls.filter(call => (call.exotel_duration || 0) >= 45);
        const totalTalkTimeSeconds = employeeCalls.reduce((sum, call) => sum + (Number(call.exotel_duration) || 0), 0);
        const avgTalkTimeSeconds = validCallsForAvg.length > 0 
          ? validCallsForAvg.reduce((sum, call) => sum + (Number(call.exotel_duration) || 0), 0) / validCallsForAvg.length 
          : 0;
        
        // Format talk time as MM:SS
        const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        employeeStatsMap.set(employee.id, {
          total_calls: employeeCalls.length,
          completed_calls: employeeCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length,
          total_relevant: employeeCalls.filter(c => (c.exotel_duration || 0) >= 30).length,
          total_irrelevant: employeeCalls.filter(c => (c.exotel_duration || 0) < 30).length,
          total_analyzed: completedAnalyses.length,
          avg_talk_time: formatTime(avgTalkTimeSeconds),
          total_talk_time: formatTime(totalTalkTimeSeconds),
          success_rate: employeeCalls.length > 0 ? 
            ((employeeCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length / employeeCalls.length) * 100).toFixed(1) : 0,
          avg_call_quality: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.call_quality_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_closure_probability: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.closure_probability) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_script_adherence: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.script_adherence) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_compliance_score: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.compilience_expections_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_sentiment: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.sentiment_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_engagement: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.engagement_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_confidence: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + ((parseFloat(a.confidence_score_executive) + parseFloat(a.confidence_score_person)) / 2 || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          total_analyses: completedAnalyses.length
        });
      });

      setEmployeeStats(employeeStatsMap);

      // Team overview
      const totalCalls = callsData?.length || 0;
      const completedCalls = callsData?.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length || 0;
      const allCompletedAnalyses = analysesData?.filter(a => a.status?.toLowerCase() === 'completed') || [];

      console.log('Total calls in period:', totalCalls);
      console.log('Completed calls:', completedCalls);
      console.log('All calls outcomes:', callsData?.map(c => c.outcome));
      console.log('Active employees for overview:', activeEmployees.length);

      const overview = {
        total_employees: activeEmployees.length,
        total_calls: totalCalls,
        completed_calls: completedCalls,
        success_rate: totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : 0,
        avg_call_quality: allCompletedAnalyses.length > 0 ?
          (allCompletedAnalyses.reduce((sum, a) => sum + (parseFloat(a.call_quality_score) || 0), 0) / allCompletedAnalyses.length).toFixed(1) : 0,
        avg_script_adherence: allCompletedAnalyses.length > 0 ?
          (allCompletedAnalyses.reduce((sum, a) => sum + (parseFloat(a.script_adherence) || 0), 0) / allCompletedAnalyses.length).toFixed(1) : 0,
        total_analyses: allCompletedAnalyses.length
      };
      
      console.log('==================== TEAM OVERVIEW ====================');
      console.log('Team Overview:', overview);
      console.log('=======================================================');
      setTeamOverview(overview);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    let csv = `Manager Report - Team Performance\n`;
    csv += `Period: ${dateFilter.replace('_', ' ').toUpperCase()}\n`;
    if (dateFilter === 'custom') {
      csv += `Date Range: ${customDateRange.startDate} to ${customDateRange.endDate}\n\n`;
    } else {
      csv += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;
    }
    
    csv += `Team Overview\n`;
    csv += `Total Employees,${teamOverview?.total_employees}\n`;
    csv += `Total Calls,${teamOverview?.total_calls}\n`;
    csv += `Success Rate,${teamOverview?.success_rate}%\n\n`;

    csv += `Employee Performance\n`;
    csv += `Employee Name,Email,Total Calls,Completed,Total Relevant,Total Irrelevant,Total Analyzed,Avg Talk Time,Total Talk Time,Avg Call Quality,Avg Closure Probability,Avg Script Adherence,Avg Compliance Score\n`;
    employees.forEach(employee => {
      const stats = employeeStats.get(employee.id);
      csv += `${employee.full_name},${employee.email},${stats?.total_calls || 0},${stats?.completed_calls || 0},${stats?.total_relevant || 0},${stats?.total_irrelevant || 0},${stats?.total_analyzed || 0},${stats?.avg_talk_time || '0:00'},${stats?.total_talk_time || '0:00'},${stats?.avg_call_quality || 0},${stats?.avg_closure_probability || 0},${stats?.avg_script_adherence || 0},${stats?.avg_compliance_score || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `manager-report-${dateFilter}-${today}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Team Reports</h2>
          <p className="text-muted-foreground">Employee performance metrics and insights</p>
        </div>
        <Button onClick={exportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Time Period</label>
                <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamOverview?.total_employees || 0}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamOverview?.total_calls || 0}</div>
            <p className="text-xs text-green-600 font-medium">
              {teamOverview?.completed_calls || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamOverview?.success_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">Connected calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamOverview?.total_analyses || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Avg Call Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{teamOverview?.avg_call_quality || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Average across all analyzed calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Avg Script Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{teamOverview?.avg_script_adherence || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Average across all analyzed calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Employee Performance Details
          </CardTitle>
          <CardDescription>Comprehensive performance metrics for each team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.filter(e => e.is_active === true).map(employee => {
              const stats = employeeStats.get(employee.id);
              const performanceScore = parseFloat(stats?.success_rate || '0');
              
              return (
                <div key={employee.id} className="border rounded-lg p-4">
                  {/* Employee Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{employee.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={performanceScore >= 50 ? "default" : "secondary"}>
                        {performanceScore >= 70 ? 'High Performer' : performanceScore >= 40 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{stats?.total_calls || 0}</div>
                      <p className="text-xs text-blue-600 font-medium">Total Calls</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{stats?.completed_calls || 0}</div>
                      <p className="text-xs text-green-600 font-medium">Completed</p>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-teal-600">{stats?.total_relevant || 0}</div>
                      <p className="text-xs text-teal-600 font-medium">Total Relevant</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-orange-600">{stats?.total_irrelevant || 0}</div>
                      <p className="text-xs text-orange-600 font-medium">Total Irrelevant</p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-indigo-600">{stats?.total_analyzed || 0}</div>
                      <p className="text-xs text-indigo-600 font-medium">Total Analyzed</p>
                    </div>
                    <div className="bg-cyan-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-cyan-600">{stats?.avg_talk_time || '0:00'}</div>
                      <p className="text-xs text-cyan-600 font-medium">Avg Talk Time</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">{stats?.total_talk_time || '0:00'}</div>
                      <p className="text-xs text-purple-600 font-medium">Total Talk Time</p>
                    </div>
                  </div>

                  {/* Analysis Metrics */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">Call Quality Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{stats?.avg_call_quality || 0}</div>
                        <p className="text-xs text-muted-foreground">Avg Call Quality</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{stats?.avg_closure_probability || 0}</div>
                        <p className="text-xs text-muted-foreground">Avg Closure Probability</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{stats?.avg_script_adherence || 0}</div>
                        <p className="text-xs text-muted-foreground">Avg Script Adherence</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{stats?.avg_compliance_score || 0}</div>
                        <p className="text-xs text-muted-foreground">Avg Compliance Score</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {employees.filter(e => e.is_active === true).length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active employees found in your team</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

