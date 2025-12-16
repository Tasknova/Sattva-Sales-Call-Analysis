import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, AlertTriangle, CheckCircle, UserCog, Trash2 } from "lucide-react";

interface SettingsTabProps {
  companySettings: { caller_id: string; from_numbers: string[] };
  setCompanySettings: (val: any) => void;
  newFromNumber: string;
  setNewFromNumber: (s: string) => void;
  selectedManagerFilter: string;
  setSelectedManagerFilter: (s: string) => void;
  bulkAssignManagerId: string;
  setBulkAssignManagerId: (s: string) => void;
  addFromNumber: () => Promise<void>;
  phoneAssignments: any[];
  removeFromNumber: (id: string) => Promise<void>;
  managers: any[];
  employees: any[];
}

export default function SettingsTab({
  companySettings,
  setCompanySettings,
  newFromNumber,
  setNewFromNumber,
  selectedManagerFilter,
  setSelectedManagerFilter,
  bulkAssignManagerId,
  setBulkAssignManagerId,
  addFromNumber,
  phoneAssignments,
  removeFromNumber,
  managers,
  employees,
}: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
          <Phone className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Phone Number Management</h2>
          <p className="text-muted-foreground">Assign phone numbers to employees for Exotel calling</p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Phone className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-purple-900">Phone Number Assignments</CardTitle>
              <CardDescription className="mt-0.5">
                Each phone number is assigned to one employee for making calls
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Phone Number Assignment Rules:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Each phone number can only be assigned to ONE employee</li>
                <li>Select a manager first, then choose an employee under that manager</li>
                <li>Employees can only use their assigned phone number for calling</li>
              </ul>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-gray-50 to-white">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              Add New Phone Number
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-phone-number">Phone Number</Label>
                <input
                  id="new-phone-number"
                  value={newFromNumber}
                  onChange={(e: any) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) {
                      setNewFromNumber(value);
                    }
                  }}
                  placeholder="Enter 10-digit phone number"
                  className="border-purple-200 focus:border-purple-400 p-2 rounded"
                  maxLength={10}
                />
                {newFromNumber && newFromNumber.length < 10 && (
                  <p className="text-xs text-red-600">
                    {10 - newFromNumber.length} more digit{10 - newFromNumber.length !== 1 ? 's' : ''} required
                  </p>
                )}
                {newFromNumber && newFromNumber.length === 10 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Valid phone number
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assign-manager">Manager</Label>
                <Select
                  value={selectedManagerFilter}
                  onValueChange={(value: string) => {
                    setSelectedManagerFilter(value);
                    setBulkAssignManagerId('');
                  }}
                >
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a Manager</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || 'Unnamed Manager'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assign-employee">Employee</Label>
                <Select
                  value={bulkAssignManagerId}
                  onValueChange={setBulkAssignManagerId}
                  disabled={!selectedManagerFilter || selectedManagerFilter === 'none'}
                >
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select an Employee</SelectItem>
                    {employees
                      .filter(emp => emp.manager_id === selectedManagerFilter)
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.profile?.full_name || 'Unnamed Employee'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={addFromNumber}
                disabled={!newFromNumber.trim() || !bulkAssignManagerId || bulkAssignManagerId === 'none'}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Phone Number
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Assigned Phone Numbers ({phoneAssignments.length})</Label>
              <Badge className="bg-purple-100 text-purple-700">{phoneAssignments.length} Active</Badge>
            </div>
            {phoneAssignments.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No phone numbers assigned yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first phone number above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {phoneAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Phone className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-mono font-semibold text-lg">{assignment.phone_number}</p>
                        <p className="text-sm text-gray-500">Assigned to: {assignment.employees?.full_name || 'Unassigned'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment.managers?.full_name && (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            <UserCog className="h-3 w-3 mr-1" />
                            {assignment.managers.full_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromNumber(assignment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
