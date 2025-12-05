import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const { user, userRole } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analyses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Call Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No analyses found</div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div key={analysis.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">Lead: {analysis.call_history?.leads?.name || 'Unknown'}</div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-xl font-semibold text-green-600">{typeof analysis.closure_probability === 'number' ? `${Math.round(analysis.closure_probability)}%` : '—'}</span>
                      <span className="text-lg font-medium text-red-600">{analysis.candidate_acceptance_risk || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/analysis/${analysis.id}`, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
