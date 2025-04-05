
import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageSquare, Send, AlertCircle, Mail } from "lucide-react";

export interface NotificationStatus {
  success: boolean;
  method: 'whatsapp' | 'email' | 'none';
}

interface SuccessMessageProps {
  notificationStatus: NotificationStatus | null;
  onResendNotification: () => void;
  onClose: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  notificationStatus,
  onResendNotification,
  onClose
}) => {
  return (
    <div className="py-4 flex flex-col items-center text-center">
      <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
      <h3 className="text-xl font-semibold mb-2">Booking Request Sent!</h3>
      
      {notificationStatus && (
        <div className="mt-2 mb-4">
          {notificationStatus.success ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-full">
                {notificationStatus.method === 'whatsapp' ? (
                  <>
                    <MessageSquare className="h-5 w-5 mr-2" />
                    <span>Sent via WhatsApp</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    <span>Sent via Email</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Host has been notified about your booking request
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-full">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Notification delivery failed</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={onResendNotification}
              >
                <Send className="h-4 w-4 mr-2" />
                Resend Notification
              </Button>
            </div>
          )}
        </div>
      )}
      
      <p className="text-muted-foreground mb-6">
        Your booking request has been sent to the host for approval. You'll be notified when they respond.
      </p>
      <Button onClick={onClose} className="w-full">Close</Button>
    </div>
  );
};
