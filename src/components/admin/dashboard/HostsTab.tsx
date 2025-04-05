
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { logInfo, logError, LogType } from "@/utils/logger";

// Define interface for host data to fix type errors
interface Host {
  id: string;
  cars: string[];
  email: string;
  full_name: string | null;
  license_status: string | null;
  license_uploaded_at: string | null;
  verified: boolean;
}

export const HostsTab: React.FC = () => {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    setLoading(true);
    logInfo(LogType.ADMIN, "Fetching hosts data");
    
    try {
      // Get all cars with their host IDs
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('id, host_id');
      
      if (carsError) throw carsError;
      
      // Group cars by host ID
      const hostCars = (carsData || []).reduce((acc: Record<string, string[]>, car: any) => {
        if (!car.host_id) return acc;
        
        if (!acc[car.host_id]) {
          acc[car.host_id] = [];
        }
        acc[car.host_id].push(car.id);
        return acc;
      }, {} as Record<string, string[]>);
      
      // Get host information from profiles
      const hostIds = Object.keys(hostCars);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, license_status, license_uploaded_at')
        .in('id', hostIds);
      
      if (profilesError) throw profilesError;
      
      // For demo purposes, create mock email data
      const mockEmailsForHosts = hostIds.map(id => ({
        id,
        email: `host_${id.slice(0, 4)}@example.com`
      }));
      
      // Combine the data
      const hostsData = hostIds.map(hostId => {
        // Use safe type handling with default values
        const profile = profilesData?.find(p => p.id === hostId) || {
          id: hostId,
          full_name: null,
          license_status: null,
          license_uploaded_at: null
        };
        
        const mockUser = mockEmailsForHosts.find(u => u.id === hostId) || { email: 'unknown@example.com' };
        
        return {
          id: hostId,
          cars: hostCars[hostId],
          email: mockUser.email,
          full_name: profile.full_name,
          license_status: profile.license_status,
          license_uploaded_at: profile.license_uploaded_at,
          verified: profile.license_status === 'verified'
        };
      });
      
      setHosts(hostsData);
      logInfo(LogType.ADMIN, `Successfully fetched ${hostsData.length} hosts`);
    } catch (error) {
      logError(LogType.ADMIN, "Error fetching hosts data", { error });
      toast.error("Failed to load hosts data");
    } finally {
      setLoading(false);
    }
  };

  // Filter hosts by search query
  const filteredHosts = hosts.filter(host => {
    const query = searchQuery.toLowerCase();
    return (
      (host.full_name && host.full_name.toLowerCase().includes(query)) ||
      host.email.toLowerCase().includes(query) ||
      (host.license_status && host.license_status.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hosts Management</h2>
        <Button onClick={fetchHosts} variant="outline">Refresh</Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Input
              placeholder="Search hosts by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
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
                    <TableHead>Host</TableHead>
                    <TableHead>Cars Listed</TableHead>
                    <TableHead>Verification Status</TableHead>
                    <TableHead>Verification Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hosts found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHosts.map((host) => (
                      <TableRow key={host.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{host.full_name || 'Unnamed Host'}</div>
                            <div className="text-sm text-muted-foreground">{host.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{host.cars.length}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            host.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {host.license_status || 'Unverified'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {host.license_uploaded_at ? format(new Date(host.license_uploaded_at), 'MMM dd, yyyy') : 'Not uploaded'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View Details
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
