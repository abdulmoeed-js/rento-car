import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Shield, Check, X, UploadCloud, Clock, RefreshCw, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { KycUserDetails } from "@/components/admin/KycUserDetails";
import { KycActionDialog } from "@/components/admin/KycActionDialog";
import { useAuth } from "@/context/AuthContext";
import { pushPendingVerifications, approveAllPendingVerifications } from "@/utils/admin";

type KycUser = {
  id: string;
  email: string;
  created_at: string;
  licenseImageUrl?: string;
  licenseStatus: string;
  licenseUploadedAt?: string;
  fullName?: string;
  phoneNumber?: string;
};

type KycAction = "approve" | "reject" | "request-reupload" | null;

const AdminKyc = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<KycUser | null>(null);
  const [currentAction, setCurrentAction] = useState<KycAction>(null);
  const [actionReason, setActionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  // Fetch users with license submissions
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["kyc-users", showOnlyPending],
    queryFn: async () => {
      // Cast to any due to missing type definitions
      let query = (supabase as any)
        .from("profiles")
        .select("*, users:auth.users(email, created_at)")
        .not("license_status", "eq", "not_submitted")
        .not("license_status", "is", null)
        .order("license_uploaded_at", { ascending: false });
      
      if (showOnlyPending) {
        query = query.eq("license_status", "pending_verification");
      }

      const { data: profiles, error } = await query;

      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }

      return profiles.map((profile: any) => ({
        id: profile.id,
        email: profile.users?.email || 'Unknown',
        created_at: profile.users?.created_at || new Date().toISOString(),
        licenseImageUrl: profile.license_image_url,
        licenseStatus: profile.license_status,
        licenseUploadedAt: profile.license_uploaded_at,
        fullName: profile.full_name,
        phoneNumber: profile.phone_number,
      }));
    },
  });

  const handleSelectUser = (user: KycUser) => {
    setSelectedUser(user);
  };

  const handleAction = (action: KycAction) => {
    setCurrentAction(action);
    setActionReason("");
  };

  const handleCloseAction = () => {
    setCurrentAction(null);
    setActionReason("");
  };

  const submitAction = async () => {
    if (!selectedUser || !currentAction) return;

    setIsSubmitting(true);

    try {
      // First, update the user's license status
      const newStatus = 
        currentAction === "approve" ? "verified" : 
        currentAction === "reject" ? "rejected" : 
        "pending_reupload";

      // Cast to any because profiles table is not in type definitions
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({ license_status: newStatus })
        .eq("id", selectedUser.id);

      if (updateError) throw updateError;

      // Log the KYC review action
      // Cast to any because kyc_review_logs table is not in type definitions
      const { error: logError } = await (supabase as any)
        .from("kyc_review_logs")
        .insert({
          user_id: selectedUser.id,
          reviewer_id: currentUser?.id,
          action: currentAction,
          reason: actionReason,
          previous_status: selectedUser.licenseStatus,
          new_status: newStatus
        });

      if (logError) throw logError;

      // Show success toast and update UI
      toast({
        title: "Action completed",
        description: `License ${
          currentAction === "approve" ? "approved" : 
          currentAction === "reject" ? "rejected" : 
          "reupload requested"
        } successfully.`,
      });

      // Reset state and refresh data
      setSelectedUser(null);
      setCurrentAction(null);
      setActionReason("");
      refetch();
    } catch (error) {
      console.error('Error performing KYC action:', error);
      toast({
        title: "Error",
        description: "Failed to complete the action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePushPendingVerifications = async () => {
    setIsPushing(true);
    try {
      const result = await pushPendingVerifications();
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Successfully processed ${result.count} records.`,
        });
        
        // Refresh the list to show newly pushed verifications
        refetch();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to push pending verifications.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error pushing verifications:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleApproveAllPending = async () => {
    if (!currentUser?.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in as an admin to perform this action.",
        variant: "destructive",
      });
      return;
    }
    
    setIsApprovingAll(true);
    
    try {
      const result = await approveAllPendingVerifications(currentUser.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        
        // Refresh the list to show the updated statuses
        refetch();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve pending verifications.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error approving all verifications:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsApprovingAll(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      case 'pending_reupload':
        return <UploadCloud className="h-5 w-5 text-blue-500" />;
      case 'verified':
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> License Verification
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2 mr-4">
              <Checkbox 
                id="pending-only" 
                checked={showOnlyPending} 
                onCheckedChange={() => setShowOnlyPending(!showOnlyPending)}
              />
              <label 
                htmlFor="pending-only" 
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
              >
                <Filter className="h-3.5 w-3.5" />
                Pending only
              </label>
            </div>
            <Button 
              onClick={handleApproveAllPending} 
              disabled={isApprovingAll || isSubmitting}
              variant="default"
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Approve All Pending
            </Button>
            <Button 
              onClick={handlePushPendingVerifications} 
              disabled={isPushing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isPushing ? "animate-spin" : ""}`} />
              Find New Uploads
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading user data...</div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-lg text-gray-600">No license submissions found</p>
            <p className="text-sm text-gray-500 mt-2">Click "Find New Uploads" to check for new submissions</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableCaption>List of users with license submissions</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {getStatusBadge(user.licenseStatus)}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.fullName || "Not provided"}</TableCell>
                    <TableCell>
                      {user.licenseUploadedAt
                        ? format(new Date(user.licenseUploadedAt), "MMM d, yyyy HH:mm")
                        : "Not uploaded"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSelectUser(user)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* User details dialog */}
        {selectedUser && (
          <KycUserDetails 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)}
            onApprove={() => handleAction("approve")}
            onReject={() => handleAction("reject")}
            onRequestReupload={() => handleAction("request-reupload")}
          />
        )}

        {/* Action confirmation dialog */}
        {currentAction && (
          <KycActionDialog
            action={currentAction}
            reason={actionReason}
            onReasonChange={setActionReason}
            onConfirm={submitAction}
            onCancel={handleCloseAction}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  );
};

export default AdminKyc;
