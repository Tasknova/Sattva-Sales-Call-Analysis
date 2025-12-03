import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLead, useLeadGroups, useClients, useJobs, useManagerClients } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { Lead, supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface EditLeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  managerId?: string; // If provided, filters clients to only show those assigned to this manager
}

export default function EditLeadModal({ lead, isOpen, onClose, managerId }: EditLeadModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    description: "",
    group_id: "none",
    client_id: "none",
    job_id: "none",
    assigned_to: "none",
  });
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);

  const updateLead = useUpdateLead();
  const { data: leadGroups } = useLeadGroups();
  const { data: allClients } = useClients();
  const { data: managerClients } = useManagerClients(managerId);
  const { data: jobs } = useJobs();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  
  // Use manager-filtered clients if managerId is provided, otherwise use all clients
  const clients = managerId ? managerClients : allClients;

  // Fetch assignable users (managers and employees)
  useEffect(() => {
    const fetchAssignableUsers = async () => {
      if (!user || !userRole?.company_id) return;

      try {
        // Fetch managers
        const { data: managers, error: managersError } = await supabase
          .from('managers')
          .select('id, full_name, email')
          .eq('company_id', userRole.company_id)
          .eq('is_active', true);

        // Fetch employees
        const { data: employees, error: employeesError } = await supabase
          .from('employees')
          .select('id, full_name, email')
          .eq('company_id', userRole.company_id)
          .eq('is_active', true);

        if (managersError) console.error('Error fetching managers:', managersError);
        if (employeesError) console.error('Error fetching employees:', employeesError);

        const allUsers = [
          ...(managers || []).map(m => ({ ...m, type: 'Manager' })),
          ...(employees || []).map(e => ({ ...e, type: 'Employee' }))
        ];

        setAssignableUsers(allUsers);
      } catch (error) {
        console.error('Error fetching assignable users:', error);
      }
    };

    fetchAssignableUsers();
  }, [user, userRole]);

  // First useEffect: Load lead data and filter jobs immediately
  useEffect(() => {
    if (lead && jobs) {
      const clientId = lead.client_id || "none";
      const jobId = lead.job_id || "none";
      
      // Filter jobs for the lead's client
      if (clientId && clientId !== "none") {
        const clientJobs = jobs.filter(job => job.client_id === clientId);
        setFilteredJobs(clientJobs);
      } else {
        setFilteredJobs([]);
      }
      
      // Set form data including job_id and assigned_to
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        contact: lead.contact || "",
        description: lead.description || "",
        group_id: lead.group_id || "none",
        client_id: clientId,
        job_id: jobId,
        assigned_to: lead.assigned_to || "none",
      });
    }
  }, [lead, jobs]);

  // Second useEffect: Update filtered jobs when client changes
  useEffect(() => {
    if (formData.client_id && formData.client_id !== "none") {
      const clientJobs = jobs?.filter(job => job.client_id === formData.client_id) || [];
      setFilteredJobs(clientJobs);
      // Reset job_id if the selected job doesn't belong to the new client
      if (formData.job_id !== "none" && !clientJobs.find(j => j.id === formData.job_id)) {
        setFormData(prev => ({ ...prev, job_id: "none" }));
      }
    } else {
      setFilteredJobs([]);
      if (formData.job_id !== "none") {
        setFormData(prev => ({ ...prev, job_id: "none" }));
      }
    }
  }, [formData.client_id, jobs, formData.job_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.contact.trim()) {
      toast({
        title: "Error",
        description: "Name, email, and contact are required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateLead.mutateAsync({
        id: lead.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        contact: formData.contact.trim(),
        description: formData.description.trim() || undefined,
        group_id: formData.group_id !== "none" ? formData.group_id : undefined,
        client_id: formData.client_id !== "none" ? formData.client_id : undefined,
        job_id: formData.job_id !== "none" ? formData.job_id : undefined,
        assigned_to: formData.assigned_to !== "none" ? formData.assigned_to : undefined,
      });

      toast({
        title: "Success",
        description: "Lead updated successfully",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update the lead information. Name, email, and contact are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter lead's name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter lead's email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact *</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="Enter phone number or contact info"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter additional notes about this lead"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Group</Label>
            <Select
              value={formData.group_id}
              onValueChange={(value) => setFormData({ ...formData, group_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a group (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No group</SelectItem>
                {leadGroups?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.group_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job">Job</Label>
            <Select
              value={formData.job_id}
              onValueChange={(value) => setFormData({ ...formData, job_id: value })}
              disabled={formData.client_id === "none" || filteredJobs.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a job (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No job</SelectItem>
                {filteredJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.client_id === "none" && (
              <p className="text-xs text-muted-foreground">Select a client first to choose a job</p>
            )}
            {formData.client_id !== "none" && filteredJobs.length === 0 && (
              <p className="text-xs text-muted-foreground">No jobs available for this client</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign to manager or employee (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {assignableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateLead.isPending}>
              {updateLead.isPending ? "Updating..." : "Update Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


