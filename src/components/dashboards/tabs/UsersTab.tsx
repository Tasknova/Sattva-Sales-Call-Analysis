import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, UserPlus, MoreHorizontal, Eye, Edit, Shield, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  full_name?: string;
  email?: string;
  department?: string | null;
  password?: string | null;
}

interface UserItem {
  id: string;
  user_id: string;
  company_id?: string;
  full_name?: string;
  email?: string;
  password?: string | null;
  manager_id?: string | null;
  manager_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: UserProfile | null;
  role?: string;
  employees?: UserItem[];
}

const DEPARTMENT_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'support', label: 'Customer Support' },
  { value: 'operations', label: 'Operations' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'other', label: 'Other' }
];

export default function UsersTab({
  initialView = 'managers',
  managers: propManagers,
  employees: propEmployees,
}: {
  initialView?: 'managers' | 'employees';
  managers?: UserItem[];
  employees?: UserItem[];
}) {
  const { user, userRole, company } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<UserItem[]>(propManagers || []);
  const [employees, setEmployees] = useState<UserItem[]>(propEmployees || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string>('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addUserType, setAddUserType] = useState<'manager' | 'employee'>('manager');
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  
  // Form states
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department: '',
    manager_id: ''
  });

  useEffect(() => {
    if (initialView) {
      setAddUserType(initialView === 'managers' ? 'manager' : 'employee');
    }
  }, [initialView]);

  const fetchUsers = async () => {
    if (!userRole?.company_id) return;
    try {
      setLoading(true);

      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('id, user_id, company_id, full_name, email, department, password, is_active, created_at, updated_at')
        .eq('company_id', userRole.company_id)
        .eq('is_active', true);

      if (managersError) {
        console.error('Error fetching managers:', managersError);
        throw managersError;
      }

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`id, user_id, company_id, full_name, email, password, manager_id, is_active, created_at, updated_at, managers(full_name, department)`)
        .eq('company_id', userRole.company_id)
        .eq('is_active', true);

      if (employeesError) throw employeesError;

      const managersWithEmployees = (managersData || []).map((manager: any) => ({
        id: manager.id,
        user_id: manager.user_id,
        company_id: manager.company_id,
        role: 'manager',
        manager_id: null,
        is_active: manager.is_active,
        created_at: manager.created_at,
        updated_at: manager.updated_at,
        profile: {
          full_name: manager.full_name,
          email: manager.email,
          department: manager.department,
          password: manager.password
        },
        employees: (employeesData || []).filter((e: any) => e.manager_id === manager.id) || []
      }));

      const employeesWithProfiles = (employeesData || []).map((employee: any) => ({
        id: employee.id,
        user_id: employee.user_id,
        company_id: employee.company_id,
        role: 'employee',
        manager_id: employee.manager_id,
        manager_name: employee.managers?.full_name || 'Unknown',
        is_active: employee.is_active,
        created_at: employee.created_at,
        updated_at: employee.updated_at,
        profile: {
          full_name: employee.full_name,
          email: employee.email,
          department: null,
          password: employee.password
        }
      }));

      setManagers(managersWithEmployees || []);
      setEmployees(employeesWithProfiles || []);
    } catch (error: any) {
      console.error('Error fetching users (UsersTab):', error);
      toast({ title: 'Error', description: 'Failed to fetch users.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If parent passed managers/employees, use them and skip fetching
    if (propManagers || propEmployees) {
      setManagers(propManagers || []);
      setEmployees(propEmployees || []);
      setLoading(false);
      return;
    }

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole?.company_id, propManagers, propEmployees]);

  const filteredManagers = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return managers.filter(manager => {
      const matchesSearch = (
        manager.profile?.full_name?.toLowerCase().includes(search) ||
        manager.profile?.email?.toLowerCase().includes(search) ||
        manager.profile?.department?.toLowerCase().includes(search) ||
        manager.user_id?.toLowerCase().includes(search)
      );
      const matchesDepartment = selectedDepartmentFilter === 'all' || manager.profile?.department === selectedDepartmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [managers, searchTerm, selectedDepartmentFilter]);

  const filteredEmployees = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return employees.filter(employee => {
      const matchesSearch = (
        employee.profile?.full_name?.toLowerCase().includes(search) ||
        employee.profile?.email?.toLowerCase().includes(search) ||
        employee.profile?.department?.toLowerCase().includes(search) ||
        employee.user_id?.toLowerCase().includes(search)
      );
      const matchesManager = selectedManagerFilter === 'all' || employee.manager_id === selectedManagerFilter;
      return matchesSearch && matchesManager;
    });
  }, [employees, searchTerm, selectedManagerFilter]);

  const handleAddManager = async () => {
    if (!newUserForm.full_name || !newUserForm.email || !newUserForm.password) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: { data: { role: 'manager' } }
      });

      if (authError) throw authError;

      const { error: managerError } = await supabase.from('managers').insert({
        user_id: authData.user!.id,
        company_id: userRole?.company_id,
        full_name: newUserForm.full_name,
        email: newUserForm.email,
        password: newUserForm.password,
        department: newUserForm.department || null,
        is_active: true
      });

      if (managerError) throw managerError;

      toast({ title: 'Success', description: 'Manager added successfully' });
      setIsAddUserModalOpen(false);
      setNewUserForm({ full_name: '', email: '', password: '', department: '', manager_id: '' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding manager:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add manager', variant: 'destructive' });
    }
  };

  const handleAddEmployee = async () => {
    if (!newUserForm.full_name || !newUserForm.email || !newUserForm.password || !newUserForm.manager_id) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: { data: { role: 'employee' } }
      });

      if (authError) throw authError;

      const { error: employeeError } = await supabase.from('employees').insert({
        user_id: authData.user!.id,
        company_id: userRole?.company_id,
        full_name: newUserForm.full_name,
        email: newUserForm.email,
        password: newUserForm.password,
        manager_id: newUserForm.manager_id,
        is_active: true
      });

      if (employeeError) throw employeeError;

      toast({ title: 'Success', description: 'Employee added successfully' });
      setIsAddEmployeeModalOpen(false);
      setNewUserForm({ full_name: '', email: '', password: '', department: '', manager_id: '' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding employee:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add employee', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Managers View */}
      {initialView === 'managers' && (
        <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Managers</h2>
            <p className="text-muted-foreground">Manage your team leaders and their responsibilities.</p>
          </div>
          <Button onClick={() => { setAddUserType('manager'); setIsAddUserModalOpen(true); }}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Manager
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Input placeholder="Search managers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4" />
            </div>
          </div>
          <div className="w-64">
            <Select value={selectedDepartmentFilter} onValueChange={setSelectedDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {managers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No managers found</p>
            <Button className="mt-4" onClick={() => setIsAddUserModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add First Manager
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 mt-4">
            {filteredManagers.map((manager) => (
              <div key={manager.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">{manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}</h4>
                    <p className="text-sm text-muted-foreground">{manager.profile?.email || `ID: ${manager.user_id}`}</p>
                    {manager.profile?.department && <p className="text-xs text-blue-600 font-medium">{manager.profile.department}</p>}
                    <p className="text-xs text-muted-foreground">{manager.employees?.length || 0} employee{(manager.employees?.length || 0) !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Manager</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { /* view */ }}><Eye className="h-4 w-4 mr-2"/>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { /* edit */ }}><Edit className="h-4 w-4 mr-2"/>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { /* credentials */ }}><Shield className="h-4 w-4 mr-2"/>View Credentials</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => { /* delete */ }}><Trash2 className="h-4 w-4 mr-2"/>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Employees View */}
      {initialView === 'employees' && (
        <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Employees</h2>
            <p className="text-muted-foreground">Manage your team members and their assignments.</p>
          </div>
          <Button onClick={() => setIsAddEmployeeModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Input placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4" />
            </div>
          </div>
          <div className="w-64">
            <Label htmlFor="managerFilter">Filter by Manager</Label>
            <Select value={selectedManagerFilter} onValueChange={setSelectedManagerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All managers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All managers</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>{manager.profile?.full_name || manager.user_id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No employees found</p>
            <Button className="mt-4" onClick={() => setIsAddEmployeeModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add First Employee
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 mt-4">
            {filteredEmployees.map((employee) => (
              <div key={employee.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">{employee.profile?.full_name || `Employee ${employee.user_id.slice(0, 8)}`}</h4>
                    <p className="text-sm text-muted-foreground">{employee.profile?.email || `ID: ${employee.user_id}`}</p>
                    <p className="text-xs text-muted-foreground">Managed by: {employee.manager_name || managers.find(m => m.id === employee.manager_id)?.profile?.full_name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Employee</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {}}><Eye className="h-4 w-4 mr-2"/>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {}}><Edit className="h-4 w-4 mr-2"/>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {}}><Shield className="h-4 w-4 mr-2"/>View Credentials</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => {}}><Trash2 className="h-4 w-4 mr-2"/>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Add Manager Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Manager</DialogTitle>
            <DialogDescription>Create a new manager account for your organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="manager_full_name">Full Name *</Label>
              <Input
                id="manager_full_name"
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="manager_email">Email *</Label>
              <Input
                id="manager_email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="manager@example.com"
              />
            </div>
            <div>
              <Label htmlFor="manager_password">Password *</Label>
              <Input
                id="manager_password"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="manager_department">Department</Label>
              <Select value={newUserForm.department} onValueChange={(value) => setNewUserForm({ ...newUserForm, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddManager}>Add Manager</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Employee Modal */}
      <Dialog open={isAddEmployeeModalOpen} onOpenChange={setIsAddEmployeeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Create a new employee account and assign to a manager</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="employee_full_name">Full Name *</Label>
              <Input
                id="employee_full_name"
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="employee_email">Email *</Label>
              <Input
                id="employee_email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="employee@example.com"
              />
            </div>
            <div>
              <Label htmlFor="employee_password">Password *</Label>
              <Input
                id="employee_password"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="employee_manager">Assign to Manager *</Label>
              <Select value={newUserForm.manager_id} onValueChange={(value) => setNewUserForm({ ...newUserForm, manager_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.profile?.full_name || manager.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEmployeeModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEmployee}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
