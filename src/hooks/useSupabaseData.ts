import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Recording, Analysis, MetricsAggregate, Lead, LeadGroup, Client, Job, ManagerClientAssignment } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useRecordings() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['recordings', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Recording[]
    },
    enabled: !!user
  })
}

export function useAnalyses() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['analyses', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          *,
          recordings (
            file_name,
            duration_seconds,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as (Analysis & { recordings: Recording })[]
    },
    enabled: !!user
  })
}

export function useMetricsAggregates() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['metrics_aggregates', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('metrics_aggregates')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) throw error
      return data as MetricsAggregate[]
    },
    enabled: !!user
  })
}

export function useDashboardStats() {
  const { data: recordings } = useRecordings()
  const { data: analyses } = useAnalyses()
  const { data: metrics } = useMetricsAggregates()

  return useQuery({
    queryKey: ['dashboard_stats', recordings, analyses, metrics],
    queryFn: () => {
      if (!recordings || !analyses || !metrics) return null

      // Calculate KPIs
      const totalCalls = recordings.length
      const avgSentiment = analyses.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) / analyses.length
      const avgEngagement = analyses.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / analyses.length
      const avgConfidenceExecutive = analyses.reduce((sum, a) => sum + (a.confidence_score_executive || 0), 0) / analyses.length
      const avgConfidencePerson = analyses.reduce((sum, a) => sum + (a.confidence_score_person || 0), 0) / analyses.length
      const totalObjectionsHandled = analyses.filter(a => a.objections_handled && a.objections_handled !== 'None - customer was receptive and interested' && a.objections_handled !== 'None - strong alignment with growth challenges' && a.objections_handled !== 'None - enterprise client was highly engaged throughout').length
      const successfulOutcomes = analyses.filter(a => a.call_outcome && !['Trial Setup', 'Awaiting Decision'].includes(a.call_outcome)).length
      
      // Additional KPIs
      const highPerformingCalls = analyses.filter(a => (a.sentiment_score || 0) >= 80 && (a.engagement_score || 0) >= 75).length
      const callsWithNextSteps = analyses.filter(a => a.next_steps && a.next_steps !== 'TBD' && a.next_steps.trim().length > 10).length
      const totalObjectionsRaised = analyses.reduce((sum, a) => sum + (a.objections_raised || 0), 0)
      const totalObjectionsTackled = analyses.reduce((sum, a) => sum + (a.objections_tackled || 0), 0)
      const objectionSuccessRate = totalObjectionsRaised > 0 ? (totalObjectionsTackled / totalObjectionsRaised) * 100 : 0

      // Sentiment distribution - 5 categories
      const sentimentData = [
        { 
          name: 'Perfect', 
          value: analyses.filter(a => (a.sentiment_score || 0) >= 90).length,
          color: '#10B981' // Emerald green for perfect
        },
        { 
          name: 'Excellent', 
          value: analyses.filter(a => (a.sentiment_score || 0) >= 80 && (a.sentiment_score || 0) < 90).length,
          color: '#059669' // Dark green for excellent
        },
        { 
          name: 'Good', 
          value: analyses.filter(a => (a.sentiment_score || 0) >= 70 && (a.sentiment_score || 0) < 80).length,
          color: 'hsl(var(--accent-blue))' // Blue for good
        },
        { 
          name: 'Neutral', 
          value: analyses.filter(a => (a.sentiment_score || 0) >= 50 && (a.sentiment_score || 0) < 70).length,
          color: '#F59E0B' // Amber for neutral
        },
        { 
          name: 'Negative', 
          value: analyses.filter(a => (a.sentiment_score || 0) < 50).length,
          color: '#EF4444' // Red for negative
        }
      ]

      // Trend data from metrics
      const trendData = metrics.slice(-7).map(m => ({
        date: new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' }),
        sentiment: m.avg_sentiment || 0,
        engagement: m.avg_engagement || 0
      }))

      // Engagement levels - 5 categories
      const engagementData = [
        { level: 'Perfect', count: analyses.filter(a => (a.engagement_score || 0) >= 90).length, fill: '#10B981' },
        { level: 'Excellent', count: analyses.filter(a => (a.engagement_score || 0) >= 80 && (a.engagement_score || 0) < 90).length, fill: '#059669' },
        { level: 'Good', count: analyses.filter(a => (a.engagement_score || 0) >= 70 && (a.engagement_score || 0) < 80).length, fill: 'hsl(var(--accent-blue))' },
        { level: 'Neutral', count: analyses.filter(a => (a.engagement_score || 0) >= 50 && (a.engagement_score || 0) < 70).length, fill: '#F59E0B' },
        { level: 'Negative', count: analyses.filter(a => (a.engagement_score || 0) < 50).length, fill: '#EF4444' }
      ]

      // Objection handling analysis
      const objectionData = [
        { category: 'Budget/Price', count: analyses.filter(a => a.objections_handled?.toLowerCase().includes('budget') || a.objections_handled?.toLowerCase().includes('price')).length },
        { category: 'Timeline', count: analyses.filter(a => a.objections_handled?.toLowerCase().includes('timeline')).length },
        { category: 'Authority', count: analyses.filter(a => a.objections_handled?.toLowerCase().includes('authority') || a.objections_handled?.toLowerCase().includes('decision')).length },
        { category: 'Competition', count: analyses.filter(a => a.objections_handled?.toLowerCase().includes('competition') || a.objections_handled?.toLowerCase().includes('competitor')).length },
        { category: 'None', count: analyses.filter(a => a.objections_handled?.toLowerCase().includes('none')).length }
      ]

      return {
        kpiData: {
          totalCalls,
          avgSentiment,
          avgEngagement,
          avgConfidenceExecutive,
          avgConfidencePerson,
          objectionsHandled: totalObjectionsHandled,
          highPerformingCalls,
          callsWithNextSteps,
          totalObjectionsRaised,
          totalObjectionsTackled,
          objectionSuccessRate
        },
        sentimentData,
        trendData,
        engagementData,
        objectionData,
        
        // Last 10 calls sentiment trend data for line chart
        last10CallsSentiment: analyses.slice(0, 10).reverse().map((analysis, index) => ({
          call: `Call ${index + 1}`,
          callName: analysis.recordings?.file_name?.replace('.mp3', '').substring(0, 10) || `Call ${index + 1}`,
          sentiment: Math.round(analysis.sentiment_score || 0),
          date: new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })),
        
        // Last 10 calls confidence data for bar chart
        last10CallsConfidence: analyses.slice(0, 10).reverse().map((analysis, index) => ({
          call: `Call ${index + 1}`,
          callName: analysis.recordings?.file_name?.replace('.mp3', '').substring(0, 8) || `Call ${index + 1}`,
          executive: analysis.confidence_score_executive || 0,
          person: analysis.confidence_score_person || 0,
          date: new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })),
        
        // Last 10 calls objections data for visualization
        last10CallsObjections: analyses.slice(0, 10).reverse().map((analysis, index) => ({
          call: `Call ${index + 1}`,
          callName: analysis.recordings?.file_name?.replace('.mp3', '').substring(0, 8) || `Call ${index + 1}`,
          raised: analysis.objections_raised || 0,
          tackled: analysis.objections_tackled || 0,
          date: new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })),
        
        recentCalls: analyses.slice(0, 4).map((analysis, index) => ({
          id: analysis.id,
          name: analysis.recordings?.file_name?.replace('.mp3', '') || `Call ${index + 1}`,
          date: new Date(analysis.created_at).toLocaleDateString(),
          duration: analysis.recordings?.duration_seconds ? 
            `${Math.floor(analysis.recordings.duration_seconds / 60)}:${(analysis.recordings.duration_seconds % 60).toString().padStart(2, '0')}` : 
            'N/A',
          sentiment: analysis.sentiment_score || 0,
          engagement: analysis.engagement_score || 0,
          confidenceExecutive: analysis.confidence_score_executive || 0,
          confidencePerson: analysis.confidence_score_person || 0,
          status: 'completed',
          objections: analysis.objections_handled || 'None',
          nextSteps: analysis.next_steps || 'TBD',
          improvements: analysis.improvements || 'None',
          callOutcome: analysis.call_outcome || 'Unknown'
        }))
      }
    },
    enabled: !!recordings && !!analyses && !!metrics
  })
}

