import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Briefcase,
  Building2,
  MapPin,
  DollarSign
} from "lucide-react";
import { useJobs, useCreateJob, useUpdateJob, useDeleteJob, useClients, useManagerClientAssignments } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { Job } from "@/lib/supabase";

interface JobsPageProps {
  managerId?: string;
}

export default function JobsPage({ managerId }: JobsPageProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  
  const { data: allJobs, isLoading, error } = useJobs();
  const { data: allClients } = useClients();
  const { data: assignments } = useManagerClientAssignments(managerId);
  
  // Filter clients and jobs based on managerId if provided
  const assignedClientIds = managerId 
    ? assignments?.map(assignment => assignment.client_id) || []
    : [];
  
  const clients = managerId 
    ? allClients?.filter(client => assignedClientIds.includes(client.id))
    : allClients;
    
  const jobs = managerId 
    ? allJobs?.filter(job => assignedClientIds.includes(job.client_id))
    : allJobs;
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    client_id: "",
    title: "",
    description: "",
    location: "",
    employment_type: "full-time" as "full-time" | "part-time" | "contract" | "internship" | "temporary",
    experience_level: "mid" as "entry" | "mid" | "senior" | "executive",
    salary_range: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    positions_available: 1
  });

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleOpenAddModal = () => {
    setFormData({
      client_id: "",
      title: "",
      description: "",
      location: "",
      employment_type: "full-time",
      experience_level: "mid",
      salary_range: "",
      requirements: "",
      responsibilities: "",
      benefits: "",
      positions_available: 1
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (job: Job) => {
    setFormData({
      client_id: job.client_id,
      title: job.title,
      description: job.description || "",
      location: job.location || "",
      employment_type: job.employment_type || "full-time",
      experience_level: job.experience_level || "mid",
      salary_range: job.salary_range || "",
      requirements: job.requirements || "",
      responsibilities: job.responsibilities || "",
      benefits: job.benefits || "",
      positions_available: job.positions_available || 1
    });
    setEditingJob(job);
  };

  const handleCreateJob = async () => {
    if (!formData.client_id || !formData.title) {
      toast({
        title: "Validation Error",
        description: "Client and job title are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Get actual company_id from context
      await createJob.mutateAsync({
        ...formData,
        company_id: "placeholder-company-id"
      });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      setIsAddModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    }
  };

  const handleUpdateJob = async () => {
    if (!editingJob || !formData.client_id || !formData.title) {
      toast({
        title: "Validation Error",
        description: "Client and job title are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateJob.mutateAsync({
        id: editingJob.id,
        ...formData
      });
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      setEditingJob(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJob = async (job: Job) => {
    try {
      await deleteJob.mutateAsync(job.id);
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
      setDeletingJob(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-success">Open</Badge>;
      case "filled":
        return <Badge variant="secondary">Filled</Badge>;
      case "on-hold":
        return <Badge variant="outline">On Hold</Badge>;
      case "closed":
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading jobs: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {managerId ? "My Jobs" : "Job Listings"}
          </h1>
          <p className="text-muted-foreground">
            {managerId 
              ? "View job openings for your assigned clients" 
              : "Manage job openings for your clients"
            }
          </p>
        </div>
        {!managerId && (
          <Button onClick={handleOpenAddModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Job
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All job listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {jobs?.filter(j => j.status === "open").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently hiring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filled Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-accent-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-blue">
              {jobs?.filter(j => j.status === "filled").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully placed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Openings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs?.filter(j => j.status === "open").reduce((sum, j) => sum + j.positions_available, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>
            Manage job listings for your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all" ? "No jobs match your criteria." : "Add your first job listing to get started."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Button onClick={handleOpenAddModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Job
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Positions</TableHead>
                    <TableHead>Status</TableHead>
                    {!managerId && <TableHead className="w-[50px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{job.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {job.experience_level && (
                                <span className="capitalize">{job.experience_level} level</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {job.clients?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.location ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {job.location}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {job.employment_type?.replace("-", " ") || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.positions_available}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      {!managerId && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditModal(job)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingJob(job)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Job Modal */}
      <Dialog open={isAddModalOpen || !!editingJob} onOpenChange={() => {
        setIsAddModalOpen(false);
        setEditingJob(null);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job" : "Add New Job"}</DialogTitle>
            <DialogDescription>
              {editingJob ? "Update job listing information" : "Create a new job listing"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client_id">Client Company *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., New York, NY"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input
                  id="salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  placeholder="e.g., $80,000 - $120,000"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value: any) => setFormData({ ...formData, employment_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="experience_level">Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value: any) => setFormData({ ...formData, experience_level: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="positions_available">Positions</Label>
                <Input
                  id="positions_available"
                  type="number"
                  min="1"
                  value={formData.positions_available}
                  onChange={(e) => setFormData({ ...formData, positions_available: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a detailed job description"
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="List required skills and qualifications"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                placeholder="Describe key responsibilities"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="benefits">Benefits</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="List benefits and perks"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingJob(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingJob ? handleUpdateJob : handleCreateJob}
              disabled={createJob.isPending || updateJob.isPending}
            >
              {(createJob.isPending || updateJob.isPending) ? "Saving..." : editingJob ? "Update Job" : "Add Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingJob} onOpenChange={() => setDeletingJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingJob?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeletingJob(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingJob && handleDeleteJob(deletingJob)}
              disabled={deleteJob.isPending}
            >
              {deleteJob.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
