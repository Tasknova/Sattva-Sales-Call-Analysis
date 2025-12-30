import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Search, Filter, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, BarChart3, Calendar, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";

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
  closure_probability?: number;
  candidate_acceptance_risk?: string;
  created_at: string;
  recordings?: {
    id: string;
    file_name: string;
    recording_url: string;
  };
  call_history?: {
    call_date?: string;
    lead_id?: string;
    outcome?: string;
  };
}

export default function EmployeeAnalysisPage() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'date' | 'closure'>('date');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'specific'>('all');
  const [specificDate, setSpecificDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const fetchAnalyses = async () => {
      setLoading(true);
      try {
        // Determine the correct user id to filter analyses by (use userRole.user_id when available)
        const filterUserId = userRole?.user_id || user?.id;

        // 1) Primary attempt: fetch analyses where analyses.user_id = employee user id
        const { data, error } = await supabase
          .from('analyses')
          .select(`*, recordings (id, file_name, recording_url, call_history_id)`) 
          .eq('user_id', filterUserId);

        if (!error && data && data.length > 0) {
          // Enrich analyses with call_history details by fetching call_history rows referenced by recordings.call_history_id
          const callHistoryIds = Array.from(new Set(
            data
              .map((a: any) => a.recordings?.call_history_id)
              .filter(Boolean)
          ));

          let callHistoryMap: Record<string, any> = {};
          if (callHistoryIds.length > 0) {
            const { data: callsData, error: callsErr } = await supabase
              .from('call_history')
              .select('id, call_date, lead_id, outcome, leads(name)')
              .in('id', callHistoryIds as any[]);

            if (!callsErr && callsData) {
              callHistoryMap = Object.fromEntries(callsData.map((c: any) => [c.id, c]));
            }
          }

          const enriched = (data as any[]).map((a: any) => ({
            ...a,
            call_history: a.recordings?.call_history_id ? callHistoryMap[a.recordings.call_history_id] : undefined,
          }));

          setAnalyses(enriched || []);
          return;
        }

        // 2) Fallback: find analyses by recordings linked to this employee's call_history
        // Fetch call_history ids for this employee (call_history.employee_id stores user_id)
        const { data: calls, error: callsError } = await supabase
          .from('call_history')
          .select('id')
          .eq('employee_id', filterUserId);

        if (callsError || !calls || calls.length === 0) {
          // no calls -> no analyses
          setAnalyses([]);
          return;
        }

        const callIds = calls.map((c: any) => c.id);

        // Find recordings that reference these call_history ids
        const { data: recordings, error: recError } = await supabase
          .from('recordings')
          .select('id')
          .in('call_history_id', callIds);

        if (recError || !recordings || recordings.length === 0) {
          setAnalyses([]);
          return;
        }

        const recordingIds = recordings.map((r: any) => r.id);

        // Finally fetch analyses whose recording_id is in these recordingIds
        const { data: fallbackAnalyses, error: fallbackError } = await supabase
          .from('analyses')
          .select(`*, recordings (id, file_name, recording_url, call_history_id)`)
          .in('recording_id', recordingIds)
          .order('created_at', { ascending: false });

        if (!fallbackError && fallbackAnalyses) {
          const callHistoryIds = Array.from(new Set(
            fallbackAnalyses
              .map((a: any) => a.recordings?.call_history_id)
              .filter(Boolean)
          ));

          let callHistoryMap: Record<string, any> = {};
          if (callHistoryIds.length > 0) {
            const { data: callsData, error: callsErr } = await supabase
              .from('call_history')
              .select('id, call_date, lead_id, outcome, leads(name)')
              .in('id', callHistoryIds as any[]);

            if (!callsErr && callsData) {
              callHistoryMap = Object.fromEntries(callsData.map((c: any) => [c.id, c]));
            }
          }

          const enriched = (fallbackAnalyses as any[]).map((a: any) => ({
            ...a,
            call_history: a.recordings?.call_history_id ? callHistoryMap[a.recordings.call_history_id] : undefined,
          }));

          setAnalyses(enriched || []);
        } else {
          console.error('Error fetching fallback analyses:', fallbackError);
          setAnalyses([]);
        }
      } catch (err) {
        console.error('Error fetching analyses:', err);
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id || userRole?.user_id) fetchAnalyses();
  }, [user?.id]);

  // Filter and sort analyses
  const filteredAnalyses = useMemo(() => {
    return analyses
      .filter((analysis) => {
        // Search filter
        const leadName = analysis.call_history?.leads?.name?.toLowerCase() || '';
        const matchesSearch = leadName.includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter;

        // Date filter
        let matchesDate = true;
        const analysisDate = analysis.created_at ? new Date(analysis.created_at) : null;
        
        if (analysisDate) {
          const today = new Date();
          
          switch (dateFilter) {
            case 'today':
              matchesDate = isToday(analysisDate);
              break;
            case 'yesterday':
              matchesDate = isYesterday(analysisDate);
              break;
            case 'this_week':
              matchesDate = isWithinInterval(analysisDate, {
                start: startOfWeek(today, { weekStartsOn: 1 }),
                end: endOfWeek(today, { weekStartsOn: 1 })
              });
              break;
            case 'this_month':
              matchesDate = isWithinInterval(analysisDate, {
                start: startOfMonth(today),
                end: endOfMonth(today)
              });
              break;
            case 'specific':
              if (specificDate) {
                matchesDate = isWithinInterval(analysisDate, {
                  start: startOfDay(specificDate),
                  end: endOfDay(specificDate)
                });
              }
              break;
            default:
              matchesDate = true;
          }
        }

        return matchesSearch && matchesDate && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortBy === 'closure') {
          return (b.closure_probability || 0) - (a.closure_probability || 0);
        }
        return 0;
      });
  }, [analyses, searchTerm, dateFilter, specificDate, sortBy, statusFilter]);

  // Calculate statistics
  const totalAnalyses = analyses.length;
  const avgClosure = analyses.length > 0 
    ? analyses.reduce((sum, a) => sum + (a.closure_probability || 0), 0) / analyses.length 
    : 0;
  const completedCount = analyses.filter(a => a.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading your call analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Analyses</h1>
          <p className="text-muted-foreground mt-1">Track and analyze your call performance</p>
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
                  <p className="text-3xl font-bold text-purple-900 mt-1">{totalAnalyses}</p>
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
                  <p className="text-3xl font-bold text-green-900 mt-1">{Math.round(avgClosure)}%</p>
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
                  <p className="text-sm font-medium text-blue-700">Completed</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{completedCount}</p>
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
          <div className="flex flex-col gap-4">
            {/* Search and Sort Row */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by lead name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'date' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('date')}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Date
                </Button>
                <Button
                  variant={sortBy === 'closure' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('closure')}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Closure
                </Button>
              </div>
            </div>

            {/* Date Filters Row */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-600 mr-2">
                <CalendarDays className="h-4 w-4 inline mr-1" />
                Filter by:
              </span>
              <Button
                variant={dateFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('all');
                  setSpecificDate(undefined);
                }}
              >
                All
              </Button>
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('today');
                  setSpecificDate(undefined);
                }}
              >
                Today
              </Button>
              <Button
                variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('yesterday');
                  setSpecificDate(undefined);
                }}
              >
                Yesterday
              </Button>
              <Button
                variant={dateFilter === 'this_week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('this_week');
                  setSpecificDate(undefined);
                }}
              >
                This Week
              </Button>
              <Button
                variant={dateFilter === 'this_month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('this_month');
                  setSpecificDate(undefined);
                }}
              >
                This Month
              </Button>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateFilter === 'specific' ? 'default' : 'outline'}
                    size="sm"
                    className="min-w-[120px]"
                  >
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {dateFilter === 'specific' && specificDate 
                      ? format(specificDate, 'MMM dd, yyyy')
                      : 'Pick Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={specificDate}
                    onSelect={(date) => {
                      setSpecificDate(date);
                      setDateFilter('specific');
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyses List */}
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
                    ? 'Your call analyses will appear here once available' 
                    : 'Try adjusting your search or filters'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAnalyses.map((analysis) => {
            const closureProbability = analysis.closure_probability || 0;
            const callDate = analysis.call_history?.call_date 
              ? new Date(analysis.call_history.call_date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })
              : 'N/A';

            return (
              <Card key={analysis.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    {/* Left Section - Lead Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {analysis.call_history?.leads?.name || 'Unknown Lead'}
                        </h3>
                        <Badge 
                          variant={analysis.status === 'completed' ? 'default' : 'outline'}
                          className="capitalize"
                        >
                          {analysis.status}
                        </Badge>
                      </div>

                      {/* Metrics Row */}
                      <div className="mb-4">
                        {/* Closure Probability */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Closure Probability</p>
                          <div className="flex items-center gap-2">
                            <Progress value={closureProbability} className="h-2 flex-1" />
                            <span className="text-sm font-bold text-green-600 min-w-[40px]">
                              {Math.round(closureProbability)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{callDate}</span>
                      </div>
                    </div>

                    {/* Right Section - Action Button */}
                    <Button
                      onClick={() => navigate(`/analysis/${analysis.id}`)}
                      className="ml-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
