
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Download, RefreshCw, Flag, Check, X } from "lucide-react";
import { toast } from "sonner";

export const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState("all");
  const [flaggedFilter, setFlaggedFilter] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get profiles with license status information
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      
      // In a real application, you would have user data in your profiles table
      // Here we're simulating some additional user data
      const usersWithMetadata = profilesData.map(profile => {
        // Generate some mock data for demonstration
        const mockBookingsCount = Math.floor(Math.random() * 10);
        const isFlagged = Math.random() < 0.2; // 20% chance of being flagged
        const registrationDate = new Date();
        registrationDate.setDate(registrationDate.getDate() - Math.floor(Math.random() * 365));
        
        // Simulate user email (in a real app, you'd get this from your users table)
        const email = `user_${profile.id.substring(0, 5)}@example.com`;
        
        return {
          ...profile,
          email,
          bookingsCount: mockBookingsCount,
          isFlagged,
          registrationDate,
          kycStatus: profile.license_status || 'not_submitted'
        };
      });
      
      // Apply filters
      let filteredUsers = [...usersWithMetadata];
      
      if (kycFilter !== "all") {
        filteredUsers = filteredUsers.filter(user => user.kycStatus === kycFilter);
      }
      
      if (flaggedFilter) {
        filteredUsers = filteredUsers.filter(user => user.isFlagged);
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [kycFilter, flaggedFilter]);

  const exportToCSV = () => {
    try {
      // Format users data for CSV
      const csvData = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.full_name || 'Unknown',
        kyc_status: user.kycStatus,
        bookings: user.bookingsCount,
        flagged: user.isFlagged ? 'Yes' : 'No',
        registration_date: user.registrationDate.toISOString().split('T')[0]
      }));

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`);
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Users data exported successfully");
    } catch (error) {
      console.error("Error exporting users data:", error);
      toast.error("Failed to export users data");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <div className="flex gap-2">
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-1">KYC Status</label>
              <Select value={kycFilter} onValueChange={setKycFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by KYC status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="not_submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-1/2 flex items-end">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="flagged-users"
                  checked={flaggedFilter}
                  onChange={() => setFlaggedFilter(!flaggedFilter)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="flagged-users" className="text-sm font-medium flex items-center">
                  <Flag className="h-4 w-4 mr-1 text-red-500" />
                  Show Flagged Users Only
                </label>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Flagged</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found matching the current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.full_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.kycStatus === 'verified' ? 'bg-green-100 text-green-800' :
                            user.kycStatus === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                            user.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.kycStatus.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>{user.bookingsCount}</TableCell>
                        <TableCell>
                          {user.isFlagged ? (
                            <Flag className="h-5 w-5 text-red-500" />
                          ) : (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
