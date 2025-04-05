import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Shield, Check, X, UploadCloud, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { KycUserDetails } from "@/components/admin/KycUserDetails";
import { KycActionDialog } from "@/components/admin/KycActionDialog";
import { useAuth } from "@/context/AuthContext";

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

  // Fetch users with pending license verification
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["kyc-users"],
    queryFn: async () => {
      // Using type assertion to work around TypeScript restrictions
      const { data: profiles, error } = await (supabase
        .from("profiles") as any)
        .select("*, users:auth.users(email, created_at)")
        .order("license_uploaded_at", { ascending: true })
        .not("license_status", "eq", "verified");

      if (error) throw error;

      return profiles.map((profile: any) => ({
        id: profile.id,
        email: profile.users.email,
        created_at: profile.users.created_at,
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

      // Using type assertion for profiles table
      const { error: updateError } = await (supabase
        .from("profiles") as any)
        .update({ license_status: newStatus })
        .eq("id", selectedUser.id);

      if (updateError) throw updateError;

      // Log the KYC review action
      // Using type assertion for kyc_review_logs table
      const { error: logError } = await (supabase
        .from("kyc_review_logs") as any)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      case 'pending_reupload':
        return <UploadCloud className="h-5 w-5 text-blue-500" />;
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
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading user data...</div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-lg text-gray-600">No pending verifications</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableCaption>List of users pending KYC verification</TableCaption>
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