export function useDeleteRecording() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (recordingId: string) => {
      if (!user) throw new Error('User not authenticated')
      
      // Delete the recording (analyses will be deleted automatically due to CASCADE)
      // RLS policies ensure users can only delete their own recordings
      const { error } = await supabase
        .from('recordings')
        .delete()
        .eq('id', recordingId)
      
      if (error) throw error
      return recordingId
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['recordings'] })
      queryClient.invalidateQueries({ queryKey: ['analyses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] })
      queryClient.invalidateQueries({ queryKey: ['metrics_aggregates'] })
    },
    onError: (error) => {
      console.error('Failed to delete recording:', error)
    }
  })
}

// Lead Groups Hooks
export function useLeadGroups() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['lead_groups', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('lead_groups')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as LeadGroup[]
    },
    enabled: !!user
  })
}

export function useCreateLeadGroup() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (groupData: { group_name: string }) => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('lead_groups')
        .insert([{ ...groupData, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      return data as LeadGroup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead_groups'] })
    }
  })
}

export function useUpdateLeadGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, group_name }: { id: string; group_name: string }) => {
      const { data, error } = await supabase
        .from('lead_groups')
        .update({ group_name })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as LeadGroup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead_groups'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}

export function useDeleteLeadGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lead_groups')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead_groups'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}

// Leads Hooks
export function useLeads(groupId?: string) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['leads', user?.id, groupId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      
      let query = supabase
        .from('leads')
        .select(`
          *,
          lead_groups (
            id,
            group_name
          ),
          clients (
            id,
            name
          ),
          jobs (
            id,
            title,
            client_id
          )
        `)
        .order('created_at', { ascending: false })
      
      if (groupId) {
        query = query.eq('group_id', groupId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data as Lead[]
    },
    enabled: !!user
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (leadData: { 
      name: string; 
      email: string; 
      contact: string; 
      description?: string; 
      other?: any; 
      group_id?: string;
      client_id?: string;
      job_id?: string;
    }) => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, user_id: user.id, status: 'contacted' }])
        .select()
        .single()
      
      if (error) throw error
      return data as Lead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updateData 
    }: { 
      id: string; 
      name?: string; 
      email?: string; 
      contact?: string; 
      description?: string; 
      other?: any; 
      group_id?: string;
      client_id?: string;
      job_id?: string;
      assigned_to?: string;
    }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Lead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}

