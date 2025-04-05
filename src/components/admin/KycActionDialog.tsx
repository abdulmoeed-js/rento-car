
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, UploadCloud } from "lucide-react";

type KycAction = "approve" | "reject" | "request-reupload" | null;

interface KycActionDialogProps {
  action: KycAction;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const KycActionDialog: React.FC<KycActionDialogProps> = ({
  action,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  isSubmitting
}) => {
  const actionDetails = {
    "approve": {
      title: "Approve License",
      description: "This will approve the user's license and allow them to use the platform.",
      icon: <Check className="h-5 w-5 text-green-500" />,
      buttonText: "Approve",
      buttonVariant: "default" as const,
      reasonRequired: false,
      reasonLabel: "Additional notes (optional)"
    },
    "reject": {
      title: "Reject License",
      description: "This will reject the user's license. They will need to contact support for assistance.",
      icon: <X className="h-5 w-5 text-red-500" />,
      buttonText: "Reject",
      buttonVariant: "destructive" as const,
      reasonRequired: true,
      reasonLabel: "Reason for rejection (required)"
    },
    "request-reupload": {
      title: "Request License Reupload",
      description: "This will request the user to upload a new license image.",
      icon: <UploadCloud className="h-5 w-5 text-blue-500" />,
      buttonText: "Request Reupload",
      buttonVariant: "outline" as const,
      reasonRequired: true,
      reasonLabel: "Reason for requesting reupload (required)"
    }
  };

  const details = action ? actionDetails[action] : null;
  
  if (!details) return null;

  const isReasonMissing = details.reasonRequired && !reason.trim();
  
  return (
    <Dialog open={!!action} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {details.icon} {details.title}
          </DialogTitle>
          <DialogDescription>
            {details.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">
            {details.reasonLabel}
          </label>
          <Textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={details.reasonRequired ? "Provide a clear reason" : "Optional notes"}
            className="min-h-[100px]"
          />
          {isReasonMissing && (
            <p className="text-sm text-red-500 mt-1">
              Please provide a reason for this action.
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant={details.buttonVariant}
            onClick={onConfirm}
            disabled={isReasonMissing || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? "Processing..." : details.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
