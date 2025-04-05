import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Download, RefreshCw, Check, X } from "lucide-react";
import { toast } from "sonner";

export const HostsTab: React.FC = () => {
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [carCountFilter, setCarCountFilter] = useState("all");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("all");

  // Function to fetch hosts data
  const fetchHosts = async () => {
    setLoading(true);
    try {
      // First, get all cars grouped by host
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('host_id, id');
      
      if (carsError) throw carsError;
      
      // Group cars by host_id and count them
      const hostCars = carsData.reduce((acc, car) => {
        if (!acc[car.host_id]) {
          acc[car.host_id] = [];
        }
        acc[car.host_id].push(car.id);
        return acc;
      }, {});
      
      // Get host information from profiles
      const hostIds = Object.keys(hostCars);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, license_status, license_uploaded_at, phone_number');
      
      if (profilesError) throw profilesError;
      
      // Mock email data since we can't query auth.users directly
      // In a real app, you would have this info in your profiles table
      const mockEmailsForHosts = hostIds.map(id => ({
        id,
        email: `host_${id.substring(0, 5)}@example.com`
      }));
      
      // Combine the data
      const hostsData = hostIds.map(hostId => {
        const profile = profilesData.find(p => p.id === hostId) || {};
        const mockUser = mockEmailsForHosts.find(u => u.id === hostId) || { email: 'unknown@example.com' };
        
        return {
          id: hostId,
          email: mockUser.email,
          name: profile.full_name || 'Unknown Host',
          carCount: hostCars[hostId].length,
          approvalStatus: profile.license_status || 'not_submitted',
          verificationDate: profile.license_uploaded_at || null,
          cars: hostCars[hostId]
        };
      });
      
      // Apply filters
      let filteredHosts = [...hostsData];
      
      if (carCountFilter !== "all") {
        const [min, max] = carCountFilter.split("-").map(Number);
        if (max) {
          filteredHosts = filteredHosts.filter(host => host.carCount >= min && host.carCount <= max);
        } else {
          filteredHosts = filteredHosts.filter(host => host.carCount >= min);
        }
      }
      
      if (approvalStatusFilter !== "all") {
        filteredHosts = filteredHosts.filter(host => host.approvalStatus === approvalStatusFilter);
      }
      
      setHosts(filteredHosts);
    } catch (error) {
      console.error("Error fetching hosts:", error);
      toast.error("Failed to load hosts data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, [carCountFilter, approvalStatusFilter]);

  const exportToCSV = () => {
    try {
      // Format hosts data for CSV
      const csvData = hosts.map(host => ({
        id: host.id,
        email: host.email,
        name: host.name,
        car_count: host.carCount,
        status: host.approvalStatus,
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
      a.setAttribute('download', `hosts-${new Date().toISOString().split('T')[0]}.csv`);
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Hosts data exported successfully");
    } catch (error) {
      console.error("Error exporting hosts data:", error);
      toast.error("Failed to export hosts data");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Hosts Management</h2>
        <div className="flex gap-2">
          <Button onClick={fetchHosts} variant="outline" size="sm">
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
              <label className="block text-sm font-medium mb-1">Number of Cars</label>
              <Select value={carCountFilter} onValueChange={setCarCountFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by car count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hosts</SelectItem>
                  <SelectItem value="1-3">1-3 Cars</SelectItem>
                  <SelectItem value="4-10">4-10 Cars</SelectItem>
                  <SelectItem value="11">11+ Cars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-1">Approval Status</label>
              <Select value={approvalStatusFilter} onValueChange={setApprovalStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by approval status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending_verification">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="not_submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>
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
                    <TableHead>Host ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Cars Listed</TableHead>
                    <TableHead>Approval Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hosts found matching the current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    hosts.map((host) => (
                      <TableRow key={host.id}>
                        <TableCell className="font-mono text-xs">{host.id.substring(0, 8)}</TableCell>
                        <TableCell>{host.email}</TableCell>
                        <TableCell>{host.name}</TableCell>
                        <TableCell>{host.carCount}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            host.approvalStatus === 'verified' ? 'bg-green-100 text-green-800' :
                            host.approvalStatus === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                            host.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {host.approvalStatus.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {host.approvalStatus === 'verified' ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
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
