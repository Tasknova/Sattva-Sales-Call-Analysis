import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useAnalysisNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const previousStatusesRef = useRef<Map<string, string>>(new Map());
  
  // Query to check for all recordings with their current status
  const { data: recordings } = useQuery({
    queryKey: ['recording_statuses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('recordings')
        .select(`
          id,
          file_name,
          status,
          analyses (
            id,
            sentiment_score,
            engagement_score
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Check every 5 seconds
    enabled: !!user
  });

  useEffect(() => {
    if (!recordings) return;

    recordings.forEach(recording => {
      const currentStatus = recording.status || 'unknown';
      const previousStatus = previousStatusesRef.current.get(recording.id);
      
      // Only show notification when status changes to 'completed' and has analysis data
      if (
        currentStatus === 'completed' && 
        previousStatus !== 'completed' && 
        recording.analyses && 
        recording.analyses.length > 0 &&
        recording.analyses[0].sentiment_score !== null
      ) {
        const analysis = recording.analyses[0];
        const fileName = recording.file_name || 'Recording';
        const sentimentScore = (analysis.sentiment_score || 0).toFixed(0);
        const engagementScore = (analysis.engagement_score || 0).toFixed(0);
        
        // Get emojis based on scores
        const getSentimentEmoji = (score: number) => {
          if (score >= 80) return "😊";
          if (score >= 60) return "😐";
          return "😔";
        };
        
        const getEngagementEmoji = (score: number) => {
          if (score >= 80) return "🔥";
          if (score >= 60) return "👍";
          return "👎";
        };

        toast({
          title: "🎉 Analysis Complete!",
          description: `${fileName} - Sentiment: ${getSentimentEmoji(analysis.sentiment_score || 0)} ${sentimentScore}%, Engagement: ${getEngagementEmoji(analysis.engagement_score || 0)} ${engagementScore}%`,
          duration: 6000,
        });
      }
      
      // Update the status tracking
      previousStatusesRef.current.set(recording.id, currentStatus);
    });
  }, [recordings, toast]);

  return {
    recordings: recordings || [],
    completedRecordings: recordings?.filter(r => r.status === 'completed') || []
  };
}