export function useBulkCreateLeads() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (leadsData: Array<{ 
      name: string; 
      email: string; 
      contact: string; 
      description?: string; 
      other?: any; 
      group_id?: string;
      client_id?: string;
      job_id?: string;
    }>) => {
      if (!user) throw new Error('User not authenticated')
      
      const leadsWithUserId = leadsData.map(lead => ({ ...lead, user_id: user.id, status: 'contacted' }))
      
      const { data, error } = await supabase
        .from('leads')
        .insert(leadsWithUserId)
        .select()
      
      if (error) throw error
      return data as Lead[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}

// Clients Hooks
export function useClients() {
  const { user, company } = useAuth()
  
  return useQuery({
    queryKey: ['clients', user?.id, company?.id],
    queryFn: async () => {
      if (!user) {
        console.error('useClients: User not authenticated')
        throw new Error('User not authenticated')
      }
      
      if (!company?.id) {
        console.error('useClients: Company ID not found')
        throw new Error('Company not found')
      }
      
      console.log('useClients: Fetching clients for company_id:', company.id)
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('useClients: Supabase error:', error)
        throw error
      }
      
      console.log('useClients: Successfully fetched clients:', data)
      return data as Client[]
    },
    enabled: !!user && !!company?.id
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (clientData: { 
      name: string;
      industry?: string;
      contact_person?: string;
      email?: string;
      phone?: string;
      address?: string;
      website?: string;
      company_id: string;
    }) => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()
      
      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updateData 
    }: { 
      id: string;
      name?: string;
      industry?: string;
      contact_person?: string;
      email?: string;
      phone?: string;
      address?: string;
      website?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}

// Jobs Hooks
export function useJobs(clientId?: string) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['jobs', user?.id, clientId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      
      let query = supabase
        .from('jobs')
        .select(`
          *,
          clients (
            id,
            name,
            industry
          )
        `)
        .order('created_at', { ascending: false })
      
      if (clientId) {
        query = query.eq('client_id', clientId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data as Job[]
    },
    enabled: !!user
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (jobData: { 
      company_id: string;
      client_id: string;
      title: string;
      description?: string;
      location?: string;
      employment_type?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
      experience_level?: 'entry' | 'mid' | 'senior' | 'executive';
      salary_range?: string;
      requirements?: string;
      responsibilities?: string;
      benefits?: string;
      positions_available?: number;
    }) => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('jobs')
        .insert([{ ...jobData, posted_by: user.id }])
        .select()
        .single()
      
      if (error) throw error
      return data as Job
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updateData 
    }: { 
      id: string;
      client_id?: string;
      title?: string;
      description?: string;
      location?: string;
      employment_type?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
      experience_level?: 'entry' | 'mid' | 'senior' | 'executive';
      salary_range?: string;
      requirements?: string;
      responsibilities?: string;
      benefits?: string;
      status?: 'open' | 'closed' | 'on-hold' | 'filled';
      positions_available?: number;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Job
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}

// Manager-Client Assignment Hooks
export function useManagerClientAssignments(managerId?: string) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['manager_client_assignments', user?.id, managerId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      
      let query = supabase
        .from('manager_client_assignments')
        .select(`
          *,
          clients (
            id,
            name,
            industry,
            contact_person,
            email
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (managerId) {
        query = query.eq('manager_id', managerId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })
}

// Hook to get clients assigned to a manager (returns just the client objects)
export function useManagerClients(managerId?: string) {
  const { data: assignments } = useManagerClientAssignments(managerId)
  
  return {
    data: assignments?.map(assignment => assignment.clients).filter(Boolean) as Client[] | undefined,
    isLoading: false
  }
}

export function useAssignClientToManager() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (assignmentData: { 
      manager_id: string;
      client_id: string;
    }) => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('manager_client_assignments')
        .insert([{ 
          ...assignmentData, 
          assigned_by: user.id,
          assigned_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager_client_assignments'] })
    }
  })
}

export function useUnassignClientFromManager() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ manager_id, client_id }: { manager_id: string; client_id: string }) => {
      const { error } = await supabase
        .from('manager_client_assignments')
        .delete()
        .eq('manager_id', manager_id)
        .eq('client_id', client_id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager_client_assignments'] })
    }
  })
}

export function useBulkAssignClients() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async ({ manager_id, client_ids }: { manager_id: string; client_ids: string[] }) => {
      if (!user) throw new Error('User not authenticated')
      
      const assignments = client_ids.map(client_id => ({
        manager_id,
        client_id,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      }))
      
      const { data, error } = await supabase
        .from('manager_client_assignments')
        .insert(assignments)
        .select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager_client_assignments'] })
    }
  })
}
