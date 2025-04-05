
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { Check, X, UploadCloud, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface KycUserDetailsProps {
  user: KycUser;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestReupload: () => void;
}

export const KycUserDetails: React.FC<KycUserDetailsProps> = ({
  user,
  onClose,
  onApprove,
  onReject,
  onRequestReupload
}) => {
  // Calculate how long the license has been pending
  const getPendingTime = () => {
    if (user.licenseStatus !== "pending_verification" || !user.licenseUploadedAt) {
      return null;
    }
    
    const uploadDate = new Date(user.licenseUploadedAt);
    return formatDistanceToNow(uploadDate, { addSuffix: true });
  };
  
  const pendingTime = getPendingTime();
  
  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review License - {user.email}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div>
            <h3 className="font-medium mb-2">User Information</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Email:</span>
                <span className="col-span-2">{user.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Full Name:</span>
                <span className="col-span-2">{user.fullName || "Not provided"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Phone:</span>
                <span className="col-span-2">{user.phoneNumber || "Not provided"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Registered:</span>
                <span className="col-span-2">{format(new Date(user.created_at), "MMM d, yyyy")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">License Status:</span>
                <span className="col-span-2 capitalize">
                  {user.licenseStatus.replace(/_/g, " ")}
                  {user.licenseStatus === "pending_verification" && (
                    <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3 mr-1" /> Waiting {pendingTime}
                    </Badge>
                  )}
                </span>
              </div>
              {user.licenseUploadedAt && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500">Upload Date:</span>
                  <span className="col-span-2">
                    {format(new Date(user.licenseUploadedAt), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">License Image</h3>
            {user.licenseImageUrl ? (
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={user.licenseImageUrl} 
                  alt="Driver's License" 
                  className="w-full h-auto max-h-64 object-contain" 
                />
              </div>
            ) : (
              <div className="border rounded-lg p-12 text-center bg-gray-50">
                <p className="text-gray-500">No license image available</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onRequestReupload} 
              className="gap-2"
            >
              <UploadCloud className="h-4 w-4" />
              Request Reupload
            </Button>
            <Button 
              variant="destructive" 
              onClick={onReject} 
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
            <Button 
              onClick={onApprove} 
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
