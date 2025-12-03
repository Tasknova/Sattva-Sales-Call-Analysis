   import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  FolderOpen, 
  Users,
  Eye
} from "lucide-react";
import { useLeadGroups, useDeleteLeadGroup, useLeads } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { LeadGroup } from "@/lib/supabase";
import AddGroupModal from "./AddGroupModal";
import EditGroupModal from "./EditGroupModal";

export default function LeadGroupsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LeadGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<LeadGroup | null>(null);
  const [viewingGroup, setViewingGroup] = useState<LeadGroup | null>(null);
  
  const navigate = useNavigate();
  const { data: leadGroups, isLoading, error } = useLeadGroups();
  const { data: allLeads } = useLeads();
  const deleteGroup = useDeleteLeadGroup();
  const { toast } = useToast();

  const filteredGroups = leadGroups?.filter(group => 
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getLeadsInGroup = (groupId: string) => {
    return allLeads?.filter(lead => lead.group_id === groupId) || [];
  };

  const handleDeleteGroup = async (group: LeadGroup) => {
    try {
      await deleteGroup.mutateAsync(group.id);
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
      setDeletingGroup(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading groups: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead Groups</h1>
          <p className="text-muted-foreground">
            Organize your leads into groups for better management
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadGroups?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Groups created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allLeads?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leads across all groups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Leads/Group</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leadGroups?.length ? Math.round((allLeads?.length || 0) / leadGroups.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Average leads per group
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle>Groups</CardTitle>
          <CardDescription>
            Manage your lead groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No groups found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No groups match your search criteria." : "Create your first group to organize your leads."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Leads Count</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group) => {
                    const leadsInGroup = getLeadsInGroup(group.id);
                    return (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:text-accent-blue transition-colors"
                            onClick={() => navigate(`/group/${group.id}`)}
                          >
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            {group.group_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className="cursor-pointer hover:bg-accent-blue/10 transition-colors"
                            onClick={() => navigate(`/group/${group.id}`)}
                          >
                            {leadsInGroup.length} leads
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(group.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/group/${group.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Leads
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingGroup(group)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingGroup(group)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Group Modal */}
      <AddGroupModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Edit Group Modal */}
      {editingGroup && (
        <EditGroupModal 
          group={editingGroup}
          isOpen={!!editingGroup} 
          onClose={() => setEditingGroup(null)} 
        />
      )}

      {/* View Group Leads Modal */}
      {viewingGroup && (
        <Dialog open={!!viewingGroup} onOpenChange={() => setViewingGroup(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Leads in "{viewingGroup.group_name}"</DialogTitle>
              <DialogDescription>
                View all leads in this group
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {getLeadsInGroup(viewingGroup.id).length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No leads in this group yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getLeadsInGroup(viewingGroup.id).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                      </div>
                      <Badge variant="outline">{lead.contact}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setViewingGroup(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingGroup} onOpenChange={() => setDeletingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingGroup?.group_name}"? 
              This will remove the group but keep all leads (they will become ungrouped).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeletingGroup(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingGroup && handleDeleteGroup(deletingGroup)}
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


