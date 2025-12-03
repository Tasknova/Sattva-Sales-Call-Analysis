import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
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
  SelectSeparator,
} from "@/components/ui/select";
import { useCreateLead, useLeadGroups, useCreateLeadGroup, useClients, useJobs, useManagerClients } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroupId?: string;
  managerId?: string; // If provided, filters clients to only show those assigned to this manager
}

export default function AddLeadModal({ isOpen, onClose, defaultGroupId, managerId }: AddLeadModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    description: "",
    group_id: defaultGroupId || "none",
    client_id: "none",
    job_id: "none",
  });
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);

  const createLead = useCreateLead();
  const createGroup = useCreateLeadGroup();
  const { data: leadGroups, refetch: refetchLeadGroups } = useLeadGroups();
  const { data: allClients } = useClients();
  const { data: managerClients } = useManagerClients(managerId);
  const { data: jobs } = useJobs();
  const { toast } = useToast();
  
  // Use manager-filtered clients if managerId is provided, otherwise use all clients
  const clients = managerId ? managerClients : allClients;

  // Filter jobs based on selected client
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
      setFormData(prev => ({ ...prev, job_id: "none" }));
    }
  }, [formData.client_id, jobs]);

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
      await createLead.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim(),
        contact: formData.contact.trim(),
        description: formData.description.trim() || undefined,
        group_id: formData.group_id !== "none" ? formData.group_id : undefined,
        client_id: formData.client_id !== "none" ? formData.client_id : undefined,
        job_id: formData.job_id !== "none" ? formData.job_id : undefined,
      });

      toast({
        title: "Success",
        description: "Lead added successfully",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        contact: "",
        description: "",
        group_id: defaultGroupId || "none",
        client_id: "none",
        job_id: "none",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add lead",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      contact: "",
      description: "",
      group_id: defaultGroupId || "none",
      client_id: "none",
      job_id: "none",
    });
    setIsCreatingGroup(false);
    setNewGroupName("");
    onClose();
  };
  
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const newGroup = await createGroup.mutateAsync({
        group_name: newGroupName.trim(),
      });
      
      // Update the form with the newly created group
      setFormData({ ...formData, group_id: newGroup.id });
      
      toast({
        title: "Success",
        description: "Group created successfully",
      });
      
      // Reset the new group dialog
      setNewGroupName("");
      setIsCreatingGroup(false);
      
      // Refetch the groups to update the dropdown
      refetchLeadGroups();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Add a new lead to your database. Name, email, and contact are required.
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
              onValueChange={(value) => {
                if (value === "create-new") {
                  setIsCreatingGroup(true);
                } else {
                  setFormData({ ...formData, group_id: value });
                }
              }}
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
                <SelectSeparator />
                <SelectItem value="create-new" className="text-primary font-medium">
                  <div className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Group
                  </div>
                </SelectItem>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending ? "Adding..." : "Add Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Create New Group Dialog */}
      <Dialog open={isCreatingGroup} onOpenChange={(open) => !open && setIsCreatingGroup(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize your leads.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newGroupName">Group Name *</Label>
              <Input
                id="newGroupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name (e.g., 'Meta Leads', 'Event X Leads')"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreatingGroup(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateGroup} 
                disabled={createGroup.isPending || !newGroupName.trim()}
              >
                {createGroup.isPending ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}


