import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Mic, TrendingUp, Star, Target, AlertTriangle, CheckCircle, Award, Shield, Phone, Activity, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, Analysis, Recording } from "@/lib/supabase";

export default function AnalysisDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysisAndRecording = async () => {
      if (!id || !user) return;

      try {
        // Fetch analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from('analyses')
          .select('*')
          .eq('id', id)
          .single();

        if (analysisError) throw analysisError;

        // Fetch recording
        const { data: recordingData, error: recordingError } = await supabase
          .from('recordings')
          .select('*')
          .eq('id', analysisData.recording_id)
          .single();

        if (recordingError) throw recordingError;

        setAnalysis(analysisData);
        setRecording(recordingData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisAndRecording();
  }, [id, user]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-accent-blue";
    return "text-warning";
  };

  const getRiskColor = (risk: string) => {
    const lowerRisk = risk?.toLowerCase() || '';
    if (lowerRisk.includes('low')) return "text-success";
    if (lowerRisk.includes('medium') || lowerRisk.includes('moderate')) return "text-warning";
    return "text-red-500";
  };

  const getRiskBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score < 30) return "default";
    if (score < 60) return "secondary";
    return "destructive";
  };

  const getRiskLabel = (score: number): string => {
    if (score < 30) return "Low Risk";
    if (score < 60) return "Medium Risk";
    return "High Risk";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-blue mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis || !recording) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Analysis Not Found</h1>
          <p className="text-muted-foreground mt-2">The requested analysis could not be found.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/?tab=analysis')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analysis
            </Button>
            <img 
              src="/Sattva_logo.png" 
              alt="Sattva" 
              className="h-8 w-auto"
              onError={(e) => {
                e.currentTarget.src = "/Sattva_logo.png";
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Call Analysis Details</h1>
              <p className="text-muted-foreground">
                <span className="font-semibold text-accent-blue">Sattva</span> Voice Analysis • {recording.file_name || 'Recording'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Call Quality Score */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/20"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (analysis.call_quality_score || 0) / 100)}`}
                      className={`transition-all ${getScoreColor(analysis.call_quality_score || 0)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{Math.round(analysis.call_quality_score || 0)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Call Quality</p>
                  <p className="text-xs text-muted-foreground/60">Overall Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Closure Probability */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <TrendingUp className={`h-12 w-12 ${getScoreColor(analysis.closure_probability || 0)}`} />
                <div className="text-4xl font-bold">{Math.round(analysis.closure_probability || 0)}%</div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Closure Probability</p>
                  <p className="text-xs text-muted-foreground/60">Next Stage Likelihood</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Script Adherence */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <FileText className={`h-12 w-12 ${getScoreColor(analysis.script_adherence || 0)}`} />
                <div className="text-4xl font-bold">{Math.round(analysis.script_adherence || 0)}%</div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Script Adherence</p>
                  <p className="text-xs text-muted-foreground/60">Compliance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidate Risk */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <Shield className={`h-12 w-12 ${getRiskColor(getRiskLabel(analysis.candidate_acceptance_risk || 0))}`} />
                <div className="text-4xl font-bold">{Math.round(analysis.candidate_acceptance_risk || 0)}%</div>
                <Badge variant={getRiskBadgeVariant(analysis.candidate_acceptance_risk || 0)} className="mt-1">
                  {getRiskLabel(analysis.candidate_acceptance_risk || 0)}
                </Badge>
                <p className="text-xs text-muted-foreground/60 mt-2">Drop-off Risk</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Compliance Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">{Math.round(analysis.compilience_expections_score || 0)}%</span>
                  <Badge variant={analysis.compilience_expections_score >= 80 ? "default" : "secondary"}>
                    {analysis.compilience_expections_score >= 80 ? "Excellent" : "Needs Review"}
                  </Badge>
                </div>
                <Progress value={analysis.compilience_expections_score || 0} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground">
                {analysis.compilience_expections_score_reasoning || "Measures adherence to legal and company compliance standards during the call."}
              </p>
            </CardContent>
          </Card>

          {/* Objections Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Objections Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around py-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">
                      {(() => {
                        // Prefer integer column `objections_raised`, fallback to parsing text `objections_detected` or `objections_raised` string
                        const raisedRaw = analysis.objections_raised;
                        if (typeof raisedRaw === 'number') return raisedRaw;
                        // sometimes stored as string containing a number
                        if (typeof raisedRaw === 'string' && /^\d+$/.test(raisedRaw.trim())) return Number(raisedRaw.trim());
                        const detectedText = analysis.objections_detected || analysis.objections_raised || '';
                        if (!detectedText) return 0;
                        const count = String(detectedText).split('\n').filter(line => line.trim()).length;
                        return count > 0 ? count : 0;
                      })()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Raised</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl text-muted-foreground">→</div>
                  <p className="text-xs text-muted-foreground">Handled</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">
                    {(() => {
                      // Prefer integer column `objections_handled`, fallback to parsing text `objections_handeled` or `objections_handled` string
                      const handledRaw = analysis.objections_handled;
                      if (typeof handledRaw === 'number') return handledRaw;
                      if (typeof handledRaw === 'string' && /^\d+$/.test(handledRaw.trim())) return Number(handledRaw.trim());
                      const handledText = analysis.objections_handeled || analysis.objections_handled || '';
                      if (!handledText) return 0;
                      const count = String(handledText).split('\n').filter(line => line.trim()).length;
                      return count > 0 ? count : 0;
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 opacity-0">Success</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call Quality Reasoning */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Quality Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {analysis.call_quality_score_reasoning || "This call demonstrated strong communication skills, proper adherence to protocol, and effective engagement with the candidate throughout the conversation."}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis Section */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="objections">Objections</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Purpose of Call */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Purpose of Call
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.purpose_of_call || 'No specific purpose recorded for this call.'}
                  </p>
                </CardContent>
              </Card>

              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.exec_summary || 'No executive summary available for this call.'}
                  </p>
                </CardContent>
              </Card>

              {/* Call Outcome */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Call Outcome
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.outcome || 'No outcome information available.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Closure Probability Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Closure Probability Analysis
                  </CardTitle>
                  <CardDescription>AI assessment of candidate progression likelihood</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.closure_probability_reasoning || 'No detailed analysis available for closure probability.'}
                  </p>
                </CardContent>
              </Card>

              {/* AI Feedback for Recruiter */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    AI Feedback for Recruiter
                  </CardTitle>
                  <CardDescription>Actionable insights and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.ai_feedback_for_recruiter || 'No specific feedback generated for this call.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="objections" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Objections Raised */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Objections Raised
                  </CardTitle>
                  <CardDescription>Concerns expressed by the candidate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(() => {
                      const objections = analysis.objections_detected || analysis.objections_raised || '';
                      if (typeof objections === 'number') {
                        return <p className="text-sm text-muted-foreground">{objections} objection(s) detected.</p>;
                      }
                      const list = String(objections).split('\n').filter(line => line.trim());
                      return list.length > 0 ? (
                        <ul className="space-y-2">
                          {list.map((obj, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-orange-500 mt-1">•</span>
                              <span className="text-muted-foreground">{obj}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No objections were raised during this call.</p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Objections Handled */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Objections Handled
                  </CardTitle>
                  <CardDescription>Successfully addressed concerns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(() => {
                      // Check both spellings: objections_handeled (with typo) and objections_handled (correct)
                      const handled = analysis.objections_handeled || analysis.objections_handled || '';
                      
                      if (!handled || handled === '' || handled === '0') {
                        return <p className="text-sm text-muted-foreground">No objections were successfully handled.</p>;
                      }
                      
                      if (typeof handled === 'number') {
                        return <p className="text-sm text-muted-foreground">{handled} objection(s) handled.</p>;
                      }
                      
                      const list = String(handled).split('\n').filter(line => line.trim());
                      return list.length > 0 ? (
                        <ul className="space-y-2">
                          {list.map((obj, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-green-500 mt-1">✓</span>
                              <span className="text-muted-foreground">{obj}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No objections were successfully handled.</p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="mt-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Call Transcript
                </CardTitle>
                <CardDescription>
                  Complete conversation transcript with speaker labels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] w-full rounded-lg border bg-muted/30 p-6">
                  <div className="whitespace-pre-wrap text-sm leading-loose font-mono">
                    {recording.transcript || 'No transcript available for this recording.'}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
