import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  User,
  FolderOpen,
  Upload,
  FileSpreadsheet,
  Building,
  Briefcase
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeads, useDeleteLead } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@/lib/supabase";
import AddLeadModal from "./AddLeadModal";
import EditLeadModal from "./EditLeadModal";
import CSVUploadDialog from "./CSVUploadDialog";

function AllLeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  
  const { data: leads, isLoading, error } = useLeads();
  const deleteLead = useDeleteLead();
  const { toast } = useToast();

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClientFilter === 'all' || lead.client_id === selectedClientFilter;
    const matchesJob = selectedJobFilter === 'all' || lead.job_id === selectedJobFilter;
    return matchesSearch && matchesClient && matchesJob;
  }) || [];

  const handleDeleteLead = async (lead: Lead) => {
    try {
      await deleteLead.mutateAsync(lead.id);
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      setDeletingLead(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading leads: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Leads</h1>
          <p className="text-muted-foreground">
            Manage and organize your leads
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setIsCsvUploadOpen(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Upload CSV
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All leads in your database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grouped Leads</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads?.filter(lead => lead.group_id).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads assigned to groups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ungrouped Leads</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads?.filter(lead => !lead.group_id).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads without groups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Search and manage your leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, email, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={selectedClientFilter}
                onValueChange={setSelectedClientFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {Array.from(new Set(leads?.filter(l => l.clients).map(l => l.clients?.id))).map((clientId) => {
                    const client = leads?.find(l => l.clients?.id === clientId)?.clients;
                    return client ? (
                      <SelectItem key={clientId} value={clientId}>
                        {client.name}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
              <Select
                value={selectedJobFilter}
                onValueChange={setSelectedJobFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {Array.from(new Set(leads?.filter(l => l.jobs).map(l => l.jobs?.id))).map((jobId) => {
                    const job = leads?.find(l => l.jobs?.id === jobId)?.jobs;
                    return job ? (
                      <SelectItem key={jobId} value={jobId}>
                        {job.title}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leads found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No leads match your search criteria." : "Get started by adding your first lead."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Lead
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {lead.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {lead.contact}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.clients ? (
                          <Badge variant="outline" className="text-xs">
                            {lead.clients.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.jobs ? (
                          <Badge variant="outline" className="text-xs">
                            {lead.jobs.title}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.lead_groups ? (
                          <Badge variant="secondary">
                            {lead.lead_groups.group_name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No group</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.description ? (
                          <span className="text-sm text-muted-foreground">
                            {lead.description.length > 50 
                              ? `${lead.description.substring(0, 50)}...` 
                              : lead.description
                            }
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingLead(lead)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Lead Modal */}
      <AddLeadModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal 
          lead={editingLead}
          isOpen={!!editingLead} 
          onClose={() => setEditingLead(null)} 
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingLead} onOpenChange={() => setDeletingLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingLead?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeletingLead(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingLead && handleDeleteLead(deletingLead)}
              disabled={deleteLead.isPending}
            >
              {deleteLead.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <CSVUploadDialog 
        isOpen={isCsvUploadOpen}
        onClose={() => setIsCsvUploadOpen(false)}
      />
    </div>
  );
}

export default AllLeadsPage;
