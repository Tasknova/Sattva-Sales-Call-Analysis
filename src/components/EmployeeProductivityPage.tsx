import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Clock, 
  TrendingUp, 
  Users, 
  PhoneCall,
  Target,
  Calendar,
  LogIn,
  LogOut
} from "lucide-react";

interface EmployeeProductivity {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  avg_login_time: string;
  avg_logout_time: string;
  avg_work_hours: number;
  avg_productivity_score: number;
  total_profiles_downloaded: number;
  total_calls_made: number;
  total_calls_converted: number;
  total_calls_follow_up: number;
  conversion_rate: number;
  days_worked: number;
}

interface EmployeeProductivityPageProps {
  managerId: string;
}

const EmployeeProductivityPage = ({ managerId }: EmployeeProductivityPageProps) => {
  const [employeeStats, setEmployeeStats] = useState<EmployeeProductivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeProductivity();
  }, [managerId]);

  const fetchEmployeeProductivity = async () => {
    try {
      setLoading(true);

      // Fetch employee productivity data for current week (Nov 24-28, 2025)
      const { data: productivityData, error } = await supabase
        .from('employee_daily_productivity')
        .select(`
          employee_id,
          login_time,
          logout_time,
          work_hours,
          productivity_score,
          profiles_downloaded,
          calls_made,
          calls_converted,
          calls_follow_up,
          date
        `)
        .eq('manager_id', managerId)
        .gte('date', '2025-11-24')
        .lte('date', '2025-11-28');

      if (error) throw error;

      // Group by employee and calculate averages
      const employeeMap = new Map<string, any>();

      for (const record of productivityData || []) {
        if (!employeeMap.has(record.employee_id)) {
          employeeMap.set(record.employee_id, {
            employee_id: record.employee_id,
            login_times: [],
            logout_times: [],
            work_hours: [],
            productivity_scores: [],
            total_profiles_downloaded: 0,
            total_calls_made: 0,
            total_calls_converted: 0,
            total_calls_follow_up: 0,
            days_worked: 0
          });
        }

        const emp = employeeMap.get(record.employee_id);
        if (record.login_time) emp.login_times.push(record.login_time);
        if (record.logout_time) emp.logout_times.push(record.logout_time);
        if (record.work_hours) emp.work_hours.push(parseFloat(record.work_hours));
        if (record.productivity_score) emp.productivity_scores.push(parseFloat(record.productivity_score));
        emp.total_profiles_downloaded += record.profiles_downloaded || 0;
        emp.total_calls_made += record.calls_made || 0;
        emp.total_calls_converted += record.calls_converted || 0;
        emp.total_calls_follow_up += record.calls_follow_up || 0;
        emp.days_worked++;
      }

      // Fetch employee names
      const employeeIds = Array.from(employeeMap.keys());
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, email')
        .in('id', employeeIds);

      if (empError) throw empError;

      // Calculate averages and prepare final data
      const stats: EmployeeProductivity[] = [];

      for (const emp of employeeMap.values()) {
        const employee = employees?.find(e => e.id === emp.employee_id);
        
        // Calculate average login time
        const avgLoginMinutes = emp.login_times.reduce((sum: number, time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          return sum + (hours * 60 + minutes);
        }, 0) / emp.login_times.length;
        const loginHours = Math.floor(avgLoginMinutes / 60);
        const loginMins = Math.round(avgLoginMinutes % 60);
        const avg_login_time = `${loginHours.toString().padStart(2, '0')}:${loginMins.toString().padStart(2, '0')}`;

        // Calculate average logout time
        const avgLogoutMinutes = emp.logout_times.reduce((sum: number, time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          return sum + (hours * 60 + minutes);
        }, 0) / emp.logout_times.length;
        const logoutHours = Math.floor(avgLogoutMinutes / 60);
        const logoutMins = Math.round(avgLogoutMinutes % 60);
        const avg_logout_time = `${logoutHours.toString().padStart(2, '0')}:${logoutMins.toString().padStart(2, '0')}`;

        // Calculate other averages
        const avg_work_hours = emp.work_hours.reduce((a: number, b: number) => a + b, 0) / emp.work_hours.length;
        const avg_productivity_score = emp.productivity_scores.reduce((a: number, b: number) => a + b, 0) / emp.productivity_scores.length;
        const conversion_rate = emp.total_calls_made > 0 
          ? (emp.total_calls_converted / emp.total_calls_made) * 100 
          : 0;

        stats.push({
          employee_id: emp.employee_id,
          employee_name: employee?.full_name || 'Unknown',
          employee_email: employee?.email || '',
          avg_login_time,
          avg_logout_time,
          avg_work_hours,
          avg_productivity_score,
          total_profiles_downloaded: emp.total_profiles_downloaded,
          total_calls_made: emp.total_calls_made,
          total_calls_converted: emp.total_calls_converted,
          total_calls_follow_up: emp.total_calls_follow_up,
          conversion_rate,
          days_worked: emp.days_worked
        });
      }

      // Sort by productivity score (descending)
      stats.sort((a, b) => b.avg_productivity_score - a.avg_productivity_score);

      setEmployeeStats(stats);
    } catch (error) {
      console.error('Error fetching employee productivity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading employee productivity data...</p>
        </div>
      </div>
    );
  }

  // Calculate team averages
  const teamAvgScore = employeeStats.length > 0
    ? employeeStats.reduce((sum, emp) => sum + emp.avg_productivity_score, 0) / employeeStats.length
    : 0;
  
  const teamAvgWorkHours = employeeStats.length > 0
    ? employeeStats.reduce((sum, emp) => sum + emp.avg_work_hours, 0) / employeeStats.length
    : 0;

  const teamTotalCalls = employeeStats.reduce((sum, emp) => sum + emp.total_calls_made, 0);
  const teamTotalConversions = employeeStats.reduce((sum, emp) => sum + emp.total_calls_converted, 0);
  const teamConversionRate = teamTotalCalls > 0 ? (teamTotalConversions / teamTotalCalls) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Employee Productivity</h2>
        <p className="text-muted-foreground">Monitor and analyze your team's performance metrics</p>
      </div>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium mb-1">Team Avg Score</p>
                <p className="text-3xl font-bold text-blue-900">{teamAvgScore.toFixed(1)}</p>
              </div>
              <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium mb-1">Conversion Rate</p>
                <p className="text-3xl font-bold text-green-900">{teamConversionRate.toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium mb-1">Total Calls</p>
                <p className="text-3xl font-bold text-purple-900">{teamTotalCalls}</p>
              </div>
              <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
                <PhoneCall className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium mb-1">Avg Work Hours</p>
                <p className="text-3xl font-bold text-orange-900">{teamAvgWorkHours.toFixed(1)}h</p>
              </div>
              <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Productivity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance Metrics</CardTitle>
          <CardDescription>Detailed productivity statistics for each team member (Nov 24-28, 2025)</CardDescription>
        </CardHeader>
        <CardContent>
          {employeeStats.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">No employee productivity data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <LogIn className="h-4 w-4" />
                        Avg Login
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <LogOut className="h-4 w-4" />
                        Avg Logout
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4" />
                        Work Hours
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Profiles</TableHead>
                    <TableHead className="text-center">Calls</TableHead>
                    <TableHead className="text-center">Converted</TableHead>
                    <TableHead className="text-center">Conversion</TableHead>
                    <TableHead className="text-center">Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeStats.map((emp) => (
                    <TableRow key={emp.employee_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {getInitials(emp.employee_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{emp.employee_name}</div>
                            <div className="text-xs text-muted-foreground">{emp.employee_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getScoreBadgeColor(emp.avg_productivity_score)} text-white`}>
                          {emp.avg_productivity_score.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {emp.avg_login_time}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {emp.avg_logout_time}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {emp.avg_work_hours.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-center">{emp.total_profiles_downloaded}</TableCell>
                      <TableCell className="text-center font-semibold">{emp.total_calls_made}</TableCell>
                      <TableCell className="text-center text-green-700 font-semibold">
                        {emp.total_calls_converted}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={emp.conversion_rate >= 30 ? "default" : "secondary"}>
                          {emp.conversion_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {emp.days_worked}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeProductivityPage;
